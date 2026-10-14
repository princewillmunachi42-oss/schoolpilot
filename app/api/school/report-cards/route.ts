import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentTeacher } from "@/lib/auth/teacher";

type Access = {
  userId: string;
  schoolId: string;
  role: string;
  staffId?: string;
};

async function getAccess(userId: string): Promise<Access | null> {
  const result = await pool.query(
    `SELECT school_id, role
     FROM school_members
     WHERE user_id = $1
       AND role IN ('owner', 'principal', 'admin', 'teacher')
     ORDER BY CASE role
       WHEN 'owner' THEN 1
       WHEN 'principal' THEN 2
       WHEN 'admin' THEN 3
       ELSE 4
     END
     LIMIT 1`,
    [userId]
  );

  const membership = result.rows[0];
  if (!membership) return null;

  if (membership.role !== "teacher") {
    return {
      userId,
      schoolId: membership.school_id,
      role: membership.role,
    };
  }

  const teacher = await getCurrentTeacher();
  if (!teacher || teacher.schoolId !== membership.school_id) return null;

  return {
    userId,
    schoolId: teacher.schoolId,
    role: "teacher",
    staffId: teacher.staffId,
  };
}

async function canAccessStudent(
  access: Access,
  studentId: string,
  sessionId: string
) {
  const studentResult = await pool.query(
    `SELECT
       st.id, st.admission_number, st.first_name, st.last_name,
       st.other_name, st.gender, st.date_of_birth, st.photo_url,
       st.class_id, st.status,
       c.name AS class_name,
       c.academic_session_id AS class_session_id
     FROM students st
     LEFT JOIN classes c
       ON c.id = st.class_id
      AND c.school_id = st.school_id
     WHERE st.id = $1 AND st.school_id = $2
     LIMIT 1`,
    [studentId, access.schoolId]
  );

  const student = studentResult.rows[0];
  if (!student) return { student: null, allowed: false };

  if (access.role !== "teacher") {
    return { student, allowed: true };
  }

  if (
    !student.class_id ||
    student.class_session_id !== sessionId
  ) {
    return { student, allowed: false };
  }

  const assignment = await pool.query(
    `SELECT 1
     FROM class_teachers
     WHERE school_id = $1
       AND class_id = $2
       AND staff_id = $3
     LIMIT 1`,
    [access.schoolId, student.class_id, access.staffId]
  );

  return { student, allowed: Boolean(assignment.rows[0]) };
}

