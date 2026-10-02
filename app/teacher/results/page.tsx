"use client";

import { useEffect, useMemo, useState } from "react";

type TeacherClass = {
  id: string;
  name: string;
  level?: string | null;
};

type TeacherSubject = {
  id: string;
  name: string;
  code?: string | null;
  class_id?: string | null;
};

type Session = {
  id: string;
  name: string;
};

type Term = {
  id: string;
  name: string;
};

type ResultRow = {
  id: string;
  admission_number?: string | null;
  first_name: string;
  last_name: string;
  other_name?: string | null;
  gender?: string | null;
  photo_url?: string | null;
  result_id?: string | null;
  ca_score?: number | string | null;
  exam_score?: number | string | null;
  total_score?: number | string | null;
  grade?: string | null;
  remarks?: string | null;
};

type ResultInput = {
  ca_score: string;
  exam_score: string;
  grade: string;
  remarks: string;
};

const GRADES = ["A", "B", "C", "D", "E", "F"];

function studentName(student: ResultRow) {
  return [student.first_name, student.other_name, student.last_name]
    .filter(Boolean)
    .join(" ");
}

function calculateTotal(record: ResultInput) {
  const ca = Number(record.ca_score);
  const exam = Number(record.exam_score);

  if (!Number.isFinite(ca) || !Number.isFinite(exam)) {
    return 0;
  }

  return ca + exam;
}

