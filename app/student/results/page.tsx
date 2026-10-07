import Link from "next/link";
import { redirect } from "next/navigation";
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
      ? Math.max(
          ...results.map((item) => Number(item.total_score))
        )
      : 0;

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/student"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to Student Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Results
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            View your academic results by subject, session, and term.
          </p>
        </div>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Subjects
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalSubjects}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Average Score
            </p>

            <p className="mt-2 text-3xl font-bold">
              {averageScore.toFixed(1)}
              <span className="ml-1 text-base font-medium text-muted-foreground">
                /100
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Highest Score
            </p>

            <p className="mt-2 text-3xl font-bold">
              {highestScore.toFixed(1)}
              <span className="ml-1 text-base font-medium text-muted-foreground">
                /100
              </span>
            </p>
          </div>
        </section>

        {results.length === 0 ? (
          <section className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="font-medium">
              No results available yet.
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Your academic results will appear here when your school publishes them.
            </p>
          </section>
        ) : (
          <ResultsFilters results={results} />
        )}
      </div>
    </main>
  );
}
