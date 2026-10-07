import Link from "next/link";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/auth/student";
import pool from "@/lib/db";
import StudentProfileMenu from "./StudentProfileMenu";

export default async function StudentPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const currentStudent = await getCurrentStudent();

  if (!currentStudent) {
    redirect("/login");
  }

  const { student } = currentStudent;

  const unreadResult = await pool.query(
    `
      SELECT COUNT(*) AS count
      FROM notifications
      WHERE school_id = $1
        AND user_id = $2
        AND is_read = FALSE
    `,
    [currentStudent.schoolId, currentStudent.userId]
  );

  const unreadCount = Number(unreadResult.rows[0]?.count ?? 0);

  const unreadAssignmentResult = await pool.query(
    `
      SELECT COUNT(*) AS count
      FROM notifications
      WHERE school_id = $1
        AND user_id = $2
        AND type = 'assignment'
        AND is_read = FALSE
    `,
    [currentStudent.schoolId, currentStudent.userId]
  );

  const unreadAssignmentCount = Number(
    unreadAssignmentResult.rows[0]?.count ?? 0
  );

  const fullName = [
    student.first_name,
    student.other_name,
    student.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const navigation = [
    {
      label: "Dashboard",
      href: "/student",
    },
    {
      label: "My Profile",
      href: "/student/profile",
    },
    {
      label: "Timetable",
      href: "/student/timetable",
    },
    {
      label:
        unreadAssignmentCount > 0
          ? `Assignments ${unreadAssignmentCount}`
          : "Assignments",
      href: "/student/assignments",
    },
    {
      label: "Results",
      href: "/student/results",
    },
    {
      label: "Attendance",
      href: "/student/attendance",
    },
    {
      label: "Fees",
      href: "/student/fees",
    },
    {
      label: "Announcements",
      href: "/student/announcements",
    },
   
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
          <div className="border-b p-5">
            <a
              href="/student"
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold text-white">
                S
              </div>

              <div>
                <p className="font-bold tracking-tight">
                  SchoolPilot
                </p>

                <p className="text-xs text-muted-foreground">
                  Student Portal
                </p>
              </div>
            </a>
          </div>

          <div className="border-b p-4">
            <p className="truncate text-sm font-semibold">
              {fullName}
            </p>

            <p className="mt-1 truncate text-xs text-muted-foreground">
              {student.admission_number}
            </p>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main area */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-5 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-white lg:hidden">
                  S
                </div>

                <div>
                  <p className="text-sm font-semibold lg:hidden">
                    SchoolPilot
                  </p>

                  <p className="hidden text-sm font-medium text-muted-foreground lg:block">
                    Student Portal
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/student/notifications"
                  aria-label="Notifications"
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted"
                >
                  <span className="text-lg">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>

                <StudentProfileMenu
                  firstName={student.first_name}
                  lastName={student.last_name}
                  photoUrl={student.photo_url}
                />
              </div>
            </div>

          {/* Mobile navigation */}
            <div className="overflow-x-auto border-t lg:hidden">
              <nav className="flex min-w-max gap-1 p-2">
                {navigation.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </header>

          {children}
        </div>
      </div>
    </main>
  );
}
