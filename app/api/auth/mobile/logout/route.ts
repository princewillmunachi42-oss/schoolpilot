import { NextRequest, NextResponse } from "next/server";
import { revokeMobileSession } from "@/lib/auth/mobile-session";

export async function POST(request: NextRequest) {
  try {
    const revoked = await revokeMobileSession(request);

    if (!revoked) {
      return NextResponse.json(
        { success: false, message: "A valid mobile session is required." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Mobile logout error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to log out." },
      { status: 500 }
    );
  }
}
