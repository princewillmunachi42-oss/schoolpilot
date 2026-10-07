"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Edit3,
  GraduationCap,
  Save,
  Users,
  X,
} from "lucide-react";

type TeacherClass = {
  id: string;
  name: string;
  level: string | null;
  capacity: number | null;
  status: string;
  is_primary: boolean;
  created_at: string;
};

type Student = {
  id: string;
  admission_number: string | null;
  first_name: string;
  last_name: string;
  other_name: string | null;
  gender: string | null;
  photo_url: string | null;
  attendance_id: string | null;
  attendance_date: string | null;
  attendance_status:
    | "present"
    | "absent"
    | "late"
    | "excused"
    | null;
  attendance_remarks: string | null;
};

type Session = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
};

type Term = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  academic_session_id: string;
};

type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "excused";

type StudentAttendance = {
  status: AttendanceStatus;
  remarks: string;
};

function today() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function studentName(student: Student) {
  return [
    student.first_name,
    student.other_name,
    student.last_name,
  ]
    .filter(Boolean)
    .join(" ");
}

const statusStyles: Record<AttendanceStatus, string> = {
  present:
    "border-success/20 bg-success/10 text-success",
  absent:
    "border-destructive/20 bg-destructive/10 text-destructive",
  late:
    "border-warning/20 bg-warning/10 text-warning",
  excused:
    "border-primary/20 bg-primary/10 text-primary",
};

const statusLabels: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
};

