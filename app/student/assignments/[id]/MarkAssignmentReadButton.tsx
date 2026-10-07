"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MarkAssignmentReadButton({
  notificationId,
}: {
  notificationId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleMarkAsRead() {
    setLoading(true);

    try {
      const response = await fetch(
        "/api/student/notifications/read",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notificationId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to mark notification as read."
        );
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleMarkAsRead}
      disabled={loading}
      className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {loading ? "Marking as read..." : "Mark as read"}
    </button>
  );
}
