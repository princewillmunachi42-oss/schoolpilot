import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

type PhotoRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  { params }: PhotoRouteProps,
) {
  const user = await getCurrentUser();

  if (!user) {
    return new NextResponse("Unauthorized.", { status: 401 });
  }

  const membershipResult = await pool.query(
    `SELECT school_id
     FROM school_members
     WHERE user_id = $1
     LIMIT 1`,
    [user.id],
  );

  const membership = membershipResult.rows[0];

  if (!membership) {
    return new NextResponse("Forbidden.", { status: 403 });
  }

  const { id } = await params;

  const studentResult = await pool.query(
    `SELECT photo_url
     FROM students
     WHERE id = $1
       AND school_id = $2
     LIMIT 1`,
    [id, membership.school_id],
  );

  const student = studentResult.rows[0];

  if (!student?.photo_url) {
    return new NextResponse("Photo not found.", { status: 404 });
  }

  const photoUrl = String(student.photo_url);

  if (!photoUrl.startsWith("/api/school/students/photo/")) {
    return new NextResponse("Invalid photo reference.", { status: 404 });
  }

  const filename = path.basename(photoUrl);

  if (!filename || filename !== id) {
    return new NextResponse("Invalid photo reference.", { status: 404 });
  }

  const schoolDirectory = path.join(
    process.cwd(),
    "storage",
    "student-photos",
    membership.school_id,
  );

  const directoryEntries = await fs.readdir(schoolDirectory).catch(() => []);

  const matchingFile = directoryEntries.find((entry) => {
    const extension = path.extname(entry).toLowerCase();
    return (
      [".jpg", ".png", ".webp"].includes(extension) &&
      entry.startsWith(`${id}-`)
    );
  });

  if (!matchingFile) {
    return new NextResponse("Photo file not found.", { status: 404 });
  }

  const filePath = path.join(schoolDirectory, matchingFile);
  const file = await fs.readFile(filePath);

  const extension = path.extname(matchingFile).toLowerCase();

  const contentType =
    extension === ".jpg"
      ? "image/jpeg"
      : extension === ".png"
        ? "image/png"
        : "image/webp";

  return new NextResponse(file, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}
