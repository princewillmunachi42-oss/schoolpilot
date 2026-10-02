"use client";

import { useState } from "react";

type TermActionsProps = {
  id: string;
};

export default function TermActions({ id }: TermActionsProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this term?"
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const response = await fetch("/api/school/terms", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete term.");
      }

      window.location.reload();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to delete term."
      );

      setDeleting(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <a
        href={`/dashboard/terms/edit?id=${encodeURIComponent(id)}`}
        className="inline-flex min-h-10 items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted"
      >
        Edit
      </a>

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-destructive/30 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
