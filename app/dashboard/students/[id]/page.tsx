
import Link from "next/link";
import StudentProfileEditor from "@/components/student-profile-editor";
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
        const parentsResult = await pool.query(
    `SELECT
       p.id,
       p.full_name,
       p.email,
       p.phone,
       p.address,
       ps.relationship,
       ps.is_primary_contact
     FROM parent_students ps
     INNER JOIN parents p
       ON p.id = ps.parent_id
      AND p.school_id = ps.school_id
     WHERE ps.student_id = $1
       AND ps.school_id = $2
     ORDER BY ps.is_primary_contact DESC, p.full_name ASC`,
    [student.id, membership.school_id]
  );

  const parents = parentsResult.rows;
     const attendanceResult = await pool.query(
    `SELECT
       ar.id,
       ar.attendance_date,
       ar.status,
       ar.remarks,
       ar.academic_session_id,
       ar.term_id,
       s.name AS session_name,
       t.name AS term_name
     FROM attendance_records ar
     INNER JOIN academic_sessions s
       ON s.id = ar.academic_session_id
      AND s.school_id = ar.school_id
     INNER JOIN terms t
       ON t.id = ar.term_id
      AND t.school_id = ar.school_id
     WHERE ar.student_id = $1
       AND ar.school_id = $2
     ORDER BY ar.attendance_date DESC`,
    [student.id, membership.school_id]
  );

  const attendance = attendanceResult.rows;
    const resultsResult = await pool.query(
    `SELECT
       r.id,
       r.ca_score,
       r.exam_score,
       r.total_score,
       r.grade,
       r.remarks,
       r.academic_session_id,
       r.term_id,
       r.subject_id,
       s.name AS session_name,
       t.name AS term_name,
       sub.name AS subject_name,
       sub.code AS subject_code
     FROM results r
     INNER JOIN academic_sessions s
       ON s.id = r.academic_session_id
      AND s.school_id = r.school_id
     INNER JOIN terms t
       ON t.id = r.term_id
      AND t.school_id = r.school_id
     INNER JOIN subjects sub
       ON sub.id = r.subject_id
      AND sub.school_id = r.school_id
     WHERE r.student_id = $1
       AND r.school_id = $2
     ORDER BY s.start_date DESC, t.name ASC, sub.name ASC`,
    [student.id, membership.school_id]
  );

  const results = resultsResult.rows;
  const feesResult = await pool.query(
    `SELECT
       f.id,
       f.fee_name,
       f.amount_due,
       f.amount_paid,
       (f.amount_due - f.amount_paid) AS balance,
       f.due_date,
       f.status,
       f.remarks,
       f.academic_session_id,
       f.term_id,
       s.name AS session_name,
       t.name AS term_name
     FROM student_fees f
     INNER JOIN academic_sessions s
       ON s.id = f.academic_session_id
      AND s.school_id = f.school_id
     INNER JOIN terms t
       ON t.id = f.term_id
      AND t.school_id = f.school_id
     WHERE f.student_id = $1
       AND f.school_id = $2
     ORDER BY f.due_date DESC NULLS LAST, f.created_at DESC`,
    [student.id, membership.school_id]
  );

  const fees = feesResult.rows;
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
               <StudentProfileEditor
  studentId={student.id}
  firstName={student.first_name ?? ""}
  lastName={student.last_name ?? ""}
  otherName={student.other_name ?? ""}
  gender={student.gender ?? ""}
  dateOfBirth={
    student.date_of_birth
      ? new Date(student.date_of_birth).toISOString().slice(0, 10)
      : ""
  }
  email={student.email ?? ""}
  phone={student.phone ?? ""}
/>
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
  <div className="flex items-center justify-between gap-3">
    <p className="font-medium">Parents & Guardians</p>

    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
      {parents.length}
    </span>
  </div>

  {parents.length === 0 ? (
    <p className="mt-3 text-sm text-muted-foreground">
      No parent or guardian has been linked to this student yet.
    </p>
  ) : (
    <div className="mt-4 space-y-3">
      {parents.map((parent) => (
        <div
          key={parent.id}
          className="rounded-lg border bg-background p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{parent.full_name}</p>

              <p className="mt-1 text-xs capitalize text-muted-foreground">
                {parent.relationship || "Guardian"}
              </p>
            </div>

            {parent.is_primary_contact && (
              <span className="rounded-full bg-success/10 px-2 py-1 text-[11px] font-semibold text-success">
                Primary
              </span>
            )}
          </div>

          {parent.phone && (
            <p className="mt-3 text-sm text-muted-foreground">
              📞 {parent.phone}
            </p>
          )}

          {parent.email && (
            <p className="mt-1 break-all text-sm text-muted-foreground">
              ✉️ {parent.email}
            </p>
          )}
        </div>
      ))}
    </div>
  )}
