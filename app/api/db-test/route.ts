import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database, current_user AS user"
    );

    return Response.json({
      success: true,
      message: "SchoolPilot is connected to PostgreSQL",
      database: result.rows[0].database,
      user: result.rows[0].user,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: "Database connection failed",
      },
      { status: 500 }
    );
  }
}
