"use client";

import { FormEvent, useEffect, useState } from "react";

type SubjectData = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: "active" | "inactive";
};

export default function EditSubjectPage() {
  const [id, setId] = useState<string | null>(null);
  const [subject, setSubject] = useState<SubjectData | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] =
    useState<"active" | "inactive">("active");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subjectId = params.get("id");

    if (!subjectId) {
      setMessage("Subject ID is missing.");
      setLoading(false);
      return;
    }

    setId(subjectId);

    async function loadSubject() {
      try {
        const response = await fetch(
          `/api/school/subjects/${encodeURIComponent(subjectId ?? "")}`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Unable to load subject."
          );
        }

        const loadedSubject = result.subject as SubjectData;

        setSubject(loadedSubject);
        setName(loadedSubject.name);
        setCode(loadedSubject.code);
        setDescription(loadedSubject.description ?? "");
        setStatus(loadedSubject.status);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load subject."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSubject();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!id) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/school/subjects", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          name,
          code,
          description,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to update subject."
        );
      }

      window.location.href = "/dashboard/subjects";
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update subject."
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-muted-foreground">
          Loading subject...
        </p>
      </main>
    );
  }

  if (!subject) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <a
          href="/dashboard/subjects"
          className="text-sm font-semibold underline"
        >
          ← Back to Subjects
        </a>

        <div className="mt-6 rounded-2xl border p-6">
          <p className="text-sm text-destructive">
            {message || "Subject not found."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <a
          href="/dashboard/subjects"
          className="text-sm font-semibold underline"
        >
          ← Back to Subjects
        </a>

        <h1 className="mt-4 text-2xl font-bold">
          Edit Subject
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Update this subject's information.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border bg-card p-6 shadow-sm"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold"
            >
              Subject Name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-lg border bg-background px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="code"
              className="mb-2 block text-sm font-semibold"
            >
              Subject Code
            </label>

            <input
              id="code"
              type="text"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.toUpperCase())
              }
              required
              className="w-full rounded-lg border bg-background px-3 py-2 uppercase"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-semibold"
            >
              Description
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={4}
              className="w-full rounded-lg border bg-background px-3 py-2"
              placeholder="Optional subject description"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-semibold"
            >
              Status
            </label>

            <select
              id="status"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as "active" | "inactive"
                )
              }
              className="w-full rounded-lg border bg-background px-3 py-2"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {message && (
            <p className="text-sm text-destructive">
              {message}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <a
              href="/dashboard/subjects"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Cancel
            </a>
          </div>
        </div>
      </form>
    </main>
  );
}