async function validatePeriod(
  schoolId: string,
  sessionId: string,
  termId: string
) {
  const result = await pool.query(
    `SELECT
       s.id AS session_id, s.name AS session_name,
       s.start_date AS session_start, s.end_date AS session_end,
       t.id AS term_id, t.name AS term_name,
       t.start_date AS term_start, t.end_date AS term_end
     FROM academic_sessions s
     JOIN terms t
       ON t.academic_session_id = s.id
      AND t.school_id = s.school_id
     WHERE s.id = $1
       AND t.id = $2
       AND s.school_id = $3
     LIMIT 1`,
    [sessionId, termId, schoolId]
  );

  return result.rows[0] ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await getAccess(user.id);
    if (!access) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const params = request.nextUrl.searchParams;
    const studentId = params.get("student_id") || "";
    const sessionId = params.get("academic_session_id") || "";
    const termId = params.get("term_id") || "";

    if (!studentId || !sessionId || !termId) {
      return NextResponse.json(
        {
          error:
            "student_id, academic_session_id and term_id are required",
        },
        { status: 400 }
      );
    }

    const period = await validatePeriod(
      access.schoolId,
      sessionId,
      termId
    );

    if (!period) {
      return NextResponse.json(
        { error: "Academic session or term not found for this school" },
        { status: 404 }
      );
    }

    const { student, allowed } = await canAccessStudent(
      access,
      studentId,
      sessionId
    );

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const schoolResult = await pool.query(
      `SELECT name, email, phone, address, city, state, country
       FROM schools WHERE id = $1 LIMIT 1`,
      [access.schoolId]
    );

    const resultsResult = await pool.query(
      `SELECT
         r.id, r.subject_id, sub.name AS subject_name,
         sub.code AS subject_code,
         r.ca_score, r.exam_score, r.total_score,
         r.grade, r.remarks
       FROM results r
       JOIN subjects sub
         ON sub.id = r.subject_id
        AND sub.school_id = r.school_id
       WHERE r.school_id = $1
         AND r.student_id = $2
         AND r.academic_session_id = $3
         AND r.term_id = $4
       ORDER BY sub.name ASC`,
      [access.schoolId, studentId, sessionId, termId]
    );

    const attendanceResult = await pool.query(
      `SELECT
         COUNT(*)::int AS total_recorded,
         COUNT(*) FILTER (WHERE status = 'present')::int AS present,
         COUNT(*) FILTER (WHERE status = 'absent')::int AS absent,
         COUNT(*) FILTER (WHERE status = 'late')::int AS late,
         COUNT(*) FILTER (WHERE status = 'excused')::int AS excused
       FROM attendance_records
       WHERE school_id = $1
         AND student_id = $2
         AND academic_session_id = $3
         AND term_id = $4`,
      [access.schoolId, studentId, sessionId, termId]
    );

    const summaryResult = await pool.query(
      `SELECT
         COUNT(*)::int AS subjects_recorded,
         ROUND(AVG(total_score)::numeric, 2) AS average_score,
         ROUND(SUM(total_score)::numeric, 2) AS total_score
       FROM results
       WHERE school_id = $1
         AND student_id = $2
         AND academic_session_id = $3
         AND term_id = $4`,
      [access.schoolId, studentId, sessionId, termId]
    );

    let position: number | null = null;
    let classSize: number | null = null;

    if (
      student.class_id &&
      student.class_session_id === sessionId
    ) {
      const rankingResult = await pool.query(
        `WITH class_averages AS (
           SELECT
             st.id AS student_id,
             AVG(r.total_score) AS average_score
           FROM students st
           LEFT JOIN results r
             ON r.student_id = st.id
            AND r.school_id = st.school_id
            AND r.academic_session_id = $3
            AND r.term_id = $4
           WHERE st.school_id = $1
             AND st.class_id = $2
             AND st.status = 'active'
           GROUP BY st.id
           HAVING COUNT(r.id) > 0
         ),
         ranked AS (
           SELECT
             student_id,
             RANK() OVER (ORDER BY average_score DESC) AS position
           FROM class_averages
         )
         SELECT
           (SELECT position FROM ranked WHERE student_id = $5) AS position,
           (SELECT COUNT(*)::int FROM class_averages) AS class_size`,
        [
          access.schoolId,
          student.class_id,
          sessionId,
          termId,
          studentId,
        ]
      );

      position = rankingResult.rows[0]?.position ?? null;
      classSize = rankingResult.rows[0]?.class_size ?? 0;
    }

    const reportResult = await pool.query(
      `SELECT
         teacher_comment, principal_comment, conduct_comment,
         status, published_at
       FROM student_report_cards
       WHERE school_id = $1
         AND student_id = $2
         AND academic_session_id = $3
         AND term_id = $4
       LIMIT 1`,
      [access.schoolId, studentId, sessionId, termId]
    );

    const attendance = attendanceResult.rows[0];
    const totalRecorded = Number(attendance.total_recorded);
    const present = Number(attendance.present);
    const report = reportResult.rows[0] ?? {
      teacher_comment: null,
      principal_comment: null,
      conduct_comment: null,
      status: "draft",
      published_at: null,
    };

    return NextResponse.json({
      school: schoolResult.rows[0] ?? null,
      student,
      session: {
        id: period.session_id,
        name: period.session_name,
        start_date: period.session_start,
        end_date: period.session_end,
      },
      term: {
        id: period.term_id,
        name: period.term_name,
        start_date: period.term_start,
        end_date: period.term_end,
      },
      results: resultsResult.rows,
      summary: summaryResult.rows[0],
      ranking: { position, class_size: classSize },
      attendance: {
        ...attendance,
        rate: totalRecorded > 0
          ? Number(((present / totalRecorded) * 100).toFixed(2))
          : null,
        rate_definition: "Present records divided by all recorded attendance days",
      },
      report_card: report,
    });
  } catch (error) {
    console.error("Report cards GET error:", error);
    return NextResponse.json(
      { error: "Failed to load report card" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await getAccess(user.id);
    if (!access) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const studentId =
      typeof body.student_id === "string" ? body.student_id : "";
    const sessionId =
      typeof body.academic_session_id === "string"
        ? body.academic_session_id
        : "";
    const termId =
      typeof body.term_id === "string" ? body.term_id : "";

    if (!studentId || !sessionId || !termId) {
      return NextResponse.json(
        { error: "student_id, academic_session_id and term_id are required" },
        { status: 400 }
      );
    }

    const period = await validatePeriod(access.schoolId, sessionId, termId);
    if (!period) {
      return NextResponse.json(
        { error: "Academic session or term not found for this school" },
        { status: 404 }
      );
    }

    const { student, allowed } = await canAccessStudent(
      access,
      studentId,
      sessionId
    );

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isManager = ["owner", "principal", "admin"].includes(access.role);

    if (!isManager && access.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teacherComment =
      typeof body.teacher_comment === "string"
        ? body.teacher_comment.trim()
        : null;
    const principalComment =
      typeof body.principal_comment === "string"
        ? body.principal_comment.trim()
        : null;
    const conductComment =
      typeof body.conduct_comment === "string"
        ? body.conduct_comment.trim()
        : null;
    const requestedStatus =
      typeof body.status === "string" ? body.status : null;

    if (
      isManager &&
      requestedStatus !== null &&
      !["draft", "published"].includes(requestedStatus)
    ) {
      return NextResponse.json(
        { error: "status must be draft or published" },
        { status: 400 }
      );
    }

    if (
      [teacherComment, principalComment, conductComment].some(
        (value) => value !== null && value.length > 2000
      )
    ) {
      return NextResponse.json(
        { error: "Comments must not exceed 2000 characters each" },
        { status: 400 }
      );
    }

    const existingResult = await pool.query(
      `SELECT id, teacher_comment, principal_comment, conduct_comment, status
       FROM student_report_cards
       WHERE school_id = $1
         AND student_id = $2
         AND academic_session_id = $3
         AND term_id = $4
       LIMIT 1`,
      [access.schoolId, studentId, sessionId, termId]
    );
    const existing = existingResult.rows[0];

    if (!isManager && existing?.status === "published") {
      return NextResponse.json(
        { error: "Published report cards can only be changed by school management" },
        { status: 403 }
      );
    }

    const nextTeacherComment = isManager
      ? teacherComment ?? existing?.teacher_comment ?? null
      : teacherComment ?? existing?.teacher_comment ?? null;
    const nextPrincipalComment = isManager
      ? principalComment ?? existing?.principal_comment ?? null
      : existing?.principal_comment ?? null;
    const nextConductComment = isManager
      ? conductComment ?? existing?.conduct_comment ?? null
      : existing?.conduct_comment ?? null;
    const nextStatus = isManager
      ? requestedStatus ?? existing?.status ?? "draft"
      : existing?.status ?? "draft";

    const saved = await pool.query(
      `INSERT INTO student_report_cards (
         school_id, student_id, academic_session_id, term_id,
         teacher_comment, principal_comment, conduct_comment,
         status, published_at, published_by
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8,
         CASE WHEN $8 = 'published' THEN NOW() ELSE NULL END,
         CASE WHEN $8 = 'published' THEN $9::uuid ELSE NULL END
       )
       ON CONFLICT (school_id, student_id, academic_session_id, term_id)
       DO UPDATE SET
         teacher_comment = EXCLUDED.teacher_comment,
         principal_comment = EXCLUDED.principal_comment,
         conduct_comment = EXCLUDED.conduct_comment,
         status = EXCLUDED.status,
         published_at = CASE
           WHEN EXCLUDED.status = 'published'
             THEN COALESCE(student_report_cards.published_at, NOW())
           ELSE NULL
         END,
         published_by = CASE
           WHEN EXCLUDED.status = 'published'
             THEN EXCLUDED.published_by
           ELSE NULL
         END,
         updated_at = NOW()
       RETURNING id, teacher_comment, principal_comment,
         conduct_comment, status, published_at, updated_at`,
      [
        access.schoolId,
        studentId,
        sessionId,
        termId,
        nextTeacherComment,
        nextPrincipalComment,
        nextConductComment,
        nextStatus,
        isManager ? access.userId : null,
      ]
    );

    return NextResponse.json({ report_card: saved.rows[0] });
  } catch (error) {
    console.error("Report cards POST error:", error);
    return NextResponse.json(
      { error: "Failed to save report card" },
      { status: 500 }
    );
  }
}
