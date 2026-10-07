import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
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
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/student"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Student Dashboard
        </Link>

        {/* Page header */}
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <UserRound className="h-3.5 w-3.5" />
            My Profile
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Student Information
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Review your personal, contact, class, and portal account
            information.
          </p>
        </header>

        {/* Student identity */}
        <section className="mb-6 overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="relative p-6 sm:p-8">
            <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-primary/5 blur-3xl" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
                  <GraduationCap className="h-8 w-8" />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold sm:text-2xl">
                    {fullName}
                  </h2>

                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {student.admission_number && (
                      <span>
                        Admission No. {student.admission_number}
                      </span>
                    )}

                    {classInfo?.class_name && (
                      <span>{classInfo.class_name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-xs font-semibold text-success">
                <CheckCircle2 className="h-4 w-4" />
                {student.portal_enabled ? "Portal Enabled" : "Portal Disabled"}
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          {/* Personal information */}
          <ProfileSection
            icon={UserRound}
            title="Personal Information"
            description="Your school-managed personal and academic identity."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <ProfileField label="Full Name" value={fullName} />
              <ProfileField
                label="Admission Number"
                value={formatValue(student.admission_number)}
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
          </ProfileSection>

          {/* Contact information */}
          <ProfileSection
            icon={Mail}
            title="Contact Information"
            description="Contact details maintained by your school."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <ProfileField
                label="Email"
                value={formatValue(student.email)}
                icon={Mail}
              />

              <ProfileField
                label="Phone"
                value={formatValue(student.phone)}
                icon={Phone}
              />
            </div>
          </ProfileSection>

          {/* Portal account */}
          <ProfileSection
            icon={ShieldCheck}
            title="Portal Account"
            description="Your Student Portal access and account status."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <ProfileField
                label="Login ID"
                value={formatValue(student.user?.login_id)}
                icon={KeyRound}
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

              <ProfileField
                label="Class"
                value={formatValue(classInfo?.class_name)}
              />
            </div>

            <div className="mt-6 border-t pt-6">
              <Link
                href="/student/profile/password"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
              >
                <KeyRound className="h-4 w-4" />
                Change Password
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </ProfileSection>

          {/* Account protection notice */}
          <section className="rounded-3xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Your profile is managed by your school
                </h2>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Students cannot edit their own profile information.
                  If any personal or contact information needs to be
                  corrected, please contact your school administrator.
                </p>
              </div>
            </div>
          </section>

          {/* Quick navigation */}
          <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="font-semibold">Continue to your workspace</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Quickly access other areas of your Student Portal.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <QuickLink
                href="/student/timetable"
                label="View Timetable"
                icon={CalendarDays}
              />

              <QuickLink
                href="/student/results"
                label="View Results"
                icon={GraduationCap}
              />

              <QuickLink
                href="/student/assignments"
                label="View Assignments"
                icon={ArrowRight}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function ProfileSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

function ProfileField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof UserRound;
}) {
  return (
    <div className="rounded-2xl border bg-background/50 p-4">
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        )}

        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function QuickLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof ArrowRight;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-2xl border px-4 py-3.5 text-sm font-semibold transition hover:bg-muted"
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </span>

      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
    </Link>
  );
}
