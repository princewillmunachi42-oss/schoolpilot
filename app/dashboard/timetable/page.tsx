"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Period = {
  id: string;
  name: string;
  period_number: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
};

type ClassItem = {
  id: string;
  name: string;
  academic_session_id: string;
};

type Subject = {
  id: string;
  name: string;
  code: string;
};

type Staff = {
  id: string;
  staff_id: string;
  first_name: string;
  last_name: string;
};

type Entry = {
  id: string;
  period_id: string;
  class_id: string;
  subject_id: string;
  staff_id: string;
  day_of_week: number;
  room: string | null;
  is_active?: boolean;
  is_break?: boolean;
  period_name: string;
  period_number: number;
  start_time: string;
  end_time: string;
  class_name: string;
  subject_name: string;
  subject_code: string;
  teacher_staff_id: string;
  teacher_first_name: string;
  teacher_last_name: string;
};

const days = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

function getDayName(day: number) {
  return days.find((item) => item.value === day)?.label ?? "Unknown";
}

async function readJson(response: Response, label: string) {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(`${label} returned an empty response.`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `${label} returned an invalid response (${response.status}).`,
    );
  }
}

export default function TimetablePage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);

  const [periodId, setPeriodId] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [room, setRoom] = useState("");

  const [viewClassId, setViewClassId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        periodsResponse,
        classesResponse,
        subjectsResponse,
        staffResponse,
        entriesResponse,
      ] = await Promise.all([
        fetch("/api/school/timetable-periods", {
          cache: "no-store",
        }),
        fetch("/api/school/classes", {
          cache: "no-store",
        }),
        fetch("/api/school/subjects", {
          cache: "no-store",
        }),
        fetch("/api/school/staff", {
          cache: "no-store",
        }),
        fetch("/api/school/timetable-entries", {
          cache: "no-store",
        }),
      ]);

      const periodsData = await readJson(
        periodsResponse,
        "Timetable periods",
      );
      const classesData = await readJson(
        classesResponse,
        "Classes",
      );
      const subjectsData = await readJson(
        subjectsResponse,
        "Subjects",
      );
      const staffData = await readJson(
        staffResponse,
        "Staff",
      );
      const entriesData = await readJson(
        entriesResponse,
        "Timetable entries",
      );

      if (!periodsResponse.ok) {
        throw new Error(
          periodsData.error ||
            periodsData.message ||
            "Failed to load timetable periods.",
        );
      }

      if (!classesResponse.ok) {
        throw new Error(
          classesData.error ||
            classesData.message ||
            "Failed to load classes.",
        );
      }

      if (!subjectsResponse.ok) {
        throw new Error(
          subjectsData.error ||
            subjectsData.message ||
            "Failed to load subjects.",
        );
      }

      if (!staffResponse.ok) {
        throw new Error(
          staffData.error ||
            staffData.message ||
            "Failed to load staff.",
        );
      }

      if (!entriesResponse.ok) {
        throw new Error(
          entriesData.error ||
            entriesData.message ||
            "Failed to load timetable lessons.",
        );
      }

      const nextPeriods: Period[] =
        periodsData.periods ?? [];

      const nextClasses: ClassItem[] =
        classesData.classes ?? [];

      const nextSubjects: Subject[] =
        subjectsData.subjects ?? [];

      const nextStaff: Staff[] =
        staffData.staff ?? [];

      const nextEntries: Entry[] =
        entriesData.entries ?? [];

      setPeriods(nextPeriods);
      setClasses(nextClasses);
      setSubjects(nextSubjects);
      setStaff(nextStaff);
      setEntries(nextEntries);

      if (
        !classId &&
        nextClasses.length > 0
      ) {
        setClassId(nextClasses[0].id);
      }

      if (
        !viewClassId &&
        nextClasses.length > 0
      ) {
        setViewClassId("");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load timetable data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const visibleEntries = useMemo(() => {
    if (!viewClassId) {
      return entries;
    }

    return entries.filter(
      (entry) => entry.class_id === viewClassId,
    );
  }, [entries, viewClassId]);

  function getEntries(
    day: number,
    periodId: string,
  ) {
    return visibleEntries.filter(
      (entry) =>
        entry.day_of_week === day &&
        entry.period_id === periodId,
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch(
        "/api/school/timetable-entries",
        {
          method: editingEntryId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingEntryId || undefined,
            periodId,
            classId,
            subjectId,
            staffId,
            dayOfWeek: Number(dayOfWeek),
            room,
          }),
        },
      );

      const data = await readJson(
        response,
        "Timetable save",
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to save timetable lesson.",
        );
      }

      setEditingEntryId("");
      setMessage(
        editingEntryId
          ? "Timetable lesson updated successfully."
          : "Timetable lesson created successfully.",
      );

      setPeriodId("");
      setSubjectId("");
      setStaffId("");
      setRoom("");

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save timetable lesson.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(entry: Entry) {
    setEditingEntryId(entry.id);
    setPeriodId(entry.period_id);
    setClassId(entry.class_id);
    setSubjectId(entry.subject_id);
    setStaffId(entry.staff_id);
    setDayOfWeek(String(entry.day_of_week));
    setRoom(entry.room ?? "");

    setMessage(
      "Editing timetable lesson...",
    );
    setError("");
  }

  function cancelEdit() {
    setEditingEntryId("");
    setPeriodId("");
    setSubjectId("");
    setStaffId("");
    setRoom("");
    setDayOfWeek("1");
    setMessage("");
    setError("");
  }

  async function handleDelete(id: string) {
    if (
      !window.confirm(
        "Are you sure you want to delete this timetable lesson?",
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch(
        "/api/school/timetable-entries",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        },
      );

      const data = await readJson(
        response,
        "Timetable delete",
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to delete timetable lesson.",
        );
      }

      if (editingEntryId === id) {
        cancelEdit();
      }

      setMessage(
        "Timetable lesson deleted successfully.",
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete timetable lesson.",
      );
    } finally {
      setSaving(false);
    }
  }

  const sortedPeriods = [...periods].sort(
    (a, b) => a.period_number - b.period_number,
  );
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2">
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Dashboard
              </Link>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Timetable
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Configure lessons and view the weekly class timetable.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Loading timetable...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
              <section className="rounded-xl border border-border bg-card p-5">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">
                    Add Lesson
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Assign a teacher, subject, class and period.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  


                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Day
                    </label>

                    <select
                      value={dayOfWeek}
                      onChange={(event) =>
                        setDayOfWeek(event.target.value)
                      }
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                    >
                      {days.map((day) => (
                        <option
                          key={day.value}
                          value={day.value}
                        >
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Period
                    </label>

                    <select
                      value={periodId}
                      onChange={(event) =>
                        setPeriodId(event.target.value)
                      }
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                    >
                      <option value="">Select period</option>

                      {sortedPeriods.map((period) => (
                        <option
                          key={period.id}
                          value={period.id}
                        >
                          {period.period_number}. {period.name} (
                          {period.start_time.slice(0, 5)}–
                          {period.end_time.slice(0, 5)})
                          {period.is_break ? " — BREAK" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Class
                    </label>

                    <select
                      value={classId}
                      onChange={(event) =>
                        setClassId(event.target.value)
                      }
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                    >
                      <option value="">Select class</option>

                {classes.map((item) => (
  <option key={item.id} value={item.id}>
    {item.name}
  </option>
))}
</select>
</div>

<div>
  <label className="mb-1.5 block text-sm font-medium">
    Subject
  </label>
                    <select
                      value={subjectId}
                      onChange={(event) =>
                        setSubjectId(event.target.value)
                      }
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                    >
                      <option value="">Select subject</option>

                      {subjects.map((subject) => (
                        <option
                          key={subject.id}
                          value={subject.id}
                        >
                          {subject.name} ({subject.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Teacher
                    </label>

                    <select
                      value={staffId}
                      onChange={(event) =>
                        setStaffId(event.target.value)
                      }
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                    >
                      <option value="">Select teacher</option>

                      {staff.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.first_name} {person.last_name} (
                          {person.staff_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Room{" "}
                      <span className="text-muted-foreground">
                        (optional)
                      </span>
                    </label>

                    <input
                      value={room}
                      onChange={(event) =>
                        setRoom(event.target.value)
                      }
                      placeholder="e.g. Room 12"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  </div>

                  {message ? (
                    <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2.5 text-sm text-green-700 dark:text-green-400">
                      {message}
                    </div>
                  ) : null}

                  {error ? (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-700 dark:text-red-400">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Adding Lesson..." : "Add Lesson"}
                  </button>
                </form>
              </section>

              <section className="min-w-0 rounded-xl border border-border bg-card p-5">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">
                    Weekly Timetable
                  </h2>

<p className="mt-1 text-sm text-muted-foreground">
  Select a class to view its weekly schedule.
</p>
                </div>


                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Class
                    </label>
                    <select
                      value={viewClassId}
                      onChange={(event) =>
                        setViewClassId(event.target.value)
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="">All classes</option>
                      {classes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                   {viewClassId ? (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full min-w-[1050px] border-collapse text-sm">
                      <thead>
                        <tr className="bg-muted/40">
                          <th className="sticky left-0 z-10 w-32 border-b border-r border-border bg-muted/80 p-3 text-left font-semibold">
                            Period
                          </th>

                          {days.map((day) => (
                            <th
                              key={day.value}
                              className="min-w-[130px] border-b border-border p-3 text-left font-semibold"
                            >
                              {day.label}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {sortedPeriods.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="p-8 text-center text-muted-foreground"
                            >
                              No timetable periods have been configured yet.
                            </td>
                          </tr>
                        ) : (
                          sortedPeriods.map((period) => (
                            <tr key={period.id}>
                              <td className="sticky left-0 z-10 border-r border-b border-border bg-card p-3 align-top">
                                <div className="font-medium">
                                  {period.period_number}. {period.name}
                                </div>

                                <div className="mt-1 text-xs text-muted-foreground">
                                  {period.start_time.slice(0, 5)}–
                                  {period.end_time.slice(0, 5)}
                                </div>
                              </td>

                              {days.map((day) => {
                                const entry = getEntries(
                                  day.value,
                                  period.id,
                                )[0];

                                if (period.is_break) {
                                  return (
                                    <td
                                      key={day.value}
                                      className="border-b border-border bg-muted/20 p-3 align-top"
                                    >
                                      <div className="rounded-lg border border-dashed border-border p-3 text-center text-xs font-medium text-muted-foreground">
                                        BREAK
                                      </div>
                                    </td>
                                  );
                                }

                                return (
                                  <td
                                    key={day.value}
                                    className="border-b border-border p-2 align-top"
                                  >
                                    {entry ? (
                                      <div className="min-h-[92px] rounded-lg border border-border bg-muted/30 p-3">
                                        <div className="font-semibold">
                                          {entry.subject_name}
                                        </div>

                                        <div className="mt-0.5 text-xs text-muted-foreground">
                                          {entry.subject_code}
                                        </div>

                                        <div className="mt-3 text-xs">
                                          <span className="font-medium">
                                            {entry.teacher_first_name}{" "}
                                            {entry.teacher_last_name}
                                          </span>
                                        </div>

                                        {entry.room ? (
                                          <div className="mt-1 text-xs text-muted-foreground">
                                            Room: {entry.room}
                                          </div>
                                        ) : null}
                                      </div>
                                    ) : (
                                      <div className="flex min-h-[92px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                                        —
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    {visibleEntries.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">
No timetable lessons have been configured yet.                      </div>
                    ) : (
                      <table className="w-full min-w-[950px] border-collapse text-sm">
                        <thead>
                          <tr className="bg-muted/40">
                            <th className="border-b border-border p-3 text-left font-semibold">
                              Class
                            </th>
                            <th className="border-b border-border p-3 text-left font-semibold">
                              Day
                            </th>
                            <th className="border-b border-border p-3 text-left font-semibold">
                              Time
                            </th>
                            <th className="border-b border-border p-3 text-left font-semibold">
                              Subject
                            </th>
                            <th className="border-b border-border p-3 text-left font-semibold">
                              Teacher
                            </th>
                            <th className="border-b border-border p-3 text-left font-semibold">
                              Room
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {[...visibleEntries]
                            .sort((a, b) => {
                              const classCompare =
                                a.class_name.localeCompare(b.class_name);

                              if (classCompare !== 0) {
                                return classCompare;
                              }

                              if (a.day_of_week !== b.day_of_week) {
                                return a.day_of_week - b.day_of_week;
                              }

                              return a.period_number - b.period_number;
                            })
                            .map((entry) => (
                              <tr
                                key={entry.id}
                                className="border-b border-border last:border-b-0"
                              >
                                <td className="p-3 font-medium">
                                  {entry.class_name}
                                </td>

                                <td className="p-3">
                                  {getDayName(entry.day_of_week)}
                                </td>

                                <td className="p-3 whitespace-nowrap">
                                  {entry.start_time.slice(0, 5)}–
                                  {entry.end_time.slice(0, 5)}
                                </td>

                                <td className="p-3">
                                  <div className="font-medium">
                                    {entry.subject_name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {entry.subject_code}
                                  </div>
                                </td>

                                <td className="p-3">
                                  {entry.teacher_first_name}{" "}
                                  {entry.teacher_last_name}
                                </td>

                                <td className="p-3">
                                  {entry.room || "—"}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    Showing {visibleEntries.length} configured lesson
                    {visibleEntries.length === 1 ? "" : "s"}.
                  </span>

                  {viewClassId ? (
                    <span>
                      Class:{" "}
                      <strong className="font-medium text-foreground">
                        {classes.find(
                          (item) => item.id === viewClassId,
                        )?.name ?? "Unknown"}
                      </strong>
                    </span>
                  ) : null}


                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-5">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">
                    Configured Lessons
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Every timetable lesson stored for this school.
                  </p>
                </div>

                {entries.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No lessons configured yet.
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-lg border border-border p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">
                              {entry.subject_name}
                            </div>

                            <div className="text-xs text-muted-foreground">
                              {entry.subject_code}
                            </div>
                          </div>

                          <div className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                            {getDayName(entry.day_of_week)}
                          </div>
                        </div>

                        <div className="mt-4 space-y-1.5 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Class:
                            </span>{" "}
                            {entry.class_name}
                          </div>

                          <div>
                            <span className="text-muted-foreground">
                              Teacher:
                            </span>{" "}
                            {entry.teacher_first_name}{" "}
                            {entry.teacher_last_name}
                          </div>

                          <div>
                            <span className="text-muted-foreground">
                              Period:
                            </span>{" "}
                            {entry.period_name} ·{" "}
                            {entry.start_time.slice(0, 5)}–
                            {entry.end_time.slice(0, 5)}
                          </div>


                          {entry.room ? (
                            <div>
                              <span className="text-muted-foreground">
                                Room:
                              </span>{" "}
                              {entry.room}
                            </div>
                          ) : null}
                         </div>
                        <div className="mt-4 flex gap-2">
  <button
    type="button"
    onClick={() => handleEdit(entry)}
    className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
  >
    Edit
  </button>

  <button
    type="button"
    onClick={() => handleDelete(entry.id)}
    className="rounded-md border border-destructive px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
  >
    Delete
  </button>
</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
