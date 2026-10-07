"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  GraduationCap,
  Save,
  Users,
  X,
} from "lucide-react";

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

  const selectedClassName =
    classes.find((item) => item.id === selectedClass)?.name ?? "—";

  const selectedSubjectName =
    availableSubjects.find((item) => item.id === selectedSubject)?.name ??
    "—";

  const savedCount = students.filter(
    (student) => Boolean(student.result_id)
  ).length;

  const pendingCount = students.length - savedCount;

  useEffect(() => {
    async function loadOptions() {
      try {
        setLoadingOptions(true);
        setError("");

        const response = await fetch("/api/teacher/results/options", {
          cache: "no-store",
        });

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
          `/api/teacher/results?${params.toString()}`,
          {
            cache: "no-store",
          }
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

    if (!Number.isFinite(ca) || ca < 0 || ca > 40) {
      return "CA score must be between 0 and 40.";
    }

    if (!Number.isFinite(exam) || exam < 0 || exam > 60) {
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
      setError(`${studentName(student)}: ${validationError}`);
      return;
    }

    const isEditing = Boolean(student.result_id);

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/teacher/results", {
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
      });

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
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-5 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="mt-4 h-10 w-72 animate-pulse rounded-lg bg-muted" />
          <div className="mt-2 h-5 w-full max-w-xl animate-pulse rounded-lg bg-muted" />

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>

          <div className="mt-6 h-72 animate-pulse rounded-2xl bg-muted" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/teacher"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Teacher Dashboard
        </Link>

        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Academic workspace
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Results
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Enter and update student results for your assigned
                classes and subjects.
              </p>
            </div>

            {selectedClass && selectedSubject && (
              <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Current assessment
                </p>
                <p className="mt-1 font-semibold">
                  {selectedSubjectName}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {selectedClassName}
                </p>
              </div>
            )}
          </div>
        </header>

        {error && (
          <div
            className="mb-5 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
            role="alert"
          >
            <X className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div
            className="mb-5 flex items-start gap-3 rounded-2xl border border-success/20 bg-success/10 p-4 text-sm text-success"
            role="status"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>

              <span className="text-xs font-medium text-muted-foreground">
                Students
              </span>
            </div>

            <p className="mt-4 text-2xl font-bold">
              {students.length}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              In selected class
            </p>
          </div>

          <div className="rounded-2xl border border-success/20 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <span className="text-xs font-medium text-muted-foreground">
                Completed
              </span>
            </div>

            <p className="mt-4 text-2xl font-bold">
              {savedCount}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Results saved
            </p>
          </div>

          <div className="rounded-2xl border border-warning/20 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <Edit3 className="h-5 w-5" />
              </div>

              <span className="text-xs font-medium text-muted-foreground">
                Pending
              </span>
            </div>

            <p className="mt-4 text-2xl font-bold">
              {pendingCount}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Awaiting results
            </p>
          </div>
        </section>

        <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  Assessment Selection
                </h2>

                <p className="text-sm text-muted-foreground">
                  Select the class and subject you want to manage.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="teacher-results-class"
                className="mb-2 block text-sm font-medium"
              >
                Class
              </label>

              <select
                id="teacher-results-class"
                value={selectedClass}
                onChange={(event) =>
                  setSelectedClass(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
              >
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.level ? ` — ${item.level}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="teacher-results-subject"
                className="mb-2 block text-sm font-medium"
              >
                Subject
              </label>

              <select
                id="teacher-results-subject"
                value={selectedSubject}
                onChange={(event) =>
                  setSelectedSubject(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
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

          <div className="flex flex-wrap gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:px-6">
            <span className="rounded-lg bg-background px-3 py-2 text-sm text-muted-foreground">
              Session:{" "}
              <strong className="text-foreground">
                {session?.name ?? "Not configured"}
              </strong>
            </span>

            <span className="rounded-lg bg-background px-3 py-2 text-sm text-muted-foreground">
              Term:{" "}
              <strong className="text-foreground">
                {term?.name ?? "Not configured"}
              </strong>
            </span>

            <span className="rounded-lg bg-background px-3 py-2 text-sm text-muted-foreground">
              Scale:{" "}
              <strong className="text-foreground">
                40 CA + 60 Exam
              </strong>
            </span>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Student Results
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Enter CA and exam scores, then save each student.
                </p>
              </div>

              <span className="inline-flex w-fit items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-sm font-semibold">
                {students.length}{" "}
                {students.length === 1 ? "student" : "students"}
              </span>
            </div>
          </div>

          {loadingResults ? (
            <div className="space-y-4 p-5 sm:p-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-52 animate-pulse rounded-2xl bg-muted"
                />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <GraduationCap className="h-7 w-7" />
              </div>

              <p className="mt-4 font-semibold">
                No students found
              </p>

              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                Make sure students are enrolled in this class before
                entering results.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {students.map((student) => {
                const record = results[student.id] ?? {
                  ca_score: "",
                  exam_score: "",
                  grade: "",
                  remarks: "",
                };

                const hasSavedResult = Boolean(student.result_id);
                const isEditing = Boolean(editing[student.id]);
                const total = calculateTotal(record);

                return (
                  <article
                    key={student.id}
                    className="p-5 transition-colors hover:bg-muted/20 sm:p-6"
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <GraduationCap className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold">
                                {studentName(student)}
                              </h3>

                              {hasSavedResult && (
                                <span className="rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                                  Saved
                                </span>
                              )}

                              {isEditing && (
                                <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                                  Editing
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground">
                              Admission No:{" "}
                              {student.admission_number ||
                                "Not assigned"}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          {!hasSavedResult ? (
                            <button
                              type="button"
                              onClick={() => saveStudent(student)}
                              disabled={saving}
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Save className="h-4 w-4" />
                              {saving ? "Saving..." : "Save Result"}
                            </button>
                          ) : isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => saveStudent(student)}
                                disabled={saving}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Save className="h-4 w-4" />
                                {saving ? "Updating..." : "Update"}
                              </button>

                              <button
                                type="button"
                                onClick={() => cancelEdit(student)}
                                disabled={saving}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <X className="h-4 w-4" />
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
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted"
                            >
                              <Edit3 className="h-4 w-4" />
                              Edit Result
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <label
                            htmlFor={`ca-${student.id}`}
                            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
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
                            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`exam-${student.id}`}
                            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
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
                            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`grade-${student.id}`}
                            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
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
                            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <option value="">Select grade</option>

                            {GRADES.map((grade) => (
                              <option key={grade} value={grade}>
                                {grade}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor={`total-${student.id}`}
                            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                          >
                            Total / 100
                          </label>

                          <div
                            id={`total-${student.id}`}
                            className="flex h-11 items-center rounded-xl border border-border bg-muted px-3 text-sm font-bold"
                          >
                            {total.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor={`remarks-${student.id}`}
                          className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
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
                          placeholder="Optional remark"
                          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
