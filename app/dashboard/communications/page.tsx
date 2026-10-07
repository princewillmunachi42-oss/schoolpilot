"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  MessageSquare,
  RefreshCw,
  Send,
  UserRound,
  Users,
} from "lucide-react";

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

  const totalMessages = communications.length;
  const uniqueRecipients = new Set(
    communications.map((communication) => communication.recipient_name)
  ).size;
  const linkedMessages = communications.filter(
    (communication) => communication.student_first_name
  ).length;

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-4 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MessageSquare className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-medium text-primary">
                  Operations
                </p>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Communications
                </h1>
              </div>
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Communicate directly with parents and keep a real record of
              messages sent by your school.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCommunications}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-semibold transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </header>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            <MessageSquare className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div className="flex items-start gap-3 rounded-2xl border border-success/20 bg-success/10 p-4 text-sm text-success">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{message}</p>
          </div>
        )}

        {/* Overview */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Messages
                </p>
                <p className="mt-2 text-3xl font-bold">{totalMessages}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              All recorded school communications
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Recipients
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {uniqueRecipients}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Parents who have received messages
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Student-linked
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {linkedMessages}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
                <UserRound className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Messages connected to a student
            </p>
          </div>
        </section>

        {/* Main workspace */}
        <section className="grid gap-6 xl:grid-cols-[390px_1fr]">
          {/* Compose */}
          <div className="rounded-2xl border bg-card shadow-sm">
            <div className="border-b p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Send className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold">Send Communication</h2>
                  <p className="text-sm text-muted-foreground">
                    Send a direct message to a parent.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Parent
                </label>

                <select
                  value={parentId}
                  onChange={(event) => setParentId(event.target.value)}
                  disabled={loading || sending}
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
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
                <label className="mb-2 block text-sm font-medium">
                  Related Student
                  <span className="ml-1 font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>

                <select
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  disabled={loading || sending}
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">No specific student</option>

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
                <label className="mb-2 block text-sm font-medium">
                  Subject
                </label>

                <input
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Enter message subject"
                  disabled={sending}
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Message
                </label>

                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Write your message..."
                  rows={7}
                  disabled={sending}
                  className="w-full resize-none rounded-xl border bg-background px-3.5 py-3 text-sm leading-6 outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={sending || loading}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {sending ? "Sending..." : "Send Communication"}
              </button>
            </form>
          </div>

          {/* History */}
          <div className="rounded-2xl border bg-card shadow-sm">
            <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Mail className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold">Sent Communications</h2>
                  <p className="text-sm text-muted-foreground">
                    Recent messages sent by your school.
                  </p>
                </div>
              </div>

              <span className="inline-flex w-fit items-center rounded-full bg-muted px-3 py-1.5 text-sm font-semibold text-muted-foreground">
                {communications.length}{" "}
                {communications.length === 1 ? "message" : "messages"}
              </span>
            </div>

            <div className="space-y-3 p-5 sm:p-6">
              {loading ? (
                <>
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="animate-pulse rounded-2xl border p-5"
                    >
                      <div className="h-4 w-2/5 rounded bg-muted" />
                      <div className="mt-3 h-3 w-1/3 rounded bg-muted" />
                      <div className="mt-4 h-16 rounded bg-muted" />
                    </div>
                  ))}
                </>
              ) : communications.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <Mail className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 font-semibold">
                    No communications yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                    Messages you send to parents will appear here with
                    their delivery details and related student.
                  </p>
                </div>
              ) : (
                communications.map((communication) => (
                  <article
                    key={communication.id}
                    className="rounded-2xl border bg-background/60 p-5 transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">
                            {communication.subject}
                          </h3>

                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold capitalize text-primary">
                            {communication.type}
                          </span>
                        </div>

                        <div className="mt-2 space-y-1">
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <UserRound className="h-3.5 w-3.5" />
                            To:{" "}
                            {communication.recipient_name || "Parent"}
                          </p>

                          {communication.student_first_name && (
                            <p className="text-xs text-muted-foreground">
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
                      </div>

                      <time className="shrink-0 text-xs text-muted-foreground">
                        {new Date(
                          communication.created_at
                        ).toLocaleString()}
                      </time>
                    </div>

                    <div className="mt-4 rounded-xl border bg-card p-4">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {communication.message}
                      </p>
                    </div>
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
