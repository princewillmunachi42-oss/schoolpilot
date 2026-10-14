import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentTeacher } from "@/lib/auth/teacher";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const membershipResult = await pool.query(
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
      [user.id]
    );

    const membership = membershipResult.rows[0];

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const schoolId = membership.school_id;
    const role = membership.role;
    let staffId: string | null = null;

    if (role === "teacher") {
      const teacher = await getCurrentTeacher();

      if (!teacher || teacher.schoolId !== schoolId) {
        return NextResponse.json(
          { error: "Teacher access could not be verified" },
          { status: 403 }
        );
      }

      staffId = teacher.staffId;
    }

    const params = request.nextUrl.searchParams;
    const sessionId = params.get("session_id") || "";
    const classId = params.get("class_id") || "";

    const sessionsResult = await pool.query(
      `SELECT id, name, start_date, end_date, is_current
       FROM academic_sessions
       WHERE school_id = $1
       ORDER BY start_date DESC`,
      [schoolId]
    );

    const termsResult = await pool.query(
      `SELECT id, name, academic_session_id, start_date, end_date, is_current
       FROM terms
       WHERE school_id = $1
       ORDER BY start_date ASC`,
      [schoolId]
    );

    let classes: unknown[] = [];
    let students: unknown[] = [];

    if (sessionId) {
      const sessionCheck = await pool.query(
        `SELECT id
         FROM academic_sessions
         WHERE id = $1 AND school_id = $2
         LIMIT 1`,
        [sessionId, schoolId]
      );

      if (!sessionCheck.rows[0]) {
        return NextResponse.json(
          { error: "Academic session not found" },
          { status: 404 }
        );
      }

      const classParams: unknown[] = [schoolId, sessionId];
      let teacherFilter = "";

      if (role === "teacher") {
        classParams.push(staffId);
        teacherFilter = `
          AND EXISTS (
            SELECT 1
            FROM class_teachers ct
            WHERE ct.school_id = c.school_id
              AND ct.class_id = c.id
              AND ct.staff_id = $3
          )`;
      }

      const classesResult = await pool.query(
        `SELECT c.id, c.name, c.academic_session_id
         FROM classes c
         WHERE c.school_id = $1
           AND c.academic_session_id = $2
           AND c.status = 'active'
           ${teacherFilter}
         ORDER BY c.name ASC`,
        classParams
      );

      classes = classesResult.rows;

      if (classId) {
        const selectedClass = classesResult.rows.find(
          (item) => item.id === classId
        );

        if (!selectedClass) {
          return NextResponse.json(
            { error: "Class not found or access denied" },
            { status: 403 }
          );
        }

        const studentsResult = await pool.query(
          `SELECT
             st.id,
             st.admission_number,
             st.first_name,
             st.last_name,
             st.other_name,
             st.class_id
           FROM students st
           WHERE st.school_id = $1
             AND st.class_id = $2
             AND st.status = 'active'
           ORDER BY st.last_name ASC, st.first_name ASC`,
          [schoolId, classId]
        );

        students = studentsResult.rows;
      }
    }

    return NextResponse.json({
      success: true,
      role,
      sessions: sessionsResult.rows,
      terms: termsResult.rows,
      classes,
      students,
    });
  } catch (error) {
    console.error("Report-card options GET error:", error);

    return NextResponse.json(
      { error: "Failed to load report-card options" },
      { status: 500 }
    );
  }
}
