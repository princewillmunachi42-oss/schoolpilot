"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Loader2,
  RefreshCw,
  School,
  UserCheck,
  UserMinus,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

type Session = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
};

type StudentPromotion = {
  enrollment_id: string;
  student_id: string;
  class_id: string;
  enrollment_status: string;
  promotion_decision: string;
  next_class_id: string | null;

  admission_number: string;
  first_name: string;
  last_name: string;
  other_name: string | null;
  student_status: string;

  class_name: string;
  next_class_name: string | null;

  configured_next_class_id: string | null;
  configured_repeat_class_id: string | null;
  configured_repeat_class_name: string | null;
};

type ClassItem = {
  id: string;
  name: string;
  academic_session_id: string;
  status: string;
};

const decisionStyles: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  promote: {
    label: "Promoted",
    className: "bg-success/10 text-success",
  },
  repeat: {
    label: "Repeating",
    className: "bg-warning/10 text-warning",
  },
  graduate: {
    label: "Graduating",
    className: "bg-primary/10 text-primary",
  },
  withdraw: {
    label: "Withdrawn",
    className: "bg-destructive/10 text-destructive",
  },
  transfer: {
    label: "Transferring",
    className: "bg-secondary/10 text-secondary",
  },
};

function getStudentName(student: StudentPromotion) {
  return [student.first_name, student.last_name].filter(Boolean).join(" ");
}

