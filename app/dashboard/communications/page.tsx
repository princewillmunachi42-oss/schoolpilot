"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Communication = {
  id: string;
  subject: string;
  message: string;
  type: string;
  created_at: string;
  recipient_name: string | null;
  student_first_name: string | null;
  student_last_name: string | null;
  admission_number: string | null;
};

type Parent = {
  parent_id: string;
  user_id: string;
  full_name: string;
  email: string | null;
};

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  other_name: string | null;
};

export default function CommunicationsPage() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [parentId, setParentId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  async function loadCommunications() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/school/communications");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load communications."
        );
      }

      setCommunications(result.communications || []);
      setParents(result.parents || []);
      setStudents(result.students || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load communications."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCommunications();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!parentId || !subject.trim() || !body.trim()) {
      setError("Please select a parent and enter a subject and message.");
      return;
    }

    try {
      setSending(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/school/communications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  recipientUserId: parentId,
  studentId: studentId || null,
  subject: subject.trim(),
  message: body.trim(),
  type: "message",
}),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to send communication."
        );
      }

      setMessage("Communication sent successfully.");
      setParentId("");
      setStudentId("");
      setSubject("");
      setBody("");

      await loadCommunications();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send communication."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">
              Owner Portal
            </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              Communications
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Send messages to parents and view communications sent by
              your school.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Send Communication
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Send a message directly to a parent.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Parent
                </label>

                <select
                  value={parentId}
                  onChange={(event) =>
                    setParentId(event.target.value)
                  }
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  disabled={loading || sending}
                >
                  <option value="">Select parent</option>

                  {parents.map((parent) => (
  <option key={parent.parent_id} value={parent.user_id}>
    {parent.full_name}
    {parent.email ? ` — ${parent.email}` : ""}
  </option>
))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Related Student
                </label>

                <select
                  value={studentId}
                  onChange={(event) =>
                    setStudentId(event.target.value)
                  }
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  disabled={loading || sending}
                >
                  <option value="">None</option>

                  {students.map((student) => {
  const fullName = [
    student.first_name,
    student.other_name,
    student.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <option key={student.id} value={student.id}>
      {fullName}
    </option>
  );
})}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Subject
                </label>

                <input
                  type="text"
                  value={subject}
                  onChange={(event) =>
                    setSubject(event.target.value)
                  }
                  placeholder="Enter subject"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  disabled={sending}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Message
                </label>

                <textarea
                  value={body}
                  onChange={(event) =>
                    setBody(event.target.value)
                  }
                  placeholder="Write your message..."
                  rows={6}
                  className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  disabled={sending}
                />
              </div>

              <button
                type="submit"
                disabled={sending || loading}
                className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Sending..." : "Send Communication"}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Sent Communications
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Recent messages sent by your school.
                </p>
              </div>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                {communications.length}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                <p className="text-sm text-gray-500">
                  Loading communications...
                </p>
              ) : communications.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">
                  No communications have been sent yet.
                </div>
              ) : (
                communications.map((communication) => (
                  <article
                    key={communication.id}
                    className="rounded-xl border p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {communication.subject}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          To:{" "}
                          {communication.recipient_name ||
                            "Parent"}
                        </p>

                        {communication.student_first_name && (
  <p className="text-xs text-gray-500">
    Student:{" "}
    {[
      communication.student_first_name,
      communication.student_last_name,
    ]
      .filter(Boolean)
      .join(" ")}
    {communication.admission_number
      ? ` (${communication.admission_number})`
      : ""}
  </p>
)}
                      </div>

                      <span className="text-xs text-gray-500">
                        {new Date(
                          communication.created_at
                        ).toLocaleString()}
                      </span>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
                      {communication.message}
                    </p>

                    <span className="mt-3 inline-block rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-600">
                      {communication.type}
                    </span>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

