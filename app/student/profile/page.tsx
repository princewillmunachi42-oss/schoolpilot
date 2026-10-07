import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/auth/student";
import pool from "@/lib/db";

export default async function StudentProfilePage() {
  const currentStudent = await getCurrentStudent();

  if (!currentStudent) {
    redirect("/login");
  }

  const { student } = currentStudent;

  const classResult = await pool.query(
    `
      SELECT
        c.name AS class_name,
        c.level AS class_level
      FROM classes c
      WHERE c.id = $1
        AND c.school_id = $2
      LIMIT 1
    `,
    [student.class_id, currentStudent.schoolId]
  );

  const classInfo = classResult.rows[0];

  const fullName = [
    student.first_name,
    student.other_name,
    student.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const formatDate = (value: string | Date | null) => {
    if (!value) {
      return "Not provided";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not provided";
    }

    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "long",
    }).format(date);
  };

  const formatValue = (value: string | null | undefined) => {
    return value && value.trim() ? value : "Not provided";
  };

  return (
    <section className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <div className="mb-6">
        <Link
          href="/student"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          ← Back to Student Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-sm font-medium text-primary">
          My Profile
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Student Information
        </h1>

        <p className="mt-2 text-muted-foreground">
          Your profile information is managed by your school.
        </p>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border bg-card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Personal Information
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              This information can only be changed by your school
              administrator.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileField
              label="Full Name"
              value={fullName}
            />

            <ProfileField
              label="Admission Number"
              value={student.admission_number}
            />

            <ProfileField
              label="Gender"
              value={formatValue(student.gender)}
            />

            <ProfileField
              label="Date of Birth"
              value={formatDate(student.date_of_birth)}
            />

            <ProfileField
              label="Class"
              value={formatValue(classInfo?.class_name)}
            />

            <ProfileField
              label="Class Level"
              value={formatValue(classInfo?.class_level)}
            />
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Contact Information
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Your school manages these contact details.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileField
              label="Email"
              value={formatValue(student.email)}
            />

            <ProfileField
              label="Phone"
              value={formatValue(student.phone)}
            />
          </div>
        </section>

      <section className="rounded-2xl border bg-card p-6">
  <div className="mb-6">
    <h2 className="text-lg font-semibold">
      Portal Account
    </h2>

    <p className="mt-1 text-sm text-muted-foreground">
      Your Student Portal access status.
    </p>
  </div>

  <div className="grid gap-5 sm:grid-cols-2">
    <ProfileField
      label="Login ID"
      value={formatValue(student.user?.login_id)}
    />

    <ProfileField
      label="Portal Status"
      value={
        student.portal_enabled
          ? "Enabled"
          : "Disabled"
      }
    />

    <ProfileField
      label="Student Status"
      value={formatValue(student.status)}
    />

    <div className="sm:col-span-2">
      <Link
        href="/student/profile/password"
        className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
      >
        Change Password
      </Link>
    </div>
  </div>
</section>


        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          Need to correct your personal information? Please contact
          your school administrator. Students cannot edit their own
          profile information.
        </div>
      </div>
    </section>
  );
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium">
        {value}
      </p>
    </div>
  );
}