export default function PromotionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [targetSessionId, setTargetSessionId] = useState("");
  const [students, setStudents] = useState<StudentPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const targetClasses = useMemo(
    () =>
      classes.filter(
        (item) =>
          item.academic_session_id === targetSessionId &&
          item.status === "active"
      ),
    [classes, targetSessionId]
  );

  const decisionCounts = useMemo(
    () => ({
      pending: students.filter(
        (student) =>
          !student.promotion_decision ||
          student.promotion_decision === "pending"
      ).length,
      promote: students.filter(
        (student) => student.promotion_decision === "promote"
      ).length,
      repeat: students.filter(
        (student) => student.promotion_decision === "repeat"
      ).length,
      other: students.filter((student) =>
        ["graduate", "withdraw", "transfer"].includes(
          student.promotion_decision
        )
      ).length,
    }),
    [students]
  );

  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");

      const [sessionsResponse, classesResponse] = await Promise.all([
        fetch("/api/school/sessions"),
        fetch("/api/school/classes"),
      ]);

      const sessionsData = await sessionsResponse.json();
      const classesData = await classesResponse.json();

      if (!sessionsResponse.ok || !sessionsData.success) {
        throw new Error(
          sessionsData.message || "Failed to load sessions"
        );
      }

      if (!classesResponse.ok || !classesData.success) {
        throw new Error(
          classesData.message || "Failed to load classes"
        );
      }

      const sessionList: Session[] = sessionsData.sessions ?? [];
      const classList: ClassItem[] = classesData.classes ?? [];

      setSessions(sessionList);
      setClasses(classList);

      const currentSession =
        sessionList.find((session) => session.is_current) ??
        sessionList[0];

      if (currentSession) {
        setTargetSessionId(currentSession.id);

        const previousSession =
          sessionList.find(
            (session) =>
              session.id !== currentSession.id &&
              new Date(session.end_date) <=
                new Date(currentSession.start_date)
          ) ??
          sessionList.find(
            (session) => session.id !== currentSession.id
          );

        if (previousSession) {
          setSelectedSessionId(previousSession.id);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load promotion setup"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadStudents() {
    if (!selectedSessionId) {
      setStudents([]);
      return;
    }

    try {
      setLoadingStudents(true);
      setError("");
      setMessage("");

      const params = new URLSearchParams({
        sessionId: selectedSessionId,
      });

      if (targetSessionId) {
        params.set("targetSessionId", targetSessionId);
      }

      const response = await fetch(
        `/api/school/promotions?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load promotion records"
        );
      }

      setStudents(data.students ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load promotion records"
      );
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }

  async function saveDecision(
    student: StudentPromotion,
    decision: string,
    nextClassId: string | null = null
  ) {
    try {
      setSavingId(student.enrollment_id);
      setError("");
      setMessage("");

      const response = await fetch("/api/school/promotions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enrollmentId: student.enrollment_id,
          decision,
          nextClassId,
          targetSessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to save decision"
        );
      }

      setStudents((current) =>
        current.map((item) =>
          item.enrollment_id === student.enrollment_id
            ? {
                ...item,
                promotion_decision: decision,
                next_class_id:
                  decision === "promote" ? nextClassId : null,
                next_class_name:
                  decision === "promote"
                    ? targetClasses.find(
                        (classItem) => classItem.id === nextClassId
                      )?.name ?? null
                    : null,
              }
            : item
        )
      );

      setMessage(
        `${student.first_name} ${student.last_name}: ${decision} saved.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save decision"
      );
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadStudents();
    }
  }, [selectedSessionId, targetSessionId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-4 w-36 rounded bg-muted" />
            <div className="h-9 w-64 rounded bg-muted" />
            <div className="h-5 w-full max-w-xl rounded bg-muted" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 rounded-2xl border border-border bg-card"
                />
              ))}
            </div>
            <div className="h-52 rounded-2xl border border-border bg-card" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <ArrowUpDown className="h-4 w-4" />
              People Management
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Student Promotion
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Review student outcomes and assign each student a destination
              for the next academic session.
            </p>
          </div>
        </header>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Total
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold">{students.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Students to review
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <RefreshCw className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Pending
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold">
              {decisionCounts.pending}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Decisions remaining
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
                <UserCheck className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Promoted
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold">
              {decisionCounts.promote}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Assigned to next class
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Other outcomes
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold">
              {decisionCounts.other}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Graduate, transfer or withdraw
            </p>
          </div>
        </div>

        <section className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-muted/30 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ArrowUpDown className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Promotion cycle
                </h2>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Select the completed session and the academic session
                  students will move into.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
            <div>
              <label
                htmlFor="selectedSession"
                className="mb-2 block text-sm font-medium"
              >
                Completed session
              </label>

              <select
                id="selectedSession"
                value={selectedSessionId}
                onChange={(event) =>
                  setSelectedSessionId(event.target.value)
                }
                className="min-h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select session</option>

                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                    {session.is_current ? " (Current)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden items-center justify-center lg:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>

            <div>
              <label
                htmlFor="targetSession"
                className="mb-2 block text-sm font-medium"
              >
                New academic session
              </label>

              <select
                id="targetSession"
                value={targetSessionId}
                onChange={(event) =>
                  setTargetSessionId(event.target.value)
                }
                className="min-h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select target session</option>

                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                    {session.is_current ? " (Current)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-border bg-muted/20 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <School className="h-4 w-4" />
              <span>
                {targetClasses.length} active target{" "}
                {targetClasses.length === 1 ? "class" : "classes"} available
              </span>
              {selectedSessionId && targetSessionId && (
                <>
                  <span>•</span>
                  <span>
                    Promotion records update automatically when the session
                    selection changes.
                  </span>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-muted/30 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-semibold">Student decisions</h2>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Assign an outcome to every student in the completed
                  session.
                </p>
              </div>

              {students.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <span className="rounded-full bg-warning/10 px-3 py-1.5 text-warning">
                    {decisionCounts.pending} pending
                  </span>
                  <span className="rounded-full bg-success/10 px-3 py-1.5 text-success">
                    {decisionCounts.promote} promoted
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1.5 text-muted-foreground">
                    {students.length} total
                  </span>
                </div>
              )}
            </div>
          </div>

          {loadingStudents ? (
            <div className="space-y-4 p-5 sm:p-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-border p-5"
                >
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-xl bg-muted" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-48 rounded bg-muted" />
                      <div className="h-3 w-64 rounded bg-muted" />
                      <div className="h-10 w-full rounded bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UserRound className="h-8 w-8" />
              </div>

              <h3 className="mt-5 font-semibold">
                No student enrollments found
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Select a completed academic session with student
                enrollments to begin reviewing promotion decisions.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {students.map((student) => {
                const isSaving =
                  savingId === student.enrollment_id;

                const decision =
                  decisionStyles[student.promotion_decision];

                return (
                  <div
                    key={student.enrollment_id}
                    className="p-5 transition-colors hover:bg-muted/10 sm:p-6"
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                            {student.first_name
                              .charAt(0)
                              .toUpperCase()}
                            {student.last_name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold">
                                {getStudentName(student)}
                              </h3>

                              {decision && (
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${decision.className}`}
                                >
                                  {decision.label}
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <span>
                                Admission: {student.admission_number}
                              </span>
                              <span>
                                Current class: {student.class_name}
                              </span>
                            </div>
                          </div>
                        </div>

                        {student.next_class_name && (
                          <div className="flex items-center gap-2 rounded-xl bg-success/10 px-3.5 py-2.5 text-sm">
                            <UserCheck className="h-4 w-4 text-success" />
                            <span className="text-muted-foreground">
                              Moving to
                            </span>
                            <span className="font-semibold text-success">
                              {student.next_class_name}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4 lg:grid-cols-[1fr_auto] lg:items-end">
                        <div>
                          <label
                            htmlFor={`target-${student.enrollment_id}`}
                            className="mb-2 block text-sm font-medium"
                          >
                            Promote to
                          </label>

                          <select
                            id={`target-${student.enrollment_id}`}
                            value={student.next_class_id ?? ""}
                            onChange={(event) => {
                              const classId =
                                event.target.value || null;

                              if (classId) {
                                saveDecision(
                                  student,
                                  "promote",
                                  classId
                                );
                              }
                            }}
                            disabled={
                              isSaving ||
                              !targetSessionId ||
                              targetClasses.length === 0
                            }
                            className="min-h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="">
                              {targetClasses.length === 0
                                ? "No active target classes"
                                : "Select target class"}
                            </option>

                            {targetClasses.map((classItem) => (
                              <option
                                key={classItem.id}
                                value={classItem.id}
                              >
                                {classItem.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              saveDecision(
                                student,
                                "repeat",
                                student.configured_repeat_class_id
                              )
                            }
                            disabled={isSaving}
                            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Repeat
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              saveDecision(student, "graduate")
                            }
                            disabled={isSaving}
                            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                          >
                            <GraduationCap className="h-4 w-4" />
                            Graduate
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              saveDecision(student, "withdraw")
                            }
                            disabled={isSaving}
                            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-background px-3.5 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                          >
                            <UserMinus className="h-4 w-4" />
                            Withdraw
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              saveDecision(student, "transfer")
                            }
                            disabled={isSaving}
                            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-secondary/30 bg-background px-3.5 py-2 text-sm font-semibold text-secondary transition-colors hover:bg-secondary/10 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                          >
                            <ArrowUpDown className="h-4 w-4" />
                            Transfer
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                        <div>
                          {student.configured_repeat_class_name ? (
                            <span>
                              Configured repeat class:{" "}
                              <span className="font-medium text-foreground">
                                {student.configured_repeat_class_name}
                              </span>
                            </span>
                          ) : (
                            <span>
                              No configured repeat class.
                            </span>
                          )}
                        </div>

                        {isSaving && (
                          <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Saving decision...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <School className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-semibold">
                Promotion workflow
              </h3>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Review each student&apos;s outcome carefully before the
                target academic session becomes current. Decisions are saved
                directly to the school&apos;s promotion records.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
