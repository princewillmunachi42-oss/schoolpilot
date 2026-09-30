export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="text-2xl font-bold">
            SchoolPilot
          </a>

          <nav className="flex items-center gap-3">
            <a
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Sign In
            </a>

            <a
              href="/signup"
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
            >
              Get Started
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center sm:py-28">
          <div className="mx-auto mb-6 inline-flex rounded-full border px-4 py-2 text-sm text-muted-foreground">
            Modern School Management Platform
          </div>

          <h1 className="mx-auto max-w-5xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Everything your school needs.
            <span className="block text-muted-foreground">
              All in one place.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            SchoolPilot helps schools manage students, staff, classes,
            academics, parents, attendance, fees and everyday operations
            from one simple platform.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="/signup"
              className="rounded-xl bg-foreground px-7 py-3.5 font-semibold text-background hover:opacity-90"
            >
              Create Your School
            </a>

            <a
              href="/login"
              className="rounded-xl border px-7 py-3.5 font-semibold hover:bg-muted"
            >
              Sign In
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Everything in one platform
          </p>

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Run your school with confidence
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Keep your school's important information organized and
            accessible to the people who need it.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Student Management",
              description:
                "Manage student profiles, admission numbers, classes, status and parent relationships.",
            },
            {
              title: "Staff & Teachers",
              description:
                "Organize staff records, teacher assignments and responsibilities across your school.",
            },
            {
              title: "Classes & Subjects",
              description:
                "Create academic sessions, classes and subjects and keep your academic structure organized.",
            },
            {
              title: "Attendance",
              description:
                "Track student and staff attendance and keep a clear record of daily participation.",
            },
            {
              title: "Fees & Accounting",
              description:
                "Keep school fee information and financial records organized as your school grows.",
            },
            {
              title: "Parents & Students",
              description:
                "Connect parents with their children and make important school information easier to manage.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border p-6 transition-colors hover:bg-muted/40"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border font-bold">
                +
              </div>

              <h3 className="text-lg font-semibold">
                {feature.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-y">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to manage your school better?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Create your SchoolPilot account and start building your
            school's digital management system.
          </p>

          <a
            href="/signup"
            className="mt-8 inline-flex rounded-xl bg-foreground px-7 py-3.5 font-semibold text-background hover:opacity-90"
          >
            Get Started
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 SchoolPilot. All rights reserved.</p>

          <div className="flex gap-5">
            <a href="/login" className="hover:text-foreground">
              Sign In
            </a>

            <a href="/signup" className="hover:text-foreground">
              Register
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
