"use client";

import { FormEvent, useEffect, useState } from "react";

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
      const [assignmentsResponse, optionsResponse] = await Promise.all([
        fetch("/api/teacher/assignments", { cache: "no-store" }),
        fetch("/api/teacher/assignments/options", { cache: "no-store" }),
      ]);

      const assignmentsData = await assignmentsResponse.json();
      const optionsData = await optionsResponse.json();

      if (!assignmentsResponse.ok) {
        throw new Error(
          assignmentsData.error || "Unable to load assignments."
        );
      }

      if (!optionsResponse.ok) {
        throw new Error(
          optionsData.error || "Unable to load teaching assignments."
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/teacher/assignments", {
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
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Unable to ${editingId ? "update" : "create"} assignment.`
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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <a
          href="/teacher"
          className="text-sm font-medium text-primary hover:text-primary-hover"
        >
          ← Back to Teacher Dashboard
        </a>

        <div className="mt-3 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Assignments
          </h1>

          <p className="mt-2 text-muted-foreground">
            Create and manage assignments for the classes and subjects
            you teach.
          </p>
        </div>

        {error && (
          <div
            className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400"
            role="status"
          >
            {success}
          </div>
        )}

        {hasTeachingOptions && (
          <section className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingId ? "Edit Assignment" : "Create Assignment"}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {editingId
                    ? "Update the assignment details below."
                    : "Create an assignment for a class and subject you teach."}
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="min-h-10 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
                    className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                  >
                    <option value="" disabled>
                      Select class
                    </option>

                    {Array.from(
                      new Map(
                        options.map((option) => [
                          option.class_id,
                          option.class_name,
                        ])
                      )
                    ).map(([classId, className]) => (
                      <option key={classId} value={classId}>
                        {className}
                      </option>
                    ))}
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
                    className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
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
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="assignment-due-date"
                    className="mb-2 block text-sm font-medium"
                  >
                    Due Date
                  </label>

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
                    className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                  />
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
                    className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="min-h-10 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? editingId
                    ? "Updating..."
                    : "Creating..."
                  : editingId
                    ? "Update Assignment"
                    : "Create Assignment"}
              </button>
            </form>
          </section>
        )}

        {!loading && !hasTeachingOptions && (
          <section className="mb-8 rounded-2xl border bg-card p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold">
              No Teaching Assignments Yet
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              You currently have no subject-and-class teaching assignments.
              Ask your school owner or administrator to assign you to a
              class and subject before creating assignments.
            </p>
          </section>
        )}

        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                My Assignments
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Assignments you have created.
              </p>
            </div>

            <span className="rounded-full border px-3 py-1 text-sm font-medium">
              {assignments.length}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading assignments...
            </div>
          ) : assignments.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-medium">No assignments yet.</p>

              <p className="mt-1 text-sm text-muted-foreground">
                {hasTeachingOptions
                  ? "Create your first assignment above."
                  : "Your assignments will appear here once you create them."}
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {assignments.map((assignment) => (
                <article
                  key={assignment.id}
                  className="rounded-xl border p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {assignment.title}
                        </h3>

                        <span className="rounded-full border px-2.5 py-1 text-xs font-semibold capitalize">
                          {assignment.status}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-medium">
                        {assignment.subject_name} ·{" "}
                        {assignment.class_name}
                      </p>

                      {assignment.description && (
                        <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                          {assignment.description}
                        </p>
                      )}

                      <p className="mt-3 text-sm text-muted-foreground">
                        Due:{" "}
                       {assignment.due_date
  ? assignment.due_date.slice(0, 10)
  : "No due date"}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(assignment)}
                        className="min-h-10 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(assignment.id)
                        }
                        disabled={deletingId === assignment.id}
                        className="min-h-10 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
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