</div>
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="font-medium">Parents & Guardians</p>
                  
                </div>

                <div className="rounded-lg border bg-muted/20 p-4">
  <div className="flex items-center justify-between gap-3">
    <p className="font-medium">Attendance</p>

    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
      {attendance.length}
    </span>
  </div>

  {attendance.length === 0 ? (
    <p className="mt-3 text-sm text-muted-foreground">
      No attendance records have been recorded for this student yet.
    </p>
  ) : (
    <div className="mt-4 space-y-3">
      {attendance.slice(0, 5).map((record) => (
        <div
          key={record.id}
          className="rounded-lg border bg-background p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium capitalize">
                {record.status}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(record.attendance_date).toLocaleDateString(
                  "en-NG",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }
                )}
              </p>
            </div>

            <span className="text-xs text-muted-foreground">
              {record.term_name}
            </span>
          </div>

          {record.remarks && (
            <p className="mt-2 text-sm text-muted-foreground">
              {record.remarks}
            </p>
          )}
        </div>
      ))}

      {attendance.length > 5 && (
        <p className="pt-1 text-xs text-muted-foreground">
          Showing the 5 most recent records.
        </p>
      )}
    </div>
  )}
</div>

                <div className="rounded-lg border bg-muted/20 p-4">
  <div className="flex items-center justify-between gap-3">
    <p className="font-medium">Results</p>

    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
      {results.length}
    </span>
  </div>

  {results.length === 0 ? (
    <p className="mt-3 text-sm text-muted-foreground">
      No academic results have been recorded for this student yet.
    </p>
  ) : (
    <div className="mt-4 space-y-3">
      {results.slice(0, 5).map((result) => (
        <div
          key={result.id}
          className="rounded-lg border bg-background p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{result.subject_name}</p>

              <p className="mt-1 text-xs text-muted-foreground">
                {result.session_name} · {result.term_name}
              </p>
            </div>

            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
              {result.total_score}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <p>CA: {result.ca_score}</p>
            <p>Exam: {result.exam_score}</p>
          </div>

          {result.grade && (
            <p className="mt-2 text-sm font-medium">
              Grade: {result.grade}
            </p>
          )}

          {result.remarks && (
            <p className="mt-1 text-sm text-muted-foreground">
              {result.remarks}
            </p>
          )}
        </div>
      ))}

      {results.length > 5 && (
        <p className="pt-1 text-xs text-muted-foreground">
          Showing the 5 most recent results.
        </p>
      )}
    </div>
  )}
</div>

                <div className="rounded-lg border bg-muted/20 p-4">
  <div className="flex items-center justify-between gap-3">
    <p className="font-medium">Fees</p>

    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
      {fees.length}
    </span>
  </div>

  {fees.length === 0 ? (
    <p className="mt-3 text-sm text-muted-foreground">
      No fee records have been created for this student yet.
    </p>
  ) : (
    <div className="mt-4 space-y-3">
      {fees.slice(0, 5).map((fee) => (
        <div
          key={fee.id}
          className="rounded-lg border bg-background p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{fee.fee_name}</p>

              <p className="mt-1 text-xs text-muted-foreground">
                {fee.session_name} · {fee.term_name}
              </p>
            </div>

            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold capitalize text-primary">
              {fee.status}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <p>
              Due:{" "}
              <span className="font-medium">
                ₦{Number(fee.amount_due).toLocaleString("en-NG")}
              </span>
            </p>

            <p>
              Paid:{" "}
              <span className="font-medium">
                ₦{Number(fee.amount_paid).toLocaleString("en-NG")}
              </span>
            </p>

            <p>
              Balance:{" "}
              <span className="font-medium">
                ₦{Number(fee.balance).toLocaleString("en-NG")}
              </span>
            </p>

            {fee.due_date && (
              <p>
                Due date:{" "}
                <span className="font-medium">
                  {new Date(fee.due_date).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </p>
            )}
          </div>

          {fee.remarks && (
            <p className="mt-2 text-sm text-muted-foreground">
              {fee.remarks}
            </p>
          )}
        </div>
      ))}

      {fees.length > 5 && (
        <p className="pt-1 text-xs text-muted-foreground">
          Showing the 5 most recent fee records.
        </p>
      )}
    </div>
  )}
</div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

