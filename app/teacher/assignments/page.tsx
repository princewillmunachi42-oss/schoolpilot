"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Edit3,
  FileText,
  GraduationCap,
  Plus,
  Save,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";

type TeachingOption = {
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  subject_code: string | null;
};

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: "draft" | "published";
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  created_at: string;
  updated_at: string;
};

type FormState = {
  class_id: string;
  subject_id: string;
  title: string;
  description: string;
  due_date: string;
  status: "draft" | "published";
};

const emptyForm: FormState = {
  class_id: "",
  subject_id: "",
  title: "",
  description: "",
  due_date: "",
  status: "draft",
};

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [options, setOptions] = useState<TeachingOption[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [assignmentsResponse, optionsResponse] =
        await Promise.all([
          fetch("/api/teacher/assignments", {
            cache: "no-store",
          }),
          fetch("/api/teacher/assignments/options", {
            cache: "no-store",
          }),
        ]);

      const assignmentsData =
        await assignmentsResponse.json();
      const optionsData = await optionsResponse.json();

      if (!assignmentsResponse.ok) {
        throw new Error(
          assignmentsData.error ||
            "Unable to load assignments."
        );
      }

      if (!optionsResponse.ok) {
        throw new Error(
          optionsData.error ||
            "Unable to load teaching assignments."
        );
      }

      setAssignments(assignmentsData.assignments ?? []);
      setOptions(optionsData.options ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load assignments."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(assignment: Assignment) {
    setEditingId(assignment.id);

    setForm({
      class_id: assignment.class_id,
      subject_id: assignment.subject_id,
      title: assignment.title,
      description: assignment.description ?? "",
      due_date: assignment.due_date ?? "",
      status: assignment.status,
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/teacher/assignments",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...(editingId ? { id: editingId } : {}),
            class_id: form.class_id,
            subject_id: form.subject_id,
            title: form.title.trim(),
            description: form.description.trim(),
            due_date: form.due_date || null,
            status: form.status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Unable to ${
              editingId ? "update" : "create"
            } assignment.`
        );
      }

      setSuccess(
        editingId
          ? "Assignment updated successfully."
          : "Assignment created successfully."
      );

      resetForm();
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save assignment."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this assignment?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/teacher/assignments?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to delete assignment."
        );
      }

      setSuccess("Assignment deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete assignment."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const subjectsForClass = options.filter(
    (option) => option.class_id === form.class_id
  );

  const hasTeachingOptions = options.length > 0;

  const uniqueClasses = Array.from(
    new Map(
      options.map((option) => [
        option.class_id,
        option.class_name,
      ])
    ).entries()
  );

  const publishedCount = assignments.filter(
    (assignment) => assignment.status === "published"
  ).length;

  const draftCount = assignments.filter(
    (assignment) => assignment.status === "draft"
  ).length;

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
                <ClipboardList className="h-3.5 w-3.5" />
                Teaching workspace
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Assignments
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Create and manage assignments for the classes
                and subjects you teach.
              </p>
            </div>

            {!loading && (
              <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Total assignments
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {assignments.length}
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

        {!loading && hasTeachingOptions && (
          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  All assignments
                </span>
              </div>

              <p className="mt-4 text-2xl font-bold">
                {assignments.length}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Created by you
              </p>
            </div>

            <div className="rounded-2xl border border-success/20 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                  <Send className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Published
                </span>
              </div>

              <p className="mt-4 text-2xl font-bold">
                {publishedCount}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Visible to students
              </p>
            </div>

            <div className="rounded-2xl border border-warning/20 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <Edit3 className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Drafts
                </span>
              </div>

              <p className="mt-4 text-2xl font-bold">
                {draftCount}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Still being prepared
              </p>
            </div>
          </section>
        )}

        {hasTeachingOptions && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {editingId ? (
                      <Edit3 className="h-5 w-5" />
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">
                      {editingId
                        ? "Edit Assignment"
                        : "Create Assignment"}
                    </h2>

                    <p className="text-sm text-muted-foreground">
                      {editingId
                        ? "Update the assignment details below."
                        : "Create an assignment for a class and subject you teach."}
                    </p>
                  </div>
                </div>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-5 sm:p-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="assignment-class"
                    className="mb-2 block text-sm font-medium"
                  >
                    Class
                  </label>

                  <select
                    id="assignment-class"
                    value={form.class_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        class_id: event.target.value,
                        subject_id: "",
                      }))
                    }
                    required
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
                  >
                    <option value="" disabled>
                      Select class
                    </option>

                    {uniqueClasses.map(
                      ([classId, className]) => (
                        <option
                          key={classId}
                          value={classId}
                        >
                          {className}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="assignment-subject"
                    className="mb-2 block text-sm font-medium"
                  >
                    Subject
                  </label>

                  <select
                    id="assignment-subject"
                    value={form.subject_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        subject_id: event.target.value,
                      }))
                    }
                    required
                    disabled={!form.class_id}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="" disabled>
                      {form.class_id
                        ? "Select subject"
                        : "Select class first"}
                    </option>

                    {subjectsForClass.map((option) => (
                      <option
                        key={`${option.class_id}-${option.subject_id}`}
                        value={option.subject_id}
                      >
                        {option.subject_name}
                        {option.subject_code
                          ? ` — ${option.subject_code}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="assignment-title"
                  className="mb-2 block text-sm font-medium"
                >
                  Title
                </label>

                <input
                  id="assignment-title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  maxLength={200}
                  required
                  placeholder="e.g. Algebra Practice"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label
                  htmlFor="assignment-description"
                  className="mb-2 block text-sm font-medium"
                >
                  Instructions
                </label>

                <textarea
                  id="assignment-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="Enter the instructions students should follow."
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="assignment-due-date"
                    className="mb-2 block text-sm font-medium"
                  >
                    Due date
                  </label>

                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                      id="assignment-due-date"
                      type="date"
                      value={form.due_date}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          due_date: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="assignment-status"
                    className="mb-2 block text-sm font-medium"
                  >
                    Status
                  </label>

                  <select
                    id="assignment-status"
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as
                          | "draft"
                          | "published",
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">
                      Published
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {editingId
                        ? "Updating..."
                        : "Creating..."}
                    </>
                  ) : (
                    <>
                      {editingId ? (
                        <Save className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {editingId
                        ? "Update Assignment"
                        : "Create Assignment"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {!loading && !hasTeachingOptions && (
          <section className="mb-8 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              No Teaching Assignments Yet
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              You currently have no subject-and-class
              teaching assignments. Ask your school owner or
              administrator to assign you to a class and
              subject before creating assignments.
            </p>

            <Link
              href="/teacher"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Link>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ClipboardList className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    My Assignments
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Assignments you have created.
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-sm font-semibold">
                {assignments.length}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 p-5 sm:p-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-2xl bg-muted"
                />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <FileText className="h-7 w-7" />
              </div>

              <p className="mt-4 font-semibold">
                No assignments yet
              </p>

              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                {hasTeachingOptions
                  ? "Create your first assignment above."
                  : "Your assignments will appear here once you create them."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {assignments.map((assignment) => (
                <article
                  key={assignment.id}
                  className="p-5 transition-colors hover:bg-muted/20 sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {assignment.title}
                        </h3>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            assignment.status ===
                            "published"
                              ? "border-success/20 bg-success/10 text-success"
                              : "border-warning/20 bg-warning/10 text-warning"
                          }`}
                        >
                          {assignment.status ===
                          "published"
                            ? "Published"
                            : "Draft"}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <BookOpen className="h-4 w-4 text-primary" />
                          {assignment.subject_name}
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <GraduationCap className="h-4 w-4" />
                          {assignment.class_name}
                        </span>
                      </div>

                      {assignment.description && (
                        <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                          {assignment.description}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Due:{" "}
                          {assignment.due_date
                            ? assignment.due_date.slice(
                                0,
                                10
                              )
                            : "No due date"}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          startEdit(assignment)
                        }
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(assignment.id)
                        }
                        disabled={
                          deletingId === assignment.id
                        }
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-destructive/20 px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingId === assignment.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
