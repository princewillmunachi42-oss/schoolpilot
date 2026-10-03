import { NextResponse } from "next/server";
import { getCurrentParent } from "@/lib/auth/parent";

export async function GET() {
  try {
    const parent = await getCurrentParent();

    if (!parent) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: parent.parent.id,
        user_id: parent.userId,
        school_id: parent.schoolId,
        full_name: parent.parent.full_name,
        email: parent.parent.email,
        phone: parent.parent.phone,
        address: parent.parent.address,
        photo_url: parent.parent.photo_url,
        status: parent.parent.status,
      },
    });
  } catch (error) {
    console.error("Parent profile GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load profile.",
      },
      { status: 500 }
    );
  }
}
