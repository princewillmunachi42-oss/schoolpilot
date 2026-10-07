import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  UserRound,
  WalletCards,
  CheckCircle2,
} from "lucide-react";
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

  const navigationCards = [
    {
      title: "My Profile",
      description: "View your student information and account details.",
      href: "/student/profile",
      icon: UserRound,
      tone: "bg-primary/10 text-primary",
    },
    {
      title: "Timetable",
      description: "Check your class schedule and daily lessons.",
      href: "/student/timetable",
      icon: CalendarDays,
      tone: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    },
    {
      title: "Assignments",
      description: "View your published assignments and deadlines.",
      href: "/student/assignments",
      icon: ClipboardList,
      tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      title: "Results",
      description: "Review your academic results and performance.",
      href: "/student/results",
      icon: GraduationCap,
      tone: "bg-success/10 text-success",
    },
    {
      title: "Attendance",
      description: "Check your attendance record and history.",
      href: "/student/attendance",
      icon: CheckCircle2,
      tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      title: "Fees",
      description: "View your school fee records and payment details.",
      href: "/student/fees",
      icon: WalletCards,
      tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    },
    {
      title: "Notifications",
      description: "Stay updated with important school messages.",
      href: "/student/notifications",
      icon: Bell,
      tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Student Portal
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome, {student.first_name}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Here&apos;s your SchoolPilot student workspace.
            </p>
          </div>
        </header>

        {/* Student identity card */}
        <section className="mb-8 overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="relative p-6 sm:p-8">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
                  <GraduationCap className="h-7 w-7" />
                </div>

                <div className="min-w-0">
                  <p className="text-lg font-bold truncate">
                    {fullName}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {student.admission_number && (
                      <span>
                        Admission No. {student.admission_number}
                      </span>
                    )}

                    {student.class_name && (
                      <span>{student.class_name}</span>
                    )}
                  </div>
                </div>
              </div>

              <Link
                href="/student/profile"
                className="inline-flex w-fit items-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
              >
                View Profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Workspace heading */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Your Workspace
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Access your academic and school information.
            </p>
          </div>
        </div>

        {/* Navigation cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {navigationCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-3xl border bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>

                <h3 className="mt-5 text-base font-semibold group-hover:text-primary">
                  {card.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </section>

        {/* Academic workspace reminder */}
        <section className="mt-8 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Keep up with your school work
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Check your assignments, timetable, attendance, and results
                  regularly to stay informed.
                </p>
              </div>
            </div>

            <Link
              href="/student/assignments"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
            >
              View Assignments
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
