"use client";

import { useEffect, useState } from "react";

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

      const nextAttendance: Record<string, StudentAttendance> = {};

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
      setError("Current academic session and term are required.");
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
                  data.attendance?.id ?? item.attendance_id,
                attendance_date:
                  data.attendance?.attendance_date ??
                  item.attendance_date ??
                  attendanceDate,
                attendance_status:
                  data.attendance?.status ?? record.status,
                attendance_remarks:
                  data.attendance?.remarks ?? record.remarks,
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
      setError("Current academic session and term are required.");
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
        const response = await fetch("/api/teacher/attendance", {
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
        });

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

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-muted-foreground">
            Loading attendance...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <a
          href="/teacher"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to Teacher Dashboard
        </a>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Attendance
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Mark and manage attendance for students in your assigned
            classes.
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

        {!session || !term ? (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">
              Attendance setup required
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your school must configure a current academic session and
              current term before attendance can be recorded.
            </p>
          </div>
        ) : classes.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">
              No classes assigned
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You do not currently have any classes assigned to you.
            </p>
          </div>
        ) : (
          <>
            <section className="mb-6 rounded-2xl border border-border bg-card p-5">
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
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
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
                    Attendance Date
                  </label>
                  <input
                    id="attendance-date"
                    type="date"
                    value={attendanceDate}
                    onChange={(event) =>
                      setAttendanceDate(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Academic Period
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

            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Student Attendance
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {students.length} student
                    {students.length === 1 ? "" : "s"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={saveAll}
                  disabled={
                    saving ||
                    studentsLoading ||
                    students.length === 0
                  }
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save All Attendance"}
                </button>
              </div>

              {studentsLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Loading students...
                </div>
              ) : students.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="font-medium">
                    No active students found.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This class currently has no active students.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {students.map((student) => {
                    const record = attendance[student.id] ?? {
                      status: "present" as AttendanceStatus,
                      remarks: "",
                    };
                    const hasSavedAttendance = Boolean(student.attendance_id);
                    const isEditing = Boolean(editing[student.id]);

                    return (
                      <div key={student.id} className="p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <p className="font-semibold">
                              {studentName(student)}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Admission No: {student.admission_number || "Not assigned"}
                            </p>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 lg:w-[520px]">
                            <div>
                              <label
                                htmlFor={`status-${student.id}`}
                                className="mb-1.5 block text-xs font-medium text-muted-foreground"
                              >
                                Status
                              </label>
                              <select
                                id={`status-${student.id}`}
                                value={record.status}
                                disabled={hasSavedAttendance && !isEditing}
                                onChange={(event) =>
                                  updateStudentAttendance(
                                    student.id,
                                    "status",
                                    event.target.value
                                  )
                                }
                                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="late">Late</option>
                                <option value="excused">Excused</option>
                              </select>
                            </div>

                            <div>
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
                                disabled={hasSavedAttendance && !isEditing}
                                onChange={(event) =>
                                  updateStudentAttendance(
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

                          <div className="flex flex-wrap gap-2">
                            {!hasSavedAttendance ? (
                              <button
                                type="button"
                                onClick={() => saveStudent(student)}
                                disabled={saving}
                                className="h-10 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Save
                              </button>
                            ) : isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => saveStudent(student)}
                                  disabled={saving}
                                  className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {saving ? "Updating..." : "Update"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditing((current) => ({
                                      ...current,
                                      [student.id]: false,
                                    }));
                                    setAttendance((current) => ({
                                      ...current,
                                      [student.id]: {
                                        status: student.attendance_status ?? "present",
                                        remarks: student.attendance_remarks ?? "",
                                      },
                                    }));
                                  }}
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
                                disabled={saving}
                                className="h-10 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
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
          </>
        )}
      </div>
    </main>
  );
}
