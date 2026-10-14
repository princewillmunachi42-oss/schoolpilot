"use client";

import { useEffect, useState } from "react";
import { Award, BookOpen, Printer, RefreshCw } from "lucide-react";

type Report = {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_name?: string | null;
  session_name: string;
  term_name: string;
  teacher_comment?: string | null;
  principal_comment?: string | null;
  conduct_comment?: string | null;
  published_at?: string | null;
  results: {
    id: string;
    subject_name: string;
    subject_code?: string | null;
    ca_score: number;
    exam_score: number;
    total_score: number;
    grade?: string | null;
    remarks?: string | null;
  }[];
  summary: {
    subjects_recorded: number;
    average_score: number | string | null;
    total_score: number | string | null;
  };
  attendance: {
    total_recorded: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number | null;
  };
};

type ResponseData = {
  success: boolean;
  message?: string;
  reports: Report[];
};

type Props = {
  studentId: string;
  sessionId: string;
  termId: string;
};

export default function PublishedReportCards({
  studentId,
  sessionId,
  termId,
}: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (studentId) params.set("student", studentId);
        if (sessionId) params.set("session", sessionId);
        if (termId) params.set("term", termId);

        const response = await fetch(
          `/api/parent/report-cards?${params.toString()}`,
          { cache: "no-store" },
        );
        const result: ResponseData = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load report cards.");
        }

        if (!cancelled) setReports(result.reports || []);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load published report cards.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReports();

    return () => {
      cancelled = true;
    };
  }, [studentId, sessionId, termId]);

  function printReport(reportId: string) {
    const article = Array.from(
      document.querySelectorAll<HTMLElement>("[data-report-id]"),
    ).find((item) => item.dataset.reportId === reportId);

    if (!article) return;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      window.alert("Allow pop-ups in your browser to print this report card.");
      return;
    }

    const clone = article.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("button").forEach((button) => button.remove());

    const styles =
      "<style>" +
      "@page{size:A4 portrait;margin:10mm}" +
      "*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
      "html,body{width:100%;margin:0;padding:0;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;font-size:10pt}" +
      "article.report-card-sheet{display:block;width:100%;max-width:none;margin:0;padding:0;border:0;border-radius:0;overflow:visible;background:#fff;color:#111}" +
      ".report-card-content{padding:0}" +
      ".report-school-header{text-align:center;border-bottom:1px solid #888;padding-bottom:14px}" +
      ".report-school-header h3{font-size:20pt;margin:0;font-weight:700}" +
      ".report-school-header p{margin-top:8px;font-size:10pt}" +
      ".report-student-details{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px 0;border-bottom:1px solid #aaa}" +
      ".report-summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:16px 0}" +
      ".report-summary-card{border:1px solid #ccc;border-radius:4px;padding:9px;background:#f7f7f7}" +
      ".report-summary-card p{margin:0}" +
      ".report-summary-card p+p{margin-top:5px;font-size:16pt;font-weight:700}" +
      ".report-marks-section{margin-top:18px}" +
      ".report-marks-section h4,.report-bottom-grid h4{font-size:12pt;font-weight:700;margin:0 0 8px}" +
      "table.report-marks-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:8pt}" +
      ".report-marks-table th,.report-marks-table td{border:1px solid #aaa;padding:5px;vertical-align:top;overflow-wrap:anywhere;color:#111}" +
      ".report-marks-table th{background:#eee;font-weight:700}" +
      ".report-marks-table th:nth-child(1){width:25%}.report-marks-table th:nth-child(2),.report-marks-table th:nth-child(3){width:10%}.report-marks-table th:nth-child(4){width:12%}.report-marks-table th:nth-child(5){width:10%}.report-marks-table th:nth-child(6){width:23%}" +
      ".report-bottom-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:20px;padding-top:14px;border-top:1px solid #aaa}" +
      ".report-attendance-item{border:1px solid #ccc;padding:6px;border-radius:3px}" +
      ".report-attendance-item p{margin:0}.report-attendance-item p+p{margin-top:4px;font-weight:700}" +
      ".report-comments{display:block}.report-comment{margin-top:10px;break-inside:avoid}" +
      ".report-comment h5{font-size:9pt;font-weight:700;margin:0}.report-comment p{font-size:9pt;margin:4px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}" +
      "footer{margin-top:18px;padding-top:8px;border-top:1px solid #ccc;text-align:center;font-size:8pt}" +
      "button{display:none!important}.print\\\\:hidden{display:none!important}" +
      "h1,h2,h3,h4,h5,p,div,span{overflow-wrap:anywhere}" +
      "thead{display:table-header-group}tr{break-inside:avoid}article{break-inside:auto}" +
      "</style>";

    printWindow.document.open();
    printWindow.document.write(
      '<!doctype html><html><head><meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width,initial-scale=1">' +
        "<title>Student Report Card</title>" +
        styles +
        "</head><body>" +
        clone.outerHTML +
        "</body></html>",
    );
    printWindow.document.close();

    printWindow.setTimeout(() => {
      if (printWindow.closed) return;
      printWindow.focus();
      printWindow.print();
    }, 1200);
  }
  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
          <Award className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold">Published Report Cards</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Official academic reports released by the school.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-[var(--muted-foreground)]">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading published report cards...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-300 p-4 text-sm text-red-600 dark:border-red-900">
          {error}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
          <BookOpen className="mx-auto h-7 w-7 text-[var(--muted-foreground)]" />
          <p className="mt-3 font-medium">No published report cards yet</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Reports will appear here when the school publishes them.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {reports.map((report) => (
            <article
              key={report.id}
              data-report-id={report.id}
              className="report-card-sheet mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
            >
              <div className="report-card-content p-5 sm:p-8">
                <header className="report-school-header border-b border-[var(--border)] pb-5 text-center">
                  <h3 className="text-2xl font-bold">Student Report Card</h3>
                  <p className="mt-2 text-base font-semibold">
                    {report.session_name} · {report.term_name}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                    Official academic report · Published
                    {report.published_at
                      ? " on " +
                        new Date(report.published_at).toLocaleDateString()
                      : ""}
                  </p>
                </header>

                <div className="report-student-details grid gap-3 border-b border-[var(--border)] py-5 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-[var(--muted-foreground)]">
                      Student:
                    </span>{" "}
                    <strong>
                      {report.first_name} {report.last_name}
                    </strong>
                  </p>
                  <p>
                    <span className="text-[var(--muted-foreground)]">
                      Admission number:
                    </span>{" "}
                    <strong>{report.admission_number || "—"}</strong>
                  </p>
                  <p>
                    <span className="text-[var(--muted-foreground)]">
                      Class:
                    </span>{" "}
                    <strong>{report.class_name || "Not assigned"}</strong>
                  </p>
                  <p>
                    <span className="text-[var(--muted-foreground)]">
                      Status:
                    </span>{" "}
                    <strong>Published</strong>
                  </p>
                </div>

                <div className="report-summary-grid my-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="report-summary-card rounded-lg border border-[var(--border)] p-3">
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Subjects recorded
                    </p>
                    <p className="mt-1 text-xl font-bold">
                      {Number(report.summary?.subjects_recorded || 0)}
                    </p>
                  </div>
                  <div className="report-summary-card rounded-lg border border-[var(--border)] p-3">
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Average score
                    </p>
                    <p className="mt-1 text-xl font-bold">
                      {report.summary?.average_score == null
                        ? "—"
                        : Number(report.summary.average_score).toFixed(2)}
                    </p>
                  </div>
                  <div className="report-summary-card rounded-lg border border-[var(--border)] p-3">
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Attendance rate
                    </p>
                    <p className="mt-1 text-xl font-bold">
                      {report.attendance?.rate == null
                        ? "—"
                        : Number(report.attendance.rate).toFixed(1) + "%"}
                    </p>
                  </div>
                </div>

                <div className="report-marks-section mt-5">
                  <h4 className="mb-3 text-base font-bold">
                    Academic Performance
                  </h4>
                  <div className="w-full overflow-x-auto">
                    <table className="report-marks-table min-w-[620px] w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-[var(--muted)]">
                          <th className="border border-[var(--border)] p-2">
                            Subject
                          </th>
                          <th className="border border-[var(--border)] p-2 text-center">
                            CA / 40
                          </th>
                          <th className="border border-[var(--border)] p-2 text-center">
                            Exam / 60
                          </th>
                          <th className="border border-[var(--border)] p-2 text-center">
                            Total / 100
                          </th>
                          <th className="border border-[var(--border)] p-2">
                            Grade
                          </th>
                          <th className="border border-[var(--border)] p-2">
                            Remarks
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.results.map((result) => (
                          <tr key={result.id}>
                            <td className="border border-[var(--border)] p-2 font-medium">
                              {result.subject_name}
                              {result.subject_code ? (
                                <span className="block text-xs text-[var(--muted-foreground)]">
                                  {result.subject_code}
                                </span>
                              ) : null}
                            </td>
                            <td className="border border-[var(--border)] p-2 text-center">
                              {result.ca_score == null
                                ? "—"
                                : Number(result.ca_score).toFixed(2)}
                            </td>
                            <td className="border border-[var(--border)] p-2 text-center">
                              {result.exam_score == null
                                ? "—"
                                : Number(result.exam_score).toFixed(2)}
                            </td>
                            <td className="border border-[var(--border)] p-2 text-center font-semibold">
                              {result.total_score == null
                                ? "—"
                                : Number(result.total_score).toFixed(2)}
                            </td>
                            <td className="border border-[var(--border)] p-2">
                              {result.grade || "—"}
                            </td>
                            <td className="border border-[var(--border)] p-2">
                              {result.remarks || "—"}
                            </td>
                          </tr>
                        ))}
                        {report.results.length === 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="border border-[var(--border)] p-4 text-center"
                            >
                              No subject results have been recorded for this
                              term.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="report-bottom-grid mt-6 grid gap-5 border-t border-[var(--border)] pt-5 sm:grid-cols-2">
                  <div>
                    <h4 className="mb-3 text-base font-bold">
                      Attendance Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        ["Present", report.attendance?.present ?? 0],
                        ["Absent", report.attendance?.absent ?? 0],
                        ["Late", report.attendance?.late ?? 0],
                        ["Excused", report.attendance?.excused ?? 0],
                        [
                          "Recorded days",
                          report.attendance?.total_recorded ?? 0,
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={String(label)}
                          className="report-attendance-item rounded-lg border border-[var(--border)] p-2"
                        >
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {label}
                          </p>
                          <p className="mt-1 font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                    {(report.attendance?.total_recorded ?? 0) === 0 && (
                      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                        Attendance has not been recorded for this term.
                      </p>
                    )}
                  </div>
                  <div className="report-comments space-y-4">
                    <h4 className="text-base font-bold">
                      Comments and Conduct
                    </h4>
                    {[
                      ["Class teacher's comment", report.teacher_comment],
                      ["Principal's comment", report.principal_comment],
                      ["Conduct and attitude", report.conduct_comment],
                    ].map(([label, comment]) => (
                      <div key={label} className="report-comment">
                        <h5 className="text-sm font-semibold">{label}</h5>
                        <p className="mt-1 whitespace-pre-wrap text-sm">
                          {comment || "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <footer className="mt-6 border-t border-[var(--border)] pt-3 text-center text-xs text-[var(--muted-foreground)]">
                  This report card was published by the school.
                </footer>

                <div className="mt-5 text-right print:hidden">
                  <button
                    type="button"
                    onClick={() => printReport(report.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-[var(--muted)]"
                  >
                    <Printer className="h-4 w-4" />
                    Print / Save PDF
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
