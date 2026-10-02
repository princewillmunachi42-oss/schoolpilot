import { NextResponse } from "next/server";
import { getCurrentTeacher } from "@/lib/auth/teacher";

export async function GET() {
  const teacher = await getCurrentTeacher();

  if (!teacher) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    profile: {
      staff_id: teacher.staff.staff_id,
      first_name: teacher.staff.first_name,
      last_name: teacher.staff.last_name,
      other_name: teacher.staff.other_name,
      email: teacher.staff.email,
      phone: teacher.staff.phone,
      role_title: teacher.staff.role_title,
      photo_url: teacher.staff.photo_url,
      status: teacher.staff.status,
    },
  });
}
