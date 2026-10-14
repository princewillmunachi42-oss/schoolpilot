"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  ClipboardList,
  Download,
  LoaderCircle,
  Save,
} from "lucide-react";

type Session = {
  id: string;
  name: string;
  is_current: boolean;
};

type Term = {
  id: string;
  name: string;
  academic_session_id: string;
  is_current: boolean;
};

type SchoolClass = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  other_name: string | null;
};

type ReportData = {
  school: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  student: Student & {
    gender: string | null;
    class_name: string | null;
  };
  session: { name: string };
  term: { name: string };
  results: {
    id: string;
    subject_name: string;
    subject_code: string | null;
    ca_score: number | string | null;
    exam_score: number | string | null;
    total_score: number | string | null;
    grade: string | null;
    remarks: string | null;
  }[];
  summary: {
    subjects_recorded: number;
    average_score: number | string | null;
    total_score: number | string | null;
  };
  ranking: {
    position: number | null;
    class_size: number | null;
  };
  attendance: {
    total_recorded: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number | null;
  };
  report_card: {
    teacher_comment: string | null;
    principal_comment: string | null;
    conduct_comment: string | null;
    status: "draft" | "published";
    published_at: string | null;
  };
};

export default function ReportCardsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [role, setRole] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);
  const [teacherComment, setTeacherComment] = useState("");
  const [principalComment, setPrincipalComment] = useState("");
  const [conductComment, setConductComment] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isManager = ["owner", "principal", "admin"].includes(role);

  const availableTerms = useMemo(
    () => terms.filter((term) => term.academic_session_id === sessionId),
    [terms, sessionId]
  );

  async function loadOptions(
    nextSessionId = "",
    nextClassId = ""
  ) {
    setLoadingOptions(true);
    setError("");

    try {
      const query = new URLSearchParams();
      if (nextSessionId) query.set("session_id", nextSessionId);
      if (nextClassId) query.set("class_id", nextClassId);

      const response = await fetch(
        `/api/school/report-cards/options?${query.toString()}`,
        { cache: "no-store" }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load report-card options.");
      }

      setSessions(data.sessions || []);
      setTerms(data.terms || []);
      setClasses(data.classes || []);
      setStudents(data.students || []);
      setRole(data.role || "");

      if (!nextSessionId) {
        const current =
          (data.sessions || []).find((item: Session) => item.is_current) ||
          (data.sessions || [])[0];

        if (current) {
          setSessionId(current.id);

          const currentTerm = (data.terms || []).find(
            (item: Term) =>
              item.academic_session_id === current.id && item.is_current
          );
          if (currentTerm) setTermId(currentTerm.id);

          const classResponse = await fetch(
            `/api/school/report-cards/options?${new URLSearchParams({
              session_id: current.id,
            }).toString()}`,
            { cache: "no-store" }
          );
          const classData = await classResponse.json();

          if (!classResponse.ok || !classData.success) {
            throw new Error(
              classData.error || "Unable to load classes for this session."
            );
          }

          setClasses(classData.classes || []);
          setStudents(classData.students || []);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load options."
      );
    } finally {
      setLoadingOptions(false);
    }
  }

  useEffect(() => {
    void loadOptions();
  }, []);

  function changeSession(value: string) {
    setSessionId(value);
    setTermId("");
    setClassId("");
    setStudentId("");
    setReport(null);
    setStudents([]);
    setMessage("");
    void loadOptions(value);
  }

  function changeClass(value: string) {
    setClassId(value);
    setStudentId("");
    setReport(null);
    setMessage("");
    void loadOptions(sessionId, value);
  }

  async function loadReport() {
    if (!sessionId || !termId || !studentId) {
      setError("Select an academic session, term, and student first.");
      return;
    }

    setLoadingReport(true);
    setError("");
    setMessage("");

    try {
      const query = new URLSearchParams({
        student_id: studentId,
        academic_session_id: sessionId,
        term_id: termId,
      });

      const response = await fetch(
        `/api/school/report-cards?${query.toString()}`,
        { cache: "no-store" }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load this report card.");
      }

      setReport(data);
      setTeacherComment(data.report_card?.teacher_comment || "");
      setPrincipalComment(data.report_card?.principal_comment || "");
      setConductComment(data.report_card?.conduct_comment || "");
      setStatus(data.report_card?.status || "draft");
    } catch (err) {
      setReport(null);
      setError(
        err instanceof Error ? err.message : "Unable to load report card."
      );
    } finally {
      setLoadingReport(false);
    }
  }

  async function saveReport(nextStatus?: "draft" | "published") {
    if (!sessionId || !termId || !studentId) {
      setError("Select an academic session, term, and student first.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const body: Record<string, string> = {
        student_id: studentId,
        academic_session_id: sessionId,
        term_id: termId,
        teacher_comment: teacherComment,
      };

      if (isManager) {
        body.principal_comment = principalComment;
        body.conduct_comment = conductComment;
        body.status = nextStatus || status;
      }

      const response = await fetch("/api/school/report-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save report card.");
      }

      setStatus(data.report_card.status);
      const successMessage =
        data.report_card.status === "published"
          ? "Report card published successfully."
          : "Report card saved as a draft.";

      await loadReport();
      setMessage(successMessage);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save report card."
      );
    } finally {
      setSaving(false);
    }
  }

  function printReport() {
    window.print();
  }

  const selectedStudent = students.find((item) => item.id === studentId);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 pb-10 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Advanced Report Cards
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review academic performance, attendance, comments, and publication status.
          </p>
        </div>
        {report && (
          <button
            type="button"
            onClick={printReport}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Print / Save PDF
          </button>
        )}
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Choose report</h2>
        </div>

        {loadingOptions && (
          <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading school records…
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Academic session</span>
            <select
              value={sessionId}
              onChange={(event) => changeSession(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
            >
              <option value="">Select session</option>
              {sessions.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Term</span>
            <select
              value={termId}
              onChange={(event) => setTermId(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
            >
              <option value="">Select term</option>
              {availableTerms.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Class</span>
            <select
              value={classId}
              onChange={(event) => changeClass(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
            >
              <option value="">Select class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Student</span>
            <select
              value={studentId}
              onChange={(event) => {
                setStudentId(event.target.value);
                setReport(null);
                setMessage("");
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
            >
              <option value="">Select student</option>
              {students.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.last_name}, {item.first_name} — {item.admission_number}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={loadReport}
          disabled={loadingReport || loadingOptions || !sessionId || !termId || !studentId}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingReport ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <BookOpenCheck className="h-4 w-4" />
          )}
          Load report card
        </button>
      </section>

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {message && (
        <div role="status" className="rounded-xl border border-border bg-muted p-3 text-sm">
          {message}
        </div>
      )}

      {report && (
        <div className="space-y-5" id="printable-report">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-7 print:border-0 print:p-0 print:shadow-none">
            <div className="border-b border-border pb-5 text-center">
              <h2 className="text-2xl font-bold">
                {report.school?.name || "School"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {[report.school?.address, report.school?.city, report.school?.state, report.school?.country]
                  .filter(Boolean).join(", ")}
              </p>
              <p className="text-sm text-muted-foreground">
                {[report.school?.phone, report.school?.email].filter(Boolean).join(" · ")}
              </p>
              <h3 className="mt-5 text-lg font-bold uppercase tracking-wide">
                Student Report Card
              </h3>
              <p className="mt-1 text-sm">
                {report.session.name} · {report.term.name}
              </p>
              <p className="mt-2 text-xs text-muted-foreground print:hidden">
                Status: <strong>{report.report_card.status.toUpperCase()}</strong>
                {report.report_card.published_at
                  ? ` · Published ${new Date(report.report_card.published_at).toLocaleDateString()}`
                  : ""}
              </p>
            </div>

            <div className="grid gap-3 border-b border-border py-5 text-sm sm:grid-cols-2">
              <p><span className="text-muted-foreground">Student:</span>{" "}
                <strong>{[report.student.first_name, report.student.other_name, report.student.last_name].filter(Boolean).join(" ")}</strong>
              </p>
              <p><span className="text-muted-foreground">Admission number:</span>{" "}
                <strong>{report.student.admission_number}</strong>
              </p>
              <p><span className="text-muted-foreground">Class:</span>{" "}
                <strong>{report.student.class_name || "Not assigned"}</strong>
              </p>
              <p><span className="text-muted-foreground">Gender:</span>{" "}
                <strong>{report.student.gender || "Not recorded"}</strong>
              </p>
            </div>

            <div className="my-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Subjects recorded</p>
                <p className="mt-1 text-2xl font-bold">{report.summary.subjects_recorded}</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Average score</p>
                <p className="mt-1 text-2xl font-bold">
                  {report.summary.average_score ?? "—"}
                </p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Class position</p>
                <p className="mt-1 text-2xl font-bold">
                  {report.ranking.position
                    ? `${report.ranking.position}${report.ranking.position === 1 ? "st" : report.ranking.position === 2 ? "nd" : report.ranking.position === 3 ? "rd" : "th"}`
                    : "—"}
                  {report.ranking.position && report.ranking.class_size
                    ? ` / ${report.ranking.class_size}`
                    : ""}
                </p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Attendance rate</p>
                <p className="mt-1 text-2xl font-bold">
                  {report.attendance.rate === null ? "—" : `${report.attendance.rate}%`}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-y border-border bg-muted/50">
                    <th className="p-3">Subject</th>
                    <th className="p-3 text-right">CA / 40</th>
                    <th className="p-3 text-right">Exam / 60</th>
                    <th className="p-3 text-right">Total / 100</th>
                    <th className="p-3">Grade</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {report.results.map((item) => (
                    <tr key={item.id} className="border-b border-border">
                      <td className="p-3 font-medium">
                        {item.subject_name}
                        {item.subject_code ? <span className="block text-xs text-muted-foreground">{item.subject_code}</span> : null}
                      </td>
                      <td className="p-3 text-right">{item.ca_score ?? "—"}</td>
                      <td className="p-3 text-right">{item.exam_score ?? "—"}</td>
                      <td className="p-3 text-right font-semibold">{item.total_score ?? "—"}</td>
                      <td className="p-3">{item.grade || "—"}</td>
                      <td className="p-3">{item.remarks || "—"}</td>
                    </tr>
                  ))}
                  {report.results.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-muted-foreground">
                        No subject results have been recorded for this term.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-5">
              {[
                ["Present", report.attendance.present],
                ["Absent", report.attendance.absent],
                ["Late", report.attendance.late],
                ["Excused", report.attendance.excused],
                ["Recorded days", report.attendance.total_recorded],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-lg font-semibold">{value}</p>
                </div>
              ))}
            </div>
            {report.attendance.total_recorded === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Attendance has not been recorded for this term; the rate is not available.
              </p>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6 print:border-0 print:p-0">
            <h3 className="font-semibold">Comments and publication</h3>

            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Class teacher&apos;s comment</span>
              <textarea
                value={teacherComment}
                onChange={(event) => setTeacherComment(event.target.value)}
                maxLength={2000}
                rows={3}
                disabled={report.report_card.status === "published" && !isManager}
                className="w-full rounded-xl border border-border bg-background p-3 disabled:opacity-60 print:hidden"
                placeholder="Enter the class teacher's comment…"
              />
              <p className="hidden whitespace-pre-wrap print:block">{teacherComment || "—"}</p>
            </label>

            {isManager && (
              <>
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium">Principal&apos;s comment</span>
                  <textarea
                    value={principalComment}
                    onChange={(event) => setPrincipalComment(event.target.value)}
                    maxLength={2000}
                    rows={2}
                    className="w-full rounded-xl border border-border bg-background p-3 print:hidden"
                    placeholder="Enter the principal's comment…"
                  />
                  <p className="hidden whitespace-pre-wrap print:block">{principalComment || "—"}</p>
                </label>

                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium">Conduct and attitude</span>
                  <textarea
                    value={conductComment}
                    onChange={(event) => setConductComment(event.target.value)}
                    maxLength={2000}
                    rows={2}
                    className="w-full rounded-xl border border-border bg-background p-3 print:hidden"
                    placeholder="Enter conduct, punctuality, and attitude comments…"
                  />
                  <p className="hidden whitespace-pre-wrap print:block">{conductComment || "—"}</p>
                </label>

                <label className="block max-w-xs space-y-1.5 text-sm print:hidden">
                  <span className="font-medium">Report status</span>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as "draft" | "published")}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
              </>
            )}

            <div className="flex flex-wrap gap-3 print:hidden">
              <button
                type="button"
                onClick={() => void saveReport(isManager ? status : undefined)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save {isManager && status === "published" ? "and publish" : "report"}
              </button>
              {isManager && report.report_card.status === "published" && (
                <button
                  type="button"
                  onClick={() => {
                    setStatus("draft");
                    void saveReport("draft");
                  }}
                  disabled={saving}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-50"
                >
                  Unpublish to draft
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
