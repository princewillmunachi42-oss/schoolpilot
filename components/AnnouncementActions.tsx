"use client";

import { useState } from "react";

type AnnouncementActionsProps = {
  id: string;
};

export default function AnnouncementActions({
  id,
}: AnnouncementActionsProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this announcement?"
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(
        "/api/school/announcements",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete announcement."
        );
      }

      window.location.reload();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to delete announcement."
      );

      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`/dashboard/announcements/edit?id=${encodeURIComponent(id)}`}
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
