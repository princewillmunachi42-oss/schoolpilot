
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

type StudentProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StudentProfilePage({
  params,
}: StudentProfilePageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const membershipResult = await pool.query(
    `SELECT school_id, role
     FROM school_members
     WHERE user_id = $1
     LIMIT 1`,
    [user.id]
  );

  const membership = membershipResult.rows[0];

  if (!membership || membership.role !== "owner") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const studentResult = await pool.query(
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
     WHERE st.id = $1
       AND st.school_id = $2
     LIMIT 1`,
    [id, membership.school_id]
  );

  const student = studentResult.rows[0];

  if (!student) {
    notFound();
  }

  const fullName = [
    student.first_name,
    student.other_name,
    student.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const initials = `${student.first_name?.charAt(0) ?? ""}${student.last_name?.charAt(0) ?? ""}`;

  const formattedDateOfBirth = student.date_of_birth
    ? new Date(student.date_of_birth).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Not provided";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard/students"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to Students
          </Link>
        </div>

        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b bg-muted/30 px-6 py-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={fullName}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  {initials}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {fullName}
                  </h1>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      student.status === "active"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {student.status}
                  </span>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  Admission No: {student.admission_number}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {student.class_name ?? "No class assigned"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-2">
            <section className="rounded-xl border p-5">
              <h2 className="text-lg font-semibold">Personal Information</h2>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Full Name
                  </p>
                  <p className="mt-1 font-medium">{fullName}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Gender
                  </p>
                  <p className="mt-1 capitalize">
                    {student.gender || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Date of Birth
                  </p>
                  <p className="mt-1">{formattedDateOfBirth}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border p-5">
              <h2 className="text-lg font-semibold">Contact Information</h2>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Email
                  </p>
                  <p className="mt-1 break-all">
                    {student.email || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Phone
                  </p>
                  <p className="mt-1">
                    {student.phone || "Not provided"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border p-5">
              <h2 className="text-lg font-semibold">Academic Information</h2>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Admission Number
                  </p>
                  <p className="mt-1 font-medium">
                    {student.admission_number}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Current Class
                  </p>
                  <p className="mt-1">
                    {student.class_name || "Not assigned"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Student Status
                  </p>
                  <p className="mt-1 capitalize">{student.status}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border p-5">
              <h2 className="text-lg font-semibold">Student Records</h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="font-medium">Parents & Guardians</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Parent relationships will appear here.
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="font-medium">Attendance</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Attendance records will appear here.
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="font-medium">Results</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Academic results will appear here.
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="font-medium">Fees</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Fee records will appear here.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

