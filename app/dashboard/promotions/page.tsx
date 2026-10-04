"use client";

import { useEffect, useMemo, useState } from "react";

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
          ) ?? sessionList.find(
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
                        (item) => item.id === nextClassId
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
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-muted-foreground">
            Loading promotion setup...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <a
            href="/dashboard"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Back to Dashboard
          </a>

          <h1 className="mt-3 text-2xl font-bold">
            Student Promotion
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Decide what happens to students when the next academic
            session becomes current.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
            {message}
          </div>
        )}

        <section className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Completed session
            </label>

            <select
              value={selectedSessionId}
              onChange={(event) =>
                setSelectedSessionId(event.target.value)
              }
              className="w-full rounded-lg border bg-background px-3 py-2"
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

          <div>
            <label className="mb-2 block text-sm font-medium">
              New academic session
            </label>

            <select
              value={targetSessionId}
              onChange={(event) =>
                setTargetSessionId(event.target.value)
              }
              className="w-full rounded-lg border bg-background px-3 py-2"
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
        </section>

        <section className="overflow-hidden rounded-xl border">
          <div className="border-b p-4">
            <h2 className="font-semibold">
              Student decisions
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Every active student must have a decision before the
              new session can become current.
            </p>
          </div>

          {loadingStudents ? (
            <div className="p-6 text-sm text-muted-foreground">
              Loading students...
            </div>
          ) : students.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No student enrollments found for this session.
            </div>
          ) : (
            <div className="divide-y">
              {students.map((student) => {
                const isSaving =
                  savingId === student.enrollment_id;

                return (
                  <div
                    key={student.enrollment_id}
                    className="space-y-4 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-medium">
                          {student.first_name}{" "}
                          {student.last_name}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Admission:{" "}
                          {student.admission_number}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Current class: {student.class_name}
                        </p>
                      </div>

                      <div className="text-sm">
                        <span className="font-medium">
                          Decision:
                        </span>{" "}
                        {student.promotion_decision}
                      </div>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Promote to
                        </label>

                        <select
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
                          className="w-full rounded-lg border bg-background px-3 py-2"
                        >
                          <option value="">
                            Select target class
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

                      <div className="flex flex-wrap items-end gap-2">
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
                          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                        >
                          Repeat
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            saveDecision(
                              student,
                              "graduate"
                            )
                          }
                          disabled={isSaving}
                          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                        >
                          Graduate
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            saveDecision(
                              student,
                              "withdraw"
                            )
                          }
                          disabled={isSaving}
                          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                        >
                          Withdraw
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            saveDecision(
                              student,
                              "transfer"
                            )
                          }
                          disabled={isSaving}
                          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                        >
                          Transfer
                        </button>
                      </div>
                    </div>

                    {student.configured_repeat_class_name && (
                      <p className="text-xs text-muted-foreground">
                        Configured repeat class:{" "}
                        {student.configured_repeat_class_name}
                      </p>
                    )}

                    {isSaving && (
                      <p className="text-xs text-muted-foreground">
                        Saving decision...
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
