import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: GraduationCap,
    title: "Student Management",
    description:
      "Keep student profiles, admission details, classes, status and academic records organized in one place.",
  },
  {
    icon: Users,
    title: "Staff & Teachers",
    description:
      "Manage staff records, teacher assignments and responsibilities across your school.",
  },
  {
    icon: BookOpen,
    title: "Academic Management",
    description:
      "Organize sessions, terms, classes, subjects and timetables with a clear academic structure.",
  },
  {
    icon: WalletCards,
    title: "Student Fees",
    description:
      "Track fee records, payments, balances and payment status for your students.",
  },
  {
    icon: MessageSquare,
    title: "School Communication",
    description:
      "Send school communications to parents and keep a clear record of messages.",
  },
  {
    icon: ShieldCheck,
    title: "School-Specific Data",
    description:
      "Keep each school's information separated with role-based access and school-scoped data.",
  },
];

const roles = [
  "School owners",
  "Administrators",
  "Teachers",
  "Students",
  "Parents",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition-transform group-hover:scale-105">
              <GraduationCap className="h-5 w-5" />
            </div>

            <span className="text-lg font-bold tracking-tight">
              School<span className="text-primary">Pilot</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-4"
            >
              Sign In
            </Link>

            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative border-b">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[500px] overflow-hidden">
          <div className="absolute left-1/2 top-[-220px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-[-120px] top-40 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8 lg:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur">
              <span className="flex h-2 w-2 rounded-full bg-success" />
              Modern school management, built for real schools
            </div>

            <h1 className="mt-7 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Run your school with{" "}
              <span className="text-primary">clarity.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              SchoolPilot brings students, staff, academics, parents,
              fees and school communication together in one organized
              management platform.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:shadow-xl"
              >
                Create Your School
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border bg-card px-6 py-3 font-semibold transition-all hover:bg-muted"
              >
                Sign In to SchoolPilot
              </Link>
            </div>
          </div>

          {/* Product preview */}
          <div className="mx-auto mt-16 max-w-5xl sm:mt-20">
            <div className="rounded-2xl border bg-card p-2 shadow-2xl shadow-slate-900/10 sm:rounded-3xl sm:p-3">
              <div className="overflow-hidden rounded-xl border bg-muted/30 sm:rounded-2xl">
                <div className="flex h-10 items-center gap-1.5 border-b bg-card px-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success/70" />

                  <div className="ml-3 flex h-6 max-w-xs flex-1 items-center rounded-md border bg-muted px-3">
                    <span className="text-[9px] text-muted-foreground">
                      app.schoolpilot
                    </span>
                  </div>
                </div>

                <div className="grid min-h-[240px] grid-cols-[110px_1fr] sm:grid-cols-[180px_1fr]">
                  <div className="border-r bg-card p-3 sm:p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-primary" />
                      <div className="h-2 w-16 rounded bg-muted" />
                    </div>

                    <div className="mt-6 space-y-2">
                      {[1, 2, 3, 4, 5].map((item) => (
                        <div
                          key={item}
                          className={`h-7 rounded-lg ${
                            item === 1
                              ? "bg-primary/10"
                              : "bg-muted/60"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="h-3 w-24 rounded bg-muted sm:w-32" />
                        <div className="mt-2 h-2 w-36 rounded bg-muted/70 sm:w-48" />
                      </div>

                      <div className="h-8 w-8 rounded-full bg-primary/10" />
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="rounded-xl border bg-card p-3"
                        >
                          <div className="h-7 w-7 rounded-lg bg-primary/10" />
                          <div className="mt-4 h-3 w-12 rounded bg-muted" />
                          <div className="mt-2 h-5 w-16 rounded bg-muted/70" />
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-xl border bg-card p-4">
                      <div className="h-3 w-28 rounded bg-muted" />
                      <div className="mt-4 h-2 w-full rounded bg-muted/60" />
                      <div className="mt-3 h-2 w-4/5 rounded bg-muted/50" />
                      <div className="mt-3 h-2 w-3/5 rounded bg-muted/40" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              A focused workspace for managing your school's everyday
              operations.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            One connected platform
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            The tools your school needs to stay organized.
          </h2>

          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Replace scattered records and disconnected workflows with
            one structured system for your school community.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="mt-5 text-lg font-semibold">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Built for school communities */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Built around your school
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              One system. Different people. Clear responsibilities.
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-muted-foreground">
              SchoolPilot is designed around the different people who
              keep a school running. Each role gets access to the
              information and workflows relevant to them.
            </p>

            <Link
              href="/signup"
              className="mt-7 inline-flex items-center gap-2 font-semibold text-primary hover:text-primary-hover"
            >
              Start building your school workspace
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {roles.map((role, index) => (
              <div
                key={role}
                className={`flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm ${
                  index === roles.length - 1
                    ? "sm:col-span-2"
                    : ""
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </div>

                <span className="text-sm font-semibold">{role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-24">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Zap className="h-7 w-7" />
          </div>

          <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Give your school a better system.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">
            Create your school workspace and bring your everyday school
            management into one organized platform.
          </p>

          <Link
            href="/signup"
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-7 py-3 font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:shadow-xl"
          >
            Create Your School
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
              <GraduationCap className="h-4 w-4" />
            </div>

            <span className="font-semibold text-foreground">
              SchoolPilot
            </span>
          </div>

          <p>© 2026 SchoolPilot. All rights reserved.</p>

          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="transition-colors hover:text-foreground"
            >
              Sign In
            </Link>

            <Link
              href="/signup"
              className="transition-colors hover:text-foreground"
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
