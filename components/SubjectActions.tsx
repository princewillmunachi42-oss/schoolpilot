"use client";

import { useState } from "react";

type SubjectActionsProps = {
  id: string;
};

export default function SubjectActions({
  id,
}: SubjectActionsProps) {
  const [deactivating, setDeactivating] = useState(false);

  async function handleDeactivate() {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this subject?"
    );

    if (!confirmed) return;

    setDeactivating(true);

    try {
      const response = await fetch("/api/school/subjects", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to deactivate subject."
        );
      }

      window.location.reload();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to deactivate subject."
      );

      setDeactivating(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <a
        href={`/dashboard/subjects/edit?id=${encodeURIComponent(id)}`}
        className="inline-flex min-h-10 items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted"
      >
        Edit
      </a>

      <button
        type="button"
        onClick={handleDeactivate}
        disabled={deactivating}
        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-destructive/30 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {deactivating ? "Deactivating..." : "Deactivate"}
      </button>
    </div>
  );
}
