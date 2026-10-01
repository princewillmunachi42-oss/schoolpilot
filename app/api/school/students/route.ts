import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import pool from "@/lib/db";

async function getOwnerSchool(userId: string) {
  const result = await pool.query(
    `SELECT school_id
     FROM school_members
     WHERE user_id = $1
       AND role = 'owner'
     LIMIT 1`,
    [userId]
  );

  return result.rows[0]?.school_id ?? null;
}

function validateStudentFields(data: {
  admissionNumber: string;
  classId: string;
  firstName: string;
  lastName: string;
  otherName: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  status: string;
}) {
  const {
    admissionNumber,
    classId,
    firstName,
    lastName,
    otherName,
    gender,
    dateOfBirth,
    email,
    phone,
    status,
  } = data;

  if (!admissionNumber || !classId || !firstName || !lastName) {
    return "Admission number, class, first name, and last name are required.";
  }

  if (admissionNumber.length > 50) {
    return "Admission number must be 50 characters or fewer.";
  }

  if (firstName.length > 100 || lastName.length > 100) {
    return "First name and last name must be 100 characters or fewer.";
  }

  if (otherName.length > 100) {
    return "Other name must be 100 characters or fewer.";
  }

  if (!["", "male", "female", "other"].includes(gender)) {
    return "Invalid gender.";
  }

  if (!["active", "inactive", "graduated", "withdrawn"].includes(status)) {
    return "Invalid student status.";
  }

  if (email.length > 255) {
    return "Email must be 255 characters or fewer.";
  }

  if (phone.length > 30) {
    return "Phone number must be 30 characters or fewer.";
  }

  if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return "Invalid date of birth.";
  }

  return null;
}

