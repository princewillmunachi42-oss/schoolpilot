"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookMarked,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MapPin,
  Pencil,
  Plus,
  Save,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

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
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 7, label: "Sunday", short: "Sun" },
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
        fetch("/api/school/timetable-periods", { cache: "no-store" }),
        fetch("/api/school/classes", { cache: "no-store" }),
        fetch("/api/school/subjects", { cache: "no-store" }),
        fetch("/api/school/staff", { cache: "no-store" }),
        fetch("/api/school/timetable-entries", { cache: "no-store" }),
      ]);

      const periodsData = await readJson(periodsResponse, "Timetable periods");
      const classesData = await readJson(classesResponse, "Classes");
      const subjectsData = await readJson(subjectsResponse, "Subjects");
      const staffData = await readJson(staffResponse, "Staff");
      const entriesData = await readJson(entriesResponse, "Timetable entries");

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
          staffData.error || staffData.message || "Failed to load staff.",
        );
      }

      if (!entriesResponse.ok) {
        throw new Error(
          entriesData.error ||
            entriesData.message ||
            "Failed to load timetable lessons.",
        );
      }

      const nextPeriods: Period[] = periodsData.periods ?? [];
      const nextClasses: ClassItem[] = classesData.classes ?? [];
      const nextSubjects: Subject[] = subjectsData.subjects ?? [];
      const nextStaff: Staff[] = staffData.staff ?? [];
      const nextEntries: Entry[] = entriesData.entries ?? [];

      setPeriods(nextPeriods);
      setClasses(nextClasses);
      setSubjects(nextSubjects);
      setStaff(nextStaff);
      setEntries(nextEntries);

      if (!classId && nextClasses.length > 0) {
        setClassId(nextClasses[0].id);
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

    return entries.filter((entry) => entry.class_id === viewClassId);
  }, [entries, viewClassId]);

  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => a.period_number - b.period_number),
    [periods],
  );

  const currentViewClass = classes.find(
    (item) => item.id === viewClassId,
  );

  function getEntries(day: number, currentPeriodId: string) {
    return visibleEntries.filter(
      (entry) =>
        entry.day_of_week === day && entry.period_id === currentPeriodId,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/school/timetable-entries", {
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
      });

      const data = await readJson(response, "Timetable save");

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
    setMessage("Editing timetable lesson...");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
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

      const response = await fetch("/api/school/timetable-entries", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await readJson(response, "Timetable delete");

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

      setMessage("Timetable lesson deleted successfully.");
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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-primary">
                <CalendarDays className="h-4 w-4" />
                Academic Management
              </div>

              <h1 className="text-3xl font-bold tracking-tight">
                Timetable
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Build and manage your school&apos;s weekly lesson schedule,
                assign teachers and subjects, and keep every class organized.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Scheduled lessons
                </p>
                <p className="text-lg font-bold">
                  {entries.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <p className="text-sm font-medium">
              Loading timetable...
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Fetching your school schedule and available resources.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Periods
                  </span>
                </div>
                <p className="mt-5 text-2xl font-bold">
                  {periods.length}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configured timetable periods
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Classes
                  </span>
                </div>
                <p className="mt-5 text-2xl font-bold">
                  {classes.length}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Classes available for scheduling
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <BookMarked className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Subjects
                  </span>
                </div>
                <p className="mt-5 text-2xl font-bold">
                  {subjects.length}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Subjects ready to assign
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Teachers
                  </span>
                </div>
                <p className="mt-5 text-2xl font-bold">
                  {staff.length}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Staff available for lessons
                </p>
              </div>
            </div>

            {(message || error) && (
              <div
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
                  error
                    ? "border-destructive/20 bg-destructive/5 text-destructive"
                    : "border-success/20 bg-success/5 text-success"
                }`}
              >
                {error ? (
                  <X className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{error || message}</span>
              </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
              <section className="rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {editingEntryId ? (
                        <Pencil className="h-5 w-5" />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <h2 className="font-semibold">
                        {editingEntryId
                          ? "Edit Timetable Lesson"
                          : "Add Timetable Lesson"}
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Assign a class, subject, teacher and period to a day.
                      </p>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 p-5 sm:p-6"
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
                      className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      {days.map((day) => (
                        <option key={day.value} value={day.value}>
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
                      className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select period</option>
                      {sortedPeriods.map((period) => (
                        <option key={period.id} value={period.id}>
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
                      className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                      className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
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
                      className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={room}
                        onChange={(event) =>
                          setRoom(event.target.value)
                        }
                        placeholder="e.g. Room 12"
                        className="min-h-11 w-full rounded-xl border bg-background py-2.5 pl-10 pr-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                      ) : editingEntryId ? (
                        <Save className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {saving
                        ? "Saving..."
                        : editingEntryId
                          ? "Save Changes"
                          : "Add Lesson"}
                    </button>

                    {editingEntryId ? (
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={saving}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </form>
              </section>

              <section className="min-w-0 rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-semibold">
                          Weekly Timetable
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Select a class to view its weekly schedule.
                        </p>
                      </div>
                    </div>

                    <div className="w-full lg:w-64">
                      <label className="sr-only">View class timetable</label>
                      <select
                        value={viewClassId}
                        onChange={(event) =>
                          setViewClassId(event.target.value)
                        }
                        className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">All classes</option>
                        {classes.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {viewClassId ? (
                  <div className="p-4 sm:p-6">
                    {sortedPeriods.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border p-10 text-center">
                        <Clock3 className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-3 text-sm font-medium">
                          No timetable periods configured
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Configure timetable periods before adding lessons.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-border">
                        <table className="w-full min-w-[1100px] border-collapse text-sm">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="sticky left-0 z-10 w-36 border-b border-r border-border bg-muted/90 p-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Period
                              </th>
                              {days.map((day) => (
                                <th
                                  key={day.value}
                                  className="min-w-[140px] border-b border-border p-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                >
                                  <span className="hidden sm:inline">
                                    {day.label}
                                  </span>
                                  <span className="sm:hidden">
                                    {day.short}
                                  </span>
                                </th>
                              ))}
                            </tr>
                          </thead>

                          <tbody>
                            {sortedPeriods.map((period) => (
                              <tr key={period.id}>
                                <td className="sticky left-0 z-10 border-b border-r border-border bg-card p-3 align-top">
                                  <div className="font-semibold">
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
                                        className="border-b border-border bg-amber-500/5 p-2 align-top"
                                      >
                                        <div className="flex min-h-[96px] items-center justify-center rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 text-xs font-semibold text-amber-600 dark:text-amber-400">
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
                                        <button
                                          type="button"
                                          onClick={() => handleEdit(entry)}
                                          className="group min-h-[96px] w-full rounded-xl border border-border bg-muted/30 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
                                        >
                                          <div className="font-semibold leading-5 group-hover:text-primary">
                                            {entry.subject_name}
                                          </div>
                                          <div className="mt-1 text-xs text-muted-foreground">
                                            {entry.subject_code}
                                          </div>
                                          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
                                            <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="truncate">
                                              {entry.teacher_first_name}{" "}
                                              {entry.teacher_last_name}
                                            </span>
                                          </div>
                                          {entry.room ? (
                                            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                              <MapPin className="h-3 w-3" />
                                              <span className="truncate">
                                                {entry.room}
                                              </span>
                                            </div>
                                          ) : null}
                                        </button>
                                      ) : (
                                        <div className="flex min-h-[96px] items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                                          No lesson
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        Showing{" "}
                        <strong className="font-semibold text-foreground">
                          {visibleEntries.length}
                        </strong>{" "}
                        configured lesson
                        {visibleEntries.length === 1 ? "" : "s"}.
                      </span>
                      <span>
                        Class:{" "}
                        <strong className="font-semibold text-foreground">
                          {currentViewClass?.name ?? "Unknown"}
                        </strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 sm:p-6">
                    {visibleEntries.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border p-10 text-center">
                        <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-3 text-sm font-medium">
                          No timetable lessons yet
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Add your first lesson using the form beside this
                          timetable.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-border">
                        <table className="w-full min-w-[950px] border-collapse text-sm">
                          <thead>
                            <tr className="bg-muted/50">
                              {[
                                "Class",
                                "Day",
                                "Time",
                                "Subject",
                                "Teacher",
                                "Room",
                              ].map((heading) => (
                                <th
                                  key={heading}
                                  className="border-b border-border p-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                >
                                  {heading}
                                </th>
                              ))}
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
                                  className="border-b border-border last:border-b-0 hover:bg-muted/20"
                                >
                                  <td className="p-3 font-semibold">
                                    {entry.class_name}
                                  </td>
                                  <td className="p-3">
                                    {getDayName(entry.day_of_week)}
                                  </td>
                                  <td className="whitespace-nowrap p-3 text-muted-foreground">
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
                                  <td className="p-3 text-muted-foreground">
                                    {entry.room || "—"}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {visibleEntries.length > 0 ? (
                      <p className="mt-4 text-xs text-muted-foreground">
                        Showing{" "}
                        <strong className="font-semibold text-foreground">
                          {visibleEntries.length}
                        </strong>{" "}
                        configured lesson
                        {visibleEntries.length === 1 ? "" : "s"} across all
                        classes.
                      </p>
                    ) : null}
                  </div>
                )}
              </section>
            </div>

            <section className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold">
                      Configured Lessons
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Review, edit or remove every lesson currently stored for
                      your school.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {entries.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-10 text-center">
                    <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium">
                      No lessons configured yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Lessons you create will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-2xl border border-border bg-background p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold">
                              {entry.subject_name}
                            </h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {entry.subject_code}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                            {getDayName(entry.day_of_week)}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Class
                              </span>
                              <p className="font-medium">
                                {entry.class_name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Teacher
                              </span>
                              <p className="font-medium">
                                {entry.teacher_first_name}{" "}
                                {entry.teacher_last_name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Period
                              </span>
                              <p className="font-medium">
                                {entry.period_name} ·{" "}
                                {entry.start_time.slice(0, 5)}–
                                {entry.end_time.slice(0, 5)}
                              </p>
                            </div>
                          </div>

                          {entry.room ? (
                            <div className="flex items-start gap-2">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                              <div>
                                <span className="text-xs text-muted-foreground">
                                  Room
                                </span>
                                <p className="font-medium">
                                  {entry.room}
                                </p>
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-5 flex gap-2 border-t border-border pt-4">
                          <button
                            type="button"
                            onClick={() => handleEdit(entry)}
                            disabled={saving}
                            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-50"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            disabled={saving}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