export default function TeacherAttendancePage() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(today());
  const [session, setSession] = useState<Session | null>(null);
  const [term, setTerm] = useState<Term | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<
    Record<string, StudentAttendance>
  >({});
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadOptions() {
    setLoading(true);
    setError("");

    try {
      const [classesResponse, optionsResponse] = await Promise.all([
        fetch("/api/teacher/classes"),
        fetch("/api/teacher/attendance/options"),
      ]);

      const classesData = await classesResponse.json();
      const optionsData = await optionsResponse.json();

      if (!classesResponse.ok) {
        throw new Error(
          classesData.error || "Failed to load your classes."
        );
      }

      if (!optionsResponse.ok) {
        throw new Error(
          optionsData.error || "Failed to load attendance options."
        );
      }

      const teacherClasses = classesData.classes ?? [];

      setClasses(teacherClasses);
      setSession(optionsData.session ?? null);
      setTerm(optionsData.term ?? null);

      if (teacherClasses.length > 0) {
        setSelectedClassId((current) =>
          current &&
          teacherClasses.some(
            (item: TeacherClass) => item.id === current
          )
            ? current
            : teacherClasses[0].id
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load attendance."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadStudents(classId: string, date: string) {
    if (!classId) {
      setStudents([]);
      setAttendance({});
      return;
    }

    setStudentsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/teacher/attendance?class_id=${encodeURIComponent(
          classId
        )}&attendance_date=${encodeURIComponent(date)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load class attendance."
        );
      }

      const classStudents: Student[] = data.students ?? [];

      setStudents(classStudents);

      const nextAttendance: Record<
        string,
        StudentAttendance
      > = {};

      for (const student of classStudents) {
        nextAttendance[student.id] = {
          status: student.attendance_status ?? "present",
          remarks: student.attendance_remarks ?? "",
        };
      }

      setAttendance(nextAttendance);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load class attendance."
      );
      setStudents([]);
      setAttendance({});
    } finally {
      setStudentsLoading(false);
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId, attendanceDate);
    }
  }, [selectedClassId, attendanceDate]);

  function updateStudentAttendance(
    studentId: string,
    field: keyof StudentAttendance,
    value: string
  ) {
    setAttendance((current) => ({
      ...current,
      [studentId]: {
        ...(current[studentId] ?? {
          status: "present",
          remarks: "",
        }),
        [field]: value,
      },
    }));
  }

  async function saveStudent(student: Student) {
    if (!session || !term) {
      setError(
        "Current academic session and term are required."
      );
      return;
    }

    const record = attendance[student.id];

    if (!record) {
      setError("Attendance details are missing.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const isEditing = Boolean(student.attendance_id);

    try {
      const response = await fetch("/api/teacher/attendance", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isEditing
            ? {
                attendance_id: student.attendance_id,
                status: record.status,
                remarks: record.remarks,
              }
            : {
                student_id: student.id,
                academic_session_id: session.id,
                term_id: term.id,
                attendance_date: attendanceDate,
                status: record.status,
                remarks: record.remarks,
              }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            (isEditing
              ? "Failed to update attendance."
              : "Failed to save attendance.")
        );
        return;
      }

      setStudents((current) =>
        current.map((item) =>
          item.id === student.id
            ? {
                ...item,
                attendance_id:
                  data.attendance?.id ??
                  item.attendance_id,
                attendance_date:
                  data.attendance?.attendance_date ??
                  item.attendance_date ??
                  attendanceDate,
                attendance_status:
                  data.attendance?.status ??
                  record.status,
                attendance_remarks:
                  data.attendance?.remarks ??
                  record.remarks,
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
          ? `Attendance updated for ${studentName(student)}.`
          : `Attendance saved for ${studentName(student)}.`
      );
    } catch {
      setError(
        isEditing
          ? "Unable to update attendance."
          : "Unable to save attendance."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveAll() {
    if (!session || !term) {
      setError(
        "Current academic session and term are required."
      );
      return;
    }

    if (students.length === 0) {
      setError("There are no students in this class.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    let saved = 0;
    let alreadyExists = 0;
    let failed = 0;

    for (const student of students) {
      const record = attendance[student.id];

      if (!record) {
        failed += 1;
        continue;
      }

      try {
        const response = await fetch(
          "/api/teacher/attendance",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              student_id: student.id,
              academic_session_id: session.id,
              term_id: term.id,
              attendance_date: attendanceDate,
              status: record.status,
              remarks: record.remarks,
            }),
          }
        );

        if (response.ok) {
          saved += 1;
        } else if (response.status === 409) {
          alreadyExists += 1;
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    }

    setSaving(false);

    if (failed > 0 || alreadyExists > 0) {
      setError(
        `Saved: ${saved}. Already recorded: ${alreadyExists}. Failed: ${failed}.`
      );
    } else {
      setSuccess(
        `Attendance saved successfully for ${saved} student${
          saved === 1 ? "" : "s"
        }.`
      );
    }

    await loadStudents(selectedClassId, attendanceDate);
  }

  const selectedClass = classes.find(
    (item) => item.id === selectedClassId
  );

  const attendanceSummary = students.reduce(
    (summary, student) => {
      const status =
        attendance[student.id]?.status ?? "present";

      summary[status] += 1;
      return summary;
    },
    {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    } as Record<AttendanceStatus, number>
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-5 w-44 animate-pulse rounded bg-muted" />
          <div className="space-y-3">
            <div className="h-9 w-64 animate-pulse rounded-lg bg-muted" />
            <div className="h-5 w-96 max-w-full animate-pulse rounded bg-muted" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl border border-border bg-card"
              />
            ))}
          </div>

          <div className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="h-80 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
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
                Attendance workspace
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Attendance
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Record, review, and update daily attendance
                for students in your assigned classes.
              </p>
            </div>

            {selectedClass && (
              <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Selected class
                </p>
                <p className="mt-1 font-semibold">
                  {selectedClass.name}
                </p>
              </div>
            )}
          </div>
        </header>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            <X className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-success/20 bg-success/10 p-4 text-sm text-success">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {!session || !term ? (
          <section className="rounded-2xl border border-warning/20 bg-card p-6 shadow-sm">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  Attendance setup required
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Your school must configure a current
                  academic session and current term before
                  attendance can be recorded.
                </p>
              </div>
            </div>
          </section>
        ) : classes.length === 0 ? (
          <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              No classes assigned
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              You do not currently have any classes assigned
              to you.
            </p>

            <Link
              href="/teacher"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Link>
          </section>
        ) : (
          <>
            <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    <Check className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Present
                  </span>
                </div>

                <p className="mt-4 text-2xl font-bold">
                  {attendanceSummary.present}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Marked present
                </p>
              </div>

              <div className="rounded-2xl border border-destructive/20 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <X className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Absent
                  </span>
                </div>

                <p className="mt-4 text-2xl font-bold">
                  {attendanceSummary.absent}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Marked absent
                </p>
              </div>

              <div className="rounded-2xl border border-warning/20 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Late
                  </span>
                </div>

                <p className="mt-4 text-2xl font-bold">
                  {attendanceSummary.late}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Marked late
                </p>
              </div>
            </section>

            <section className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Attendance filters
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Choose the class and date you want to manage.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="attendance-class"
                    className="mb-2 block text-sm font-medium"
                  >
                    Class
                  </label>

                  <select
                    id="attendance-class"
                    value={selectedClassId}
                    onChange={(event) =>
                      setSelectedClassId(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
                  >
                    {classes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                        {item.is_primary ? " — Primary" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="attendance-date"
                    className="mb-2 block text-sm font-medium"
                  >
                    Attendance date
                  </label>

                  <input
                    id="attendance-date"
                    type="date"
                    value={attendanceDate}
                    onChange={(event) =>
                      setAttendanceDate(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Academic period
                  </p>

                  <p className="mt-1 font-semibold">
                    {session.name}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {term.name}
                  </p>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ClipboardCheck className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold">
                          Student attendance
                        </h2>

                        <p className="text-sm text-muted-foreground">
                          {students.length} student
                          {students.length === 1 ? "" : "s"}
                          {selectedClass
                            ? ` · ${selectedClass.name}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={saveAll}
                    disabled={
                      saving ||
                      studentsLoading ||
                      students.length === 0
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving
                      ? "Saving..."
                      : "Save All Attendance"}
                  </button>
                </div>
              </div>

              {studentsLoading ? (
                <div className="space-y-4 p-5 sm:p-6">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-28 animate-pulse rounded-2xl bg-muted"
                    />
                  ))}
                </div>
              ) : students.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <Users className="h-7 w-7" />
                  </div>

                  <p className="mt-4 font-semibold">
                    No active students found
                  </p>

                  <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                    This class currently has no active students.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {students.map((student) => {
                    const record =
                      attendance[student.id] ?? {
                        status: "present" as AttendanceStatus,
                        remarks: "",
                      };

                    const hasSavedAttendance =
                      Boolean(student.attendance_id);

                    const isEditing = Boolean(
                      editing[student.id]
                    );

                    return (
                      <div
                        key={student.id}
                        className="p-5 transition-colors hover:bg-muted/20 sm:p-6"
                      >
                        <div className="flex flex-col gap-5">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <GraduationCap className="h-5 w-5" />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-semibold">
                                  {studentName(student)}
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                  Admission No:{" "}
                                  {student.admission_number ||
                                    "Not assigned"}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                statusStyles[record.status]
                              }`}
                            >
                              {statusLabels[record.status]}
                            </span>
                          </div>

                          <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr_auto] lg:items-end">
                            <div>
                              <label
                                htmlFor={`status-${student.id}`}
                                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                              >
                                Status
                              </label>

                              <select
                                id={`status-${student.id}`}
                                value={record.status}
                                disabled={
                                  hasSavedAttendance &&
                                  !isEditing
                                }
                                onChange={(event) =>
                                  updateStudentAttendance(
                                    student.id,
                                    "status",
                                    event.target.value
                                  )
                                }
                                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <option value="present">
                                  Present
                                </option>
                                <option value="absent">
                                  Absent
                                </option>
                                <option value="late">
                                  Late
                                </option>
                                <option value="excused">
                                  Excused
                                </option>
                              </select>
                            </div>

                            <div>
                              <label
                                htmlFor={`remarks-${student.id}`}
                                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                              >
                                Remarks
                              </label>

                              <input
                                id={`remarks-${student.id}`}
                                type="text"
                                value={record.remarks}
                                disabled={
                                  hasSavedAttendance &&
                                  !isEditing
                                }
                                onChange={(event) =>
                                  updateStudentAttendance(
                                    student.id,
                                    "remarks",
                                    event.target.value
                                  )
                                }
                                placeholder="Optional attendance remark"
                                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                              />
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {!hasSavedAttendance ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    saveStudent(student)
                                  }
                                  disabled={saving}
                                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Save className="h-4 w-4" />
                                  Save
                                </button>
                              ) : isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      saveStudent(student)
                                    }
                                    disabled={saving}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Check className="h-4 w-4" />
                                    {saving
                                      ? "Updating..."
                                      : "Update"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditing(
                                        (current) => ({
                                          ...current,
                                          [student.id]: false,
                                        })
                                      );

                                      setAttendance(
                                        (current) => ({
                                          ...current,
                                          [student.id]: {
                                            status:
                                              student.attendance_status ??
                                              "present",
                                            remarks:
                                              student.attendance_remarks ??
                                              "",
                                          },
                                        })
                                      );
                                    }}
                                    disabled={saving}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <X className="h-4 w-4" />
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditing(
                                      (current) => ({
                                        ...current,
                                        [student.id]: true,
                                      })
                                    )
                                  }
                                  disabled={saving}
                                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Edit3 className="h-4 w-4" />
                                  Edit
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