async function verifyClass(schoolId: string, classId: string) {
  const result = await pool.query(
    `SELECT id
     FROM classes
     WHERE id = $1
       AND school_id = $2
       AND status = 'active'
     LIMIT 1`,
    [classId, schoolId]
  );

  return result.rowCount !== 0;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  const schoolId = await getOwnerSchool(user.id);

  if (!schoolId) {
    return NextResponse.json(
      { success: false, message: "Access denied." },
      { status: 403 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search")?.trim() ?? "";
  const classId = searchParams.get("classId")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";

  const values: string[] = [schoolId];
  const conditions = [`st.school_id = $1`];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`
      (
        st.first_name ILIKE $${values.length}
        OR st.last_name ILIKE $${values.length}
        OR st.other_name ILIKE $${values.length}
        OR st.admission_number ILIKE $${values.length}
      )
    `);
  }

  if (classId) {
    values.push(classId);
    conditions.push(`st.class_id = $${values.length}`);
  }

  if (status && ["active", "inactive", "graduated", "withdrawn"].includes(status)) {
    values.push(status);
    conditions.push(`st.status = $${values.length}`);
  }

  const result = await pool.query(
    `SELECT
       st.id,
       st.admission_number,
       st.first_name,
       st.last_name,
       st.other_name,
       st.gender,
       st.date_of_birth,
       st.email,
       st.phone,
       st.photo_url,
       st.status,
       st.class_id,
       c.name AS class_name
     FROM students st
     LEFT JOIN classes c
       ON c.id = st.class_id
      AND c.school_id = st.school_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY st.first_name ASC, st.last_name ASC`,
    values
  );

  return NextResponse.json({
    success: true,
    students: result.rows,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const schoolId = await getOwnerSchool(user.id);

  if (!schoolId) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const formData = await request.formData();

  const admissionNumber = String(
    formData.get("admissionNumber") ?? ""
  ).trim().toUpperCase();

  const classId = String(formData.get("classId") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const otherName = String(formData.get("otherName") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const status = String(formData.get("status") ?? "active").trim();

  const validationError = validateStudentFields({
    admissionNumber,
    classId,
    firstName,
    lastName,
    otherName,
    gender,
    dateOfBirth,
    email,
    phone,
    status,
  });

  if (validationError) {
    return NextResponse.json(
      { success: false, message: validationError },
      { status: 400 }
    );
  }

  if (!(await verifyClass(schoolId, classId))) {
    return NextResponse.json(
      {
        success: false,
        message: "Selected class does not belong to your school.",
      },
      { status: 400 }
    );
  }

  try {
    await pool.query(
      `INSERT INTO students (
        school_id,
        class_id,
        admission_number,
        first_name,
        last_name,
        other_name,
        gender,
        date_of_birth,
        email,
        phone,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        NULLIF($6, ''),
        NULLIF($7, ''),
        NULLIF($8, '')::date,
        NULLIF($9, ''),
        NULLIF($10, ''),
        $11
      )`,
      [
        schoolId,
        classId,
        admissionNumber,
        firstName,
        lastName,
        otherName,
        gender,
        dateOfBirth,
        email,
        phone,
        status,
      ]
    );
  } catch (error: unknown) {
    const pgError = error as { code?: string };

    if (pgError.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message: "That admission number already exists in this school.",
        },
        { status: 409 }
      );
    }

    console.error("Create student error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create student.",
      },
      { status: 500 }
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard/students?created=1", request.url)
  );
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  const schoolId = await getOwnerSchool(user.id);

  if (!schoolId) {
    return NextResponse.json(
      { success: false, message: "Access denied." },
      { status: 403 }
    );
  }

  let body: {
    id?: string;
    admissionNumber?: string;
    classId?: string;
    firstName?: string;
    lastName?: string;
    otherName?: string;
    gender?: string;
    dateOfBirth?: string;
    email?: string;
    phone?: string;
    status?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 }
    );
  }

  const id = String(body.id ?? "").trim();

  const admissionNumber = String(body.admissionNumber ?? "")
    .trim()
    .toUpperCase();

  const classId = String(body.classId ?? "").trim();
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const otherName = String(body.otherName ?? "").trim();
  const gender = String(body.gender ?? "").trim();
  const dateOfBirth = String(body.dateOfBirth ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const status = String(body.status ?? "active").trim();

  if (!id) {
    return NextResponse.json(
      { success: false, message: "Student ID is required." },
      { status: 400 }
    );
  }

  const validationError = validateStudentFields({
    admissionNumber,
    classId,
    firstName,
    lastName,
    otherName,
    gender,
    dateOfBirth,
    email,
    phone,
    status,
  });

  if (validationError) {
    return NextResponse.json(
      { success: false, message: validationError },
      { status: 400 }
    );
  }

  if (!(await verifyClass(schoolId, classId))) {
    return NextResponse.json(
      {
        success: false,
        message: "Selected class does not belong to your school.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `UPDATE students
       SET
         class_id = $1,
         admission_number = $2,
         first_name = $3,
         last_name = $4,
         other_name = NULLIF($5, ''),
         gender = NULLIF($6, ''),
         date_of_birth = NULLIF($7, '')::date,
         email = NULLIF($8, ''),
         phone = NULLIF($9, ''),
         status = $10
       WHERE id = $11
         AND school_id = $12
       RETURNING
         id,
         admission_number,
         first_name,
         last_name,
         other_name,
         gender,
         date_of_birth,
         email,
         phone,
         photo_url,
         status,
         class_id`,
      [
        classId,
        admissionNumber,
        firstName,
        lastName,
        otherName,
        gender,
        dateOfBirth,
        email,
        phone,
        status,
        id,
        schoolId,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Student not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      student: result.rows[0],
    });
  } catch (error: unknown) {
    const pgError = error as { code?: string };

    if (pgError.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message: "That admission number already exists in this school.",
        },
        { status: 409 }
      );
    }

    console.error("Update student error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update student." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  const schoolId = await getOwnerSchool(user.id);

  if (!schoolId) {
    return NextResponse.json(
      { success: false, message: "Access denied." },
      { status: 403 }
    );
  }

  const id = request.nextUrl.searchParams.get("id")?.trim() ?? "";

  if (!id) {
    return NextResponse.json(
      { success: false, message: "Student ID is required." },
      { status: 400 }
    );
  }

  const result = await pool.query(
    `UPDATE students
     SET status = 'inactive'
     WHERE id = $1
       AND school_id = $2
     RETURNING id, status`,
    [id, schoolId]
  );

  if (result.rowCount === 0) {
    return NextResponse.json(
      { success: false, message: "Student not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Student deactivated successfully.",
    student: result.rows[0],
  });
}
