import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  GraduationCap,
  Trophy,
} from "lucide-react";
import { getCurrentStudent } from "@/lib/auth/student";
import pool from "@/lib/db";
import ResultsFilters from "./ResultsFilters";

type ResultRecord = {
  id: string;
  subject_name: string;
  subject_code: string | null;
  session_name: string;
  term_name: string;
  ca_score: string;
  exam_score: string;
  total_score: string;
  grade: string | null;
  remarks: string | null;
};

export default async function StudentResultsPage() {
  const currentStudent = await getCurrentStudent();

  if (!currentStudent) {
    redirect("/login");
  }

  const result = await pool.query(
    `
      SELECT
        r.id,
        s.name AS subject_name,
        s.code AS subject_code,
        a.name AS session_name,
        t.name AS term_name,
        r.ca_score,
        r.exam_score,
        r.total_score,
        r.grade,
        r.remarks
      FROM results r
      INNER JOIN subjects s
        ON s.id = r.subject_id
       AND s.school_id = r.school_id
      INNER JOIN academic_sessions a
        ON a.id = r.academic_session_id
       AND a.school_id = r.school_id
      INNER JOIN terms t
        ON t.id = r.term_id
       AND t.school_id = r.school_id
      WHERE r.school_id = $1
        AND r.student_id = $2
      ORDER BY
        a.name DESC,
        t.name ASC,
        s.name ASC
    `,
    [currentStudent.schoolId, currentStudent.studentId]
  );

  const results = result.rows as ResultRecord[];

  const totalSubjects = results.length;

  const totalScore = results.reduce(
    (sum, item) => sum + Number(item.total_score),
    0
  );

  const averageScore =
    totalSubjects > 0 ? totalScore / totalSubjects : 0;

  const highestScore =
    totalSubjects > 0
      ? Math.max(...results.map((item) => Number(item.total_score)))
      : 0;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/student"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Student Dashboard
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <GraduationCap className="h-3.5 w-3.5" />
            Academic Performance
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Results
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Review your academic performance by subject, session, and term.
              </p>
            </div>

            <div className="flex w-fit items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Recorded Results
                </p>
                <p className="text-sm font-bold">
                  {totalSubjects} {totalSubjects === 1 ? "Subject" : "Subjects"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Summary */}
        <section className="mb-7 grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={BookOpen}
            label="Subjects"
            value={String(totalSubjects)}
            description="Results recorded"
          />

          <StatCard
            icon={BarChart3}
            label="Average Score"
            value={averageScore.toFixed(1)}
            suffix="/100"
            description="Across recorded subjects"
          />

          <StatCard
            icon={Trophy}
            label="Highest Score"
            value={highestScore.toFixed(1)}
            suffix="/100"
            description="Best recorded score"
          />
        </section>

        {results.length === 0 ? (
          <section className="rounded-3xl border bg-card p-10 text-center shadow-sm sm:p-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Award className="h-7 w-7 text-muted-foreground" />
            </div>

            <h2 className="mt-5 text-xl font-bold">
              No results available yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Your academic results will appear here when your school publishes
              them.
            </p>

            <Link
              href="/student"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Link>
          </section>
        ) : (
          <section className="rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Award className="h-5 w-5 text-primary" />
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  Academic Results
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Filter your results to view specific sessions, terms, or
                  subjects.
                </p>
              </div>
            </div>

            <ResultsFilters results={results} />
          </section>
        )}
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  description,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
  suffix?: string;
  description: string;
}) {
  return (
    <div className="group rounded-3xl border bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>

        {label === "Highest Score" && (
          <Trophy className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
        )}
      </div>

      <p className="mt-4 text-sm font-medium text-muted-foreground">
        {label}
      </p>

      <div className="mt-1 flex items-baseline gap-1">
        <p className="text-2xl font-bold tracking-tight">{value}</p>

        {suffix && (
          <span className="text-sm font-medium text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
