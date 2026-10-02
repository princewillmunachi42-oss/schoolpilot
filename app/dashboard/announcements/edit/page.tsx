"use client";

import { FormEvent, useEffect, useState } from "react";
import SignaturePad from "@/components/SignaturePad";

type Announcement = {
  id: string;
  title: string;
  content: string;
  audience: string;
  status: string;
  signature_data: string | null;
};

export default function EditAnnouncementPage() {
  const [announcement, setAnnouncement] =
    useState<Announcement | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState("all");
  const [status, setStatus] = useState("draft");
  const [signature, setSignature] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");

    if (!id) {
      setError("Announcement ID is missing.");
      setLoading(false);
      return;
    }

    async function loadAnnouncement() {
      try {
        const response = await fetch(
          `/api/school/announcements/${id}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load announcement."
          );
        }

        const item = data.announcement as Announcement;

        setAnnouncement(item);
        setTitle(item.title);
        setContent(item.content);
        setAudience(item.audience);
        setStatus(item.status);
        setSignature(item.signature_data || "");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load announcement."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnnouncement();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!announcement) {
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError(
        "Title and announcement content are required."
      );
      return;
    }

    if (status === "published" && !signature) {
      setError(
        "Please draw your signature before publishing."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/school/announcements",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: announcement.id,
            title: title.trim(),
            content: content.trim(),
            audience,
            status,
            signature_data: signature,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update announcement."
        );
      }

      window.location.href =
        "/dashboard/announcements";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update announcement."
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
          <p className="text-sm text-muted-foreground">
            Loading announcement...
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <a
          href="/dashboard/announcements"
          className="inline-flex min-h-11 items-center rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted"
        >
          {"← Back to Announcements"}
        </a>

        <div className="mt-6">
          <p className="text-sm font-medium text-primary">
            School Communication
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Edit Announcement
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Update the announcement and publish or save it as a
            draft.
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >
          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-semibold"
            >
              Announcement Title
            </label>

            <input
              id="title"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              maxLength={200}
              className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:border-primary"
            />
          </div>

          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <label
              htmlFor="content"
              className="mb-2 block text-sm font-semibold"
            >
              Announcement
            </label>

            <textarea
              id="content"
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              rows={8}
              className="w-full resize-y rounded-xl border bg-background px-4 py-3 outline-none focus:border-primary"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border bg-card p-5">
              <label
                htmlFor="audience"
                className="mb-2 block text-sm font-semibold"
              >
                Audience
              </label>

              <select
                id="audience"
                value={audience}
                onChange={(event) =>
                  setAudience(event.target.value)
                }
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:border-primary"
              >
                <option value="all">Everyone</option>
                <option value="teachers">Teachers</option>
                <option value="students">Students</option>
                <option value="parents">Parents</option>
              </select>
            </div>

            <div className="rounded-2xl border bg-card p-5">
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
                  setStatus(event.target.value)
                }
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:border-primary"
              >
                <option value="published">Publish now</option>
                <option value="draft">Save as draft</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold">
                Digital Signature
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                A signature is required when the announcement
                is published.
              </p>
            </div>

            <SignaturePad
              value={signature}
              onChange={setSignature}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <a
              href="/dashboard/announcements"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border px-5 py-3 text-sm font-semibold hover:bg-muted"
            >
              Cancel
            </a>

            <button
              type="submit"
              disabled={saving || !announcement}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
