"use client";

import { useState } from "react";

type StaffActionsProps = {
  id: string;
};

export default function StaffActions({
  id,
}: StaffActionsProps) {
  const [deactivating, setDeactivating] = useState(false);

  async function handleDeactivate() {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this staff member?"
    );

    if (!confirmed) return;

    setDeactivating(true);

    try {
      const response = await fetch("/api/school/staff", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to deactivate staff member."
        );
      }

      window.location.reload();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to deactivate staff member."
      );

      setDeactivating(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`/dashboard/staff/edit?id=${encodeURIComponent(id)}`}
        className="inline-flex min-h-10 items-center justify-center rounded-xl border bg-background px-3.5 py-2 text-sm font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
      >
        Edit
      </a>

      <button
        type="button"
        onClick={handleDeactivate}
        disabled={deactivating}
        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2 text-sm font-semibold text-destructive transition-all hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {deactivating ? "Deactivating..." : "Deactivate"}
      </button>
    </div>
  );
}
