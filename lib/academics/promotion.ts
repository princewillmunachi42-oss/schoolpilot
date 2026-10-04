import { PoolClient } from "pg";
async function notifyParents(
  client: PoolClient,
  schoolId: string,
  studentId: string,
  title: string,
  message: string,
  type: string
) {
  const parentResult = await client.query(
    `
      SELECT DISTINCT
        p.user_id
      FROM parent_students ps
      JOIN parents p
        ON p.id = ps.parent_id
       AND p.school_id = ps.school_id
      WHERE ps.school_id = $1
        AND ps.student_id = $2
        AND p.status = 'active'
        AND p.user_id IS NOT NULL
    `,
    [schoolId, studentId]
  );

  for (const parent of parentResult.rows) {
    await client.query(
      `
        INSERT INTO notifications (
          school_id,
          user_id,
          title,
          message,
          type,
          link
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        schoolId,
        parent.user_id,
        title,
        message,
        type,
        `/parent/children/${studentId}`,
      ]
    );
  }
}
type PromotionResult = {
  promoted: number;
  repeated: number;
  graduated: number;
  withdrawn: number;
  transferred: number;
  skipped: number;
};

export async function processStudentPromotions(
  client: PoolClient,
  schoolId: string,
  previousSessionId: string | null,
  newSessionId: string
): Promise<PromotionResult> {
  const result: PromotionResult = {
    promoted: 0,
    repeated: 0,
    graduated: 0,
    withdrawn: 0,
    transferred: 0,
    skipped: 0,
  };

  if (!previousSessionId || previousSessionId === newSessionId) {
    return result;
  }

  /*
   * Process students who were enrolled in the previous session.
   * Historical enrollment records remain untouched.
   */
  const enrollmentResult = await client.query(
    `
      SELECT
  se.student_id,
  se.class_id,
  se.status,
  se.promotion_decision,
  se.next_class_id,
  s.status AS student_status,
  CONCAT_WS(' ', s.first_name, s.other_name, s.last_name) AS student_name,
  old_class.name AS old_class_name,
  previous_session.name AS previous_session_name,
  new_session.name AS new_session_name
FROM student_enrollments se
JOIN students s
  ON s.id = se.student_id
 AND s.school_id = se.school_id
JOIN classes old_class
  ON old_class.id = se.class_id
 AND old_class.school_id = se.school_id
JOIN academic_sessions previous_session
  ON previous_session.id = se.academic_session_id
 AND previous_session.school_id = se.school_id
JOIN academic_sessions new_session
  ON new_session.id = $3
 AND new_session.school_id = se.school_id
      WHERE se.school_id = $1
        AND se.academic_session_id = $2
    `,
    [schoolId, previousSessionId, newSessionId]
  );

  for (const enrollment of enrollmentResult.rows) {
    /*
     * Already completed/processed enrollments must not be processed again.
     */
    if (
      ["completed", "repeated", "graduated", "withdrawn", "transferred"].includes(
        enrollment.status
      )
    ) {
      result.skipped++;
      continue;
    }

    /*
     * The owner must explicitly decide what happens to the student.
     */
    if (enrollment.promotion_decision === "pending") {
      result.skipped++;
      continue;
    }

    /*
     * Withdraw:
     * The student leaves the school and receives no new enrollment.
     */
    if (enrollment.promotion_decision === "withdraw") {
      await client.query(
        `
          UPDATE student_enrollments
          SET
            status = 'withdrawn',
            updated_at = NOW()
          WHERE student_id = $1
            AND academic_session_id = $2
        `,
        [enrollment.student_id, previousSessionId]
      );

      await client.query(
        `
          UPDATE students
          SET
            status = 'withdrawn',
            updated_at = NOW()
          WHERE id = $1
            AND school_id = $2
        `,
        [enrollment.student_id, schoolId]
      );

      await notifyParents(
  client,
  schoolId,
  enrollment.student_id,
  "Student withdrawn",
  `${enrollment.student_name} has been withdrawn from the school after the ${enrollment.previous_session_name} academic session.`,
  "promotion"
);

result.withdrawn++;
continue;
    }

    /*
     * Transfer:
     * The student leaves this school and receives no new enrollment.
     */
    if (enrollment.promotion_decision === "transfer") {
      await client.query(
        `
          UPDATE student_enrollments
          SET
            status = 'transferred',
            updated_at = NOW()
          WHERE student_id = $1
            AND academic_session_id = $2
        `,
        [enrollment.student_id, previousSessionId]
      );

      await client.query(
        `
          UPDATE students
          SET
            status = 'transferred',
            updated_at = NOW()
          WHERE id = $1
            AND school_id = $2
        `,
        [enrollment.student_id, schoolId]
      );

      await notifyParents(
  client,
  schoolId,
  enrollment.student_id,
  "Student transferred",
  `${enrollment.student_name} has been marked as transferred after the ${enrollment.previous_session_name} academic session.`,
  "promotion"
);

result.transferred++;
continue;
    }

    /*
     * Graduate:
     * The student finishes the previous session without
     * receiving a new class enrollment.
     */
    if (enrollment.promotion_decision === "graduate") {
      await client.query(
        `
          UPDATE student_enrollments
          SET
            status = 'graduated',
            updated_at = NOW()
          WHERE student_id = $1
            AND academic_session_id = $2
        `,
        [enrollment.student_id, previousSessionId]
      );

      await client.query(
        `
          UPDATE students
          SET
            status = 'graduated',
            updated_at = NOW()
          WHERE id = $1
            AND school_id = $2
        `,
        [enrollment.student_id, schoolId]
      );

      await notifyParents(
  client,
  schoolId,
  enrollment.student_id,
  "Student graduated",
  `${enrollment.student_name} has graduated from the school after completing the ${enrollment.previous_session_name} academic session.`,
  "promotion"
);

result.graduated++;
continue;
    }

    /*
     * Promote:
     * next_class_id must already have been configured by the owner.
     */
    if (enrollment.promotion_decision === "promote") {
      if (!enrollment.next_class_id) {
        result.skipped++;
        continue;
      }

      const targetClassResult = await client.query(
        `
          SELECT id
          FROM classes
          WHERE id = $1
            AND school_id = $2
            AND academic_session_id = $3
            AND status = 'active'
          LIMIT 1
        `,
        [
          enrollment.next_class_id,
          schoolId,
          newSessionId,
        ]
      );

      if (targetClassResult.rows.length === 0) {
        result.skipped++;
        continue;
      }

      await client.query(
        `
          INSERT INTO student_enrollments (
            school_id,
            student_id,
            academic_session_id,
            class_id,
            status,
            promotion_decision
          )
          VALUES ($1, $2, $3, $4, 'active', 'pending')
          ON CONFLICT (student_id, academic_session_id)
          DO UPDATE SET
            class_id = EXCLUDED.class_id,
            status = 'active',
            updated_at = NOW()
        `,
        [
          schoolId,
          enrollment.student_id,
          newSessionId,
          enrollment.next_class_id,
        ]
      );

      await client.query(
        `
          UPDATE student_enrollments
          SET
            status = 'completed',
            updated_at = NOW()
          WHERE student_id = $1
            AND academic_session_id = $2
        `,
        [enrollment.student_id, previousSessionId]
      );

      await client.query(
        `
          UPDATE students
          SET
            class_id = $1,
            status = 'active',
            updated_at = NOW()
          WHERE id = $2
            AND school_id = $3
        `,
        [
          enrollment.next_class_id,
          enrollment.student_id,
          schoolId,
        ]
      );

     const promotedClassResult = await client.query(
  `
    SELECT name
    FROM classes
    WHERE id = $1
      AND school_id = $2
    LIMIT 1
  `,
  [enrollment.next_class_id, schoolId]
);

const promotedClassName =
  promotedClassResult.rows[0]?.name ?? "the next class";

await notifyParents(
  client,
  schoolId,
  enrollment.student_id,
  "Student promoted",
  `${enrollment.student_name} has been promoted from ${enrollment.old_class_name} to ${promotedClassName} for the ${enrollment.new_session_name} academic session.`,
  "promotion"
);

result.promoted++;
continue;
    }

    /*
     * Repeat:
     * Find the configured equivalent class in the new session.
     */
    if (enrollment.promotion_decision === "repeat") {
      const progressionResult = await client.query(
        `
          SELECT repeat_class_id
          FROM class_progressions
          WHERE school_id = $1
            AND from_class_id = $2
            AND to_academic_session_id = $3
          LIMIT 1
        `,
        [
          schoolId,
          enrollment.class_id,
          newSessionId,
        ]
      );

      const repeatClassId =
        progressionResult.rows[0]?.repeat_class_id;

      if (!repeatClassId) {
        result.skipped++;
        continue;
      }

      const repeatClassResult = await client.query(
        `
          SELECT id
          FROM classes
          WHERE id = $1
            AND school_id = $2
            AND academic_session_id = $3
            AND status = 'active'
          LIMIT 1
        `,
        [
          repeatClassId,
          schoolId,
          newSessionId,
        ]
      );

      if (repeatClassResult.rows.length === 0) {
        result.skipped++;
        continue;
      }

      await client.query(
        `
          INSERT INTO student_enrollments (
            school_id,
            student_id,
            academic_session_id,
            class_id,
            status,
            promotion_decision
          )
          VALUES ($1, $2, $3, $4, 'active', 'pending')
          ON CONFLICT (student_id, academic_session_id)
          DO UPDATE SET
            class_id = EXCLUDED.class_id,
            status = 'active',
            updated_at = NOW()
        `,
        [
          schoolId,
          enrollment.student_id,
          newSessionId,
          repeatClassId,
        ]
      );

      await client.query(
        `
          UPDATE student_enrollments
          SET
            status = 'repeated',
            updated_at = NOW()
          WHERE student_id = $1
            AND academic_session_id = $2
        `,
        [enrollment.student_id, previousSessionId]
      );

      await client.query(
        `
          UPDATE students
          SET
            class_id = $1,
            status = 'active',
            updated_at = NOW()
          WHERE id = $2
            AND school_id = $3
        `,
        [
          repeatClassId,
          enrollment.student_id,
          schoolId,
        ]
      );

      const repeatedClassResult = await client.query(
  `
    SELECT name
    FROM classes
    WHERE id = $1
      AND school_id = $2
    LIMIT 1
  `,
  [repeatClassId, schoolId]
);

const repeatedClassName =
  repeatedClassResult.rows[0]?.name ?? enrollment.old_class_name;

await notifyParents(
  client,
  schoolId,
  enrollment.student_id,
  "Student repeating class",
  `${enrollment.student_name} will repeat ${repeatedClassName} in the ${enrollment.new_session_name} academic session.`,
  "promotion"
);

result.repeated++;
continue;
    }

    result.skipped++;
  }

  return result;
}
