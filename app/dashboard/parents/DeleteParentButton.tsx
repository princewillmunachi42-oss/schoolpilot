"use client";

import { useState } from "react";

type DeleteParentButtonProps = {
  parentId: string;
  parentName: string;
};

export default function DeleteParentButton({
  parentId,
  parentName,
}: DeleteParentButtonProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete ${parentName}?\n\nThis will also remove all parent-student links for this parent. It will not delete any students.`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch("/api/school/parents", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        window.alert(data.message || "Unable to delete parent.");
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error("Delete parent request failed:", error);
      window.alert("Unable to delete parent.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2 text-sm font-semibold text-destructive transition-all hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}