export default function TeacherResultsPage() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [term, setTerm] = useState<Term | null>(null);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [students, setStudents] = useState<ResultRow[]>([]);
  const [results, setResults] = useState<Record<string, ResultInput>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const availableSubjects = useMemo(() => {
    if (!selectedClass) {
      return [];
    }

    return subjects.filter(
      (subject) =>
        subject.class_id === null ||
        subject.class_id === undefined ||
        subject.class_id === selectedClass
    );
  }, [subjects, selectedClass]);

  useEffect(() => {
    async function loadOptions() {
      try {
        setLoadingOptions(true);
        setError("");

        const response = await fetch(
          "/api/teacher/results/options"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load result options."
          );
        }

        setClasses(data.classes ?? []);
        setSubjects(data.subjects ?? []);
        setSession(data.session ?? null);
        setTerm(data.term ?? null);

        if (data.classes?.length > 0) {
          setSelectedClass(data.classes[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load result options."
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    loadOptions();
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setSelectedSubject("");
      return;
    }

    const firstSubject = subjects.find(
      (subject) =>
        subject.class_id === null ||
        subject.class_id === undefined ||
        subject.class_id === selectedClass
    );

    setSelectedSubject(firstSubject?.id ?? "");
  }, [selectedClass, subjects]);

  useEffect(() => {
    async function loadResults() {
      if (!selectedClass || !selectedSubject) {
        setStudents([]);
        setResults({});
        setEditing({});
        return;
      }

      try {
        setLoadingResults(true);
        setError("");
        setSuccess("");

        const params = new URLSearchParams({
          class_id: selectedClass,
          subject_id: selectedSubject,
        });

        const response = await fetch(
          `/api/teacher/results?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load results."
          );
        }

        const rows: ResultRow[] = data.results ?? [];

        setStudents(rows);

        const nextResults: Record<string, ResultInput> = {};

        rows.forEach((student) => {
          nextResults[student.id] = {
            ca_score:
              student.ca_score !== null &&
              student.ca_score !== undefined
                ? String(student.ca_score)
                : "",
            exam_score:
              student.exam_score !== null &&
              student.exam_score !== undefined
                ? String(student.exam_score)
                : "",
            grade: student.grade ?? "",
            remarks: student.remarks ?? "",
          };
        });

        setResults(nextResults);
        setEditing({});
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load results."
        );
      } finally {
        setLoadingResults(false);
      }
    }

    loadResults();
  }, [selectedClass, selectedSubject]);

  function updateResult(
    studentId: string,
    field: keyof ResultInput,
    value: string
  ) {
    setResults((current) => ({
      ...current,
      [studentId]: {
        ...(current[studentId] ?? {
          ca_score: "",
          exam_score: "",
          grade: "",
          remarks: "",
        }),
        [field]: value,
      },
    }));
  }

  function validateResult(record: ResultInput) {
    const ca = Number(record.ca_score);
    const exam = Number(record.exam_score);

    if (
      !Number.isFinite(ca) ||
      ca < 0 ||
      ca > 40
    ) {
      return "CA score must be between 0 and 40.";
    }

    if (
      !Number.isFinite(exam) ||
      exam < 0 ||
      exam > 60
    ) {
      return "Exam score must be between 0 and 60.";
    }

    if (
      record.grade &&
      !GRADES.includes(record.grade.toUpperCase())
    ) {
      return "Invalid grade.";
    }

    return "";
  }

  async function saveStudent(student: ResultRow) {
    if (!session || !term) {
      setError("Current session or term is not configured.");
      return;
    }

    const record = results[student.id];

    if (!record) {
      return;
    }

    const validationError = validateResult(record);

    if (validationError) {
      setError(
        `${studentName(student)}: ${validationError}`
      );
      return;
    }

    const isEditing = Boolean(student.result_id);

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/teacher/results",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isEditing
              ? {
                  result_id: student.result_id,
                  ca_score: Number(record.ca_score),
                  exam_score: Number(record.exam_score),
                  grade: record.grade || null,
                  remarks: record.remarks || null,
                }
              : {
                  student_id: student.id,
                  class_id: selectedClass,
                  subject_id: selectedSubject,
                  academic_session_id: session.id,
                  term_id: term.id,
                  ca_score: Number(record.ca_score),
                  exam_score: Number(record.exam_score),
                  grade: record.grade || null,
                  remarks: record.remarks || null,
                }
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save result."
        );
      }

      const saved = data.result;

      setStudents((current) =>
        current.map((item) =>
          item.id === student.id
            ? {
                ...item,
                result_id: saved.id,
                ca_score: saved.ca_score,
                exam_score: saved.exam_score,
                total_score: saved.total_score,
                grade: saved.grade,
                remarks: saved.remarks,
              }
            : item
        )
      );

      setEditing((current) => ({
        ...current,
        [student.id]: false,
      }));

      setSuccess(
        isEditing
          ? `Result updated for ${studentName(student)}.`
          : `Result saved for ${studentName(student)}.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save result."
      );
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit(student: ResultRow) {
    setEditing((current) => ({
      ...current,
      [student.id]: false,
    }));

    setResults((current) => ({
      ...current,
      [student.id]: {
        ca_score:
          student.ca_score !== null &&
          student.ca_score !== undefined
            ? String(student.ca_score)
            : "",
        exam_score:
          student.exam_score !== null &&
          student.exam_score !== undefined
            ? String(student.exam_score)
            : "",
        grade: student.grade ?? "",
        remarks: student.remarks ?? "",
      },
    }));
  }

  if (loadingOptions) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">
            Loading Teacher Results...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <a
          href="/teacher"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to Teacher Dashboard
        </a>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Teacher Results
          </h1>
          <p className="mt-2 text-muted-foreground">
            Enter and update student results for your assigned classes
            and subjects.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            {success}
          </div>
        )}

        <section className="mb-6 rounded-2xl border bg-card p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="class"
                className="mb-1.5 block text-sm font-medium"
              >
                Class
              </label>
              <select
                id="class"
                value={selectedClass}
                onChange={(event) =>
                  setSelectedClass(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="subject"
                className="mb-1.5 block text-sm font-medium"
              >
                Subject
              </label>
              <select
                id="subject"
                value={selectedSubject}
                onChange={(event) =>
                  setSelectedSubject(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {availableSubjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.code ? ` (${item.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="rounded-lg bg-muted px-3 py-2">
              Session:{" "}
              <strong className="text-foreground">
                {session?.name ?? "—"}
              </strong>
            </span>
            <span className="rounded-lg bg-muted px-3 py-2">
              Term:{" "}
              <strong className="text-foreground">
                {term?.name ?? "—"}
              </strong>
            </span>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b px-5 py-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold">
                  Student Results
                </h2>
                <p className="text-sm text-muted-foreground">
                  CA: 40 marks · Exam: 60 marks · Total: 100 marks
                </p>
              </div>

              <span className="text-sm text-muted-foreground">
                {students.length} student
                {students.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {loadingResults ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading student results...
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-medium">
                No students found.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Make sure students are enrolled in this class.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {students.map((student) => {
                const record = results[student.id] ?? {
                  ca_score: "",
                  exam_score: "",
                  grade: "",
                  remarks: "",
                };

                const hasSavedResult = Boolean(
                  student.result_id
                );

                const isEditing = Boolean(
                  editing[student.id]
                );

                const total = calculateTotal(record);

                return (
                  <div
                    key={student.id}
                    className="p-5"
                  >
                    <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-center">
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {studentName(student)}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Admission No:{" "}
                          {student.admission_number ||
                            "Not assigned"}
                        </p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <label
                              htmlFor={`ca-${student.id}`}
                              className="mb-1.5 block text-xs font-medium text-muted-foreground"
                            >
                              CA / 40
                            </label>
                            <input
                              id={`ca-${student.id}`}
                              type="number"
                              min="0"
                              max="40"
                              step="0.01"
                              value={record.ca_score}
                              disabled={
                                hasSavedResult && !isEditing
                              }
                              onChange={(event) =>
                                updateResult(
                                  student.id,
                                  "ca_score",
                                  event.target.value
                                )
                              }
                              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`exam-${student.id}`}
                              className="mb-1.5 block text-xs font-medium text-muted-foreground"
                            >
                              Exam / 60
                            </label>
                            <input
                              id={`exam-${student.id}`}
                              type="number"
                              min="0"
                              max="60"
                              step="0.01"
                              value={record.exam_score}
                              disabled={
                                hasSavedResult && !isEditing
                              }
                              onChange={(event) =>
                                updateResult(
                                  student.id,
                                  "exam_score",
                                  event.target.value
                                )
                              }
                              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`grade-${student.id}`}
                              className="mb-1.5 block text-xs font-medium text-muted-foreground"
                            >
                              Grade
                            </label>
                            <select
                              id={`grade-${student.id}`}
                              value={record.grade}
                              disabled={
                                hasSavedResult && !isEditing
                              }
                              onChange={(event) =>
                                updateResult(
                                  student.id,
                                  "grade",
                                  event.target.value
                                )
                              }
                              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <option value="">
                                Select
                              </option>
                              {GRADES.map((grade) => (
                                <option
                                  key={grade}
                                  value={grade}
                                >
                                  {grade}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label
                              htmlFor={`total-${student.id}`}
                              className="mb-1.5 block text-xs font-medium text-muted-foreground"
                            >
                              Total / 100
                            </label>
                            <div
                              id={`total-${student.id}`}
                              className="flex h-10 items-center rounded-xl border border-input bg-muted px-3 text-sm font-semibold"
                            >
                              {total.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <label
                            htmlFor={`remarks-${student.id}`}
                            className="mb-1.5 block text-xs font-medium text-muted-foreground"
                          >
                            Remarks
                          </label>
                          <input
                            id={`remarks-${student.id}`}
                            type="text"
                            value={record.remarks}
                            disabled={
                              hasSavedResult && !isEditing
                            }
                            onChange={(event) =>
                              updateResult(
                                student.id,
                                "remarks",
                                event.target.value
                              )
                            }
                            placeholder="Optional"
                            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        {!hasSavedResult ? (
                          <button
                            type="button"
                            onClick={() =>
                              saveStudent(student)
                            }
                            disabled={saving}
                            className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                        ) : isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                saveStudent(student)
                              }
                              disabled={saving}
                              className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {saving ? "Updating..." : "Update"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                cancelEdit(student)
                              }
                              disabled={saving}
                              className="h-10 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setEditing((current) => ({
                                ...current,
                                [student.id]: true,
                              }))
                            }
                            className="h-10 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
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
