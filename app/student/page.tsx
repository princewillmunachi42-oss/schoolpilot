import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/auth/student";

export default async function StudentDashboardPage() {
  const currentStudent = await getCurrentStudent();

  if (!currentStudent) {
    redirect("/login");
  }

  const { student } = currentStudent;

  const fullName = [
    student.first_name,
    student.other_name,
    student.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Student Portal
            </p>

            <h1 className="text-3xl font-bold">
              Welcome, {student.first_name}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {fullName}
              {student.admission_number
                ? ` • ${student.admission_number}`
                : ""}
            </p>
          </div>

        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="My Profile"
            description="View your student information."
            href="/student/profile"
          />

          <DashboardCard
            title="Timetable"
            description="View your class timetable."
            href="/student/timetable"
          />

          <DashboardCard
            title="Assignments"
            description="View your published assignments."
            href="/student/assignments"
          />

          <DashboardCard
            title="Results"
            description="View your academic results."
            href="/student/results"
          />

          <DashboardCard
            title="Attendance"
            description="View your attendance record."
            href="/student/attendance"
          />

          <DashboardCard
            title="Fees"
            description="View your fee records."
            href="/student/fees"
          />

          <DashboardCard
            title="Notifications"
            description="View your school notifications."
            href="/student/notifications"
          />
        </section>
      </div>
    </main>
  );
}

function DashboardCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="rounded-2xl border p-5 transition hover:bg-muted"
    >
      <h2 className="font-semibold">{title}</h2>

      <p className="mt-2 text-sm text-muted-foreground">
        {description}
      </p>
    </a>
  );
}
