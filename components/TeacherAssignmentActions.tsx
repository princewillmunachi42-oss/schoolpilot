"use client";

import { useState } from "react";

type TeacherAssignmentActionsProps = {
  id: string;
  assignmentType: "class" | "subject";
};

export default function TeacherAssignmentActions({
  id,
  assignmentType,
}: TeacherAssignmentActionsProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this teacher assignment?"
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(
        "/api/school/teacher-assignments",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            assignmentType,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete assignment."
        );
      }

      window.location.reload();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to delete assignment."
      );

      setDeleting(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <a
        href={`/dashboard/teacher-assignments/edit?id=${encodeURIComponent(
          id
        )}&type=${assignmentType}`}
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
