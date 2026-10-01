import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  const membershipResult = await pool.query(
    `SELECT school_id
     FROM school_members
     WHERE user_id = $1
       AND role = 'owner'
     LIMIT 1`,
    [user.id],
  );

  const membership = membershipResult.rows[0];

  if (!membership) {
    return NextResponse.json(
      { success: false, message: "Only the school owner can upload student photos." },
      { status: 403 },
    );
  }

  try {
    const formData = await request.formData();

    const studentId = formData.get("student_id");
    const file = formData.get("photo");

    if (typeof studentId !== "string" || !studentId) {
      return NextResponse.json(
        { success: false, message: "Student ID is required." },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Photo file is required." },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        {
          success: false,
          message: "Only JPG, PNG, and WebP images are allowed.",
        },
        { status: 400 },
      );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Photo must be between 1 byte and 5 MB.",
        },
        { status: 400 },
      );
    }

    const studentResult = await pool.query(
      `SELECT id, photo_url
       FROM students
       WHERE id = $1
         AND school_id = $2
       LIMIT 1`,
      [studentId, membership.school_id],
    );

    const student = studentResult.rows[0];

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found." },
        { status: 404 },
      );
    }

    const extension = ALLOWED_TYPES[file.type];
    const filename = `${studentId}-${crypto.randomUUID()}${extension}`;
    const schoolDirectory = path.join(
      process.cwd(),
      "storage",
      "student-photos",
      membership.school_id,
    );

    await fs.mkdir(schoolDirectory, { recursive: true });

    const filePath = path.join(schoolDirectory, filename);
    const bytes = Buffer.from(await file.arrayBuffer());

    await fs.writeFile(filePath, bytes);

    const photoUrl = `/api/school/students/photo/${student.id}`;

    await pool.query(
      `UPDATE students
       SET photo_url = $1
       WHERE id = $2
         AND school_id = $3`,
      [photoUrl, student.id, membership.school_id],
    );

    return NextResponse.json({
      success: true,
      photo_url: photoUrl,
    });
  } catch (error) {
    console.error("Student photo upload error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to upload student photo." },
      { status: 500 },
    );
  }
}
