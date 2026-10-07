"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Student = {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  class_name: string | null;
  status: string;
};

type Session = {
  id: string;
  name: string;
};

type Term = {
  id: string;
  name: string;
  academic_session_id: string;
};

type Fee = {
  id: string;
  student_id: string;
  fee_name: string;
  amount_due: number | string;
  amount_paid: number | string;
  balance: number | string;
  due_date: string | null;
  status: string;
  remarks: string | null;
  academic_session_id: string;
  term_id: string;
  session_name: string;
  term_name: string;
};

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "waived", label: "Waived" },
];

function formatCurrency(value: number | string) {
  return `₦${Number(value).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function studentName(student: Student) {
  return `${student.first_name} ${student.last_name}`;
}

export default function FeesPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);

  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");

  const [feeName, setFeeName] = useState("");
  const [amountDue, setAmountDue] = useState("");
  const [amountPaid, setAmountPaid] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("pending");
  const [remarks, setRemarks] = useState("");
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadInitialData() {
    setLoading(true);
    setError("");

    try {
      const [studentsResponse, sessionsResponse, termsResponse] =
        await Promise.all([
          fetch("/api/school/students", { cache: "no-store" }),
          fetch("/api/school/sessions", { cache: "no-store" }),
          fetch("/api/school/terms", { cache: "no-store" }),
        ]);

      const studentsData = await studentsResponse.json();
      const sessionsData = await sessionsResponse.json();
      const termsData = await termsResponse.json();

      if (!studentsResponse.ok || !studentsData.success) {
        throw new Error(
          studentsData.message || "Unable to load students."
        );
      }

      if (!sessionsResponse.ok) {
        throw new Error("Unable to load academic sessions.");
      }

      if (!termsResponse.ok) {
        throw new Error("Unable to load terms.");
      }

      setStudents(studentsData.students ?? []);
      setSessions(sessionsData.sessions ?? []);
      setTerms(termsData.terms ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load fee management data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadFees(studentId: string) {
    if (!studentId) {
      setFees([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/school/fees?student_id=${encodeURIComponent(studentId)}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load fees.");
      }

      setFees(data.fees ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load fees."
      );
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadFees(selectedStudent);
  }, [selectedStudent]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!selectedStudent || !selectedSession || !selectedTerm) {
      setError("Select a student, academic session, and term.");
      return;
    }

    if (!feeName.trim()) {
      setError("Enter a fee name.");
      return;
    }

    const due = Number(amountDue);
    const paid = Number(amountPaid || 0);

    if (!Number.isFinite(due) || due < 0) {
      setError("Enter a valid amount due.");
      return;
    }

    if (!Number.isFinite(paid) || paid < 0 || paid > due) {
      setError("Enter a valid amount paid.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/school/fees", {
        method: editingFeeId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
         body: JSON.stringify({
  ...(editingFeeId ? { id: editingFeeId } : {}),
  student_id: selectedStudent,
          academic_session_id: selectedSession,
          term_id: selectedTerm,
          fee_name: feeName.trim(),
          amount_due: due,
          amount_paid: paid,
          due_date: dueDate || null,
          status,
          remarks: remarks.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create fee record.");
      }

     setMessage(
  editingFeeId
    ? "Fee updated successfully. The student has been notified."
    : "Fee created successfully. The student has been notified."
);

      setFeeName("");
      setAmountDue("");
      setAmountPaid("0");
      setDueDate("");
      setStatus("pending");
      setRemarks("");

      await loadFees(selectedStudent);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create fee record."
      );
    } finally {
      setSubmitting(false);
    }
  }
  function startEditingFee(fee: Fee) {
    setEditingFeeId(fee.id);
    setFeeName(fee.fee_name);
    setAmountDue(String(fee.amount_due));
    setAmountPaid(String(fee.amount_paid));
    setDueDate(
      fee.due_date
        ? new Date(fee.due_date).toISOString().split("T")[0]
        : ""
    );
    setStatus(fee.status);
    setRemarks(fee.remarks ?? "");
    setSelectedSession(fee.academic_session_id);
    setSelectedTerm(fee.term_id);
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditingFee() {
    setEditingFeeId(null);
    setFeeName("");
    setAmountDue("");
    setAmountPaid("0");
    setDueDate("");
    setStatus("pending");
    setRemarks("");
    setMessage("");
    setError("");
  }
  const selectedStudentData = students.find(
    (student) => student.id === selectedStudent
  );

  const filteredTerms = selectedSession
    ? terms.filter(
        (term) => term.academic_session_id === selectedSession
      )
    : [];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            ← Back to Dashboard
          </Link>

          <p className="text-sm font-medium text-muted-foreground">
            Finance Management
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Student Fees
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Create and review real student fee records.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </div>
        )}

        <section className="mb-8 rounded-xl border bg-card p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Add Student Fee</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a fee record for a specific student.
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading fee management data...
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Student
                </label>

                <select
                  value={selectedStudent}
                  onChange={(event) =>
                    setSelectedStudent(event.target.value)
                  }
                  required
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select student</option>

                  {students
                    .filter((student) => student.status === "active")
                    .map((student) => (
                      <option key={student.id} value={student.id}>
                        {studentName(student)} —{" "}
                        {student.admission_number}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Academic Session
                </label>

                <select
                  value={selectedSession}
                  onChange={(event) => {
                    setSelectedSession(event.target.value);
                    setSelectedTerm("");
                  }}
                  required
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select session</option>

                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Term
                </label>

                <select
                  value={selectedTerm}
                  onChange={(event) =>
                    setSelectedTerm(event.target.value)
                  }
                  required
                  disabled={!selectedSession}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Select term</option>

                  {filteredTerms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Fee Name
                </label>

                <input
                  value={feeName}
                  onChange={(event) => setFeeName(event.target.value)}
                  placeholder="e.g. School Fees"
                  required
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Amount Due
                </label>

                <input
                  value={amountDue}
                  onChange={(event) => setAmountDue(event.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="50000"
                  required
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Amount Paid
                </label>

                <input
                  value={amountPaid}
                  onChange={(event) => setAmountPaid(event.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Due Date
                </label>

                <input
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  type="date"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="mb-2 block text-sm font-medium">
                  Remarks
                </label>

                <textarea
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  rows={3}
                  placeholder="Optional remarks"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
  ? editingFeeId
    ? "Updating Fee..."
    : "Creating Fee..."
  : editingFeeId
    ? "Update Fee"
    : "Create Fee"}
                </button>
{editingFeeId && (
  <button
    type="button"
    onClick={cancelEditingFee}
    className="mt-3 w-full rounded-lg border px-5 py-3 font-semibold hover:bg-muted"
  >
    Cancel Edit
  </button>
)}
              </div>
            </form>
          )}
        </section>

        {selectedStudentData && (
          <section className="rounded-xl border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Fee Records
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {studentName(selectedStudentData)} •{" "}
                {selectedStudentData.admission_number}
              </p>
            </div>

            {fees.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No fee records for this student yet.
              </div>
            ) : (
              <div className="space-y-4">
                {fees.map((fee) => (
                  <div
                    key={fee.id}
                    className="rounded-xl border p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {fee.fee_name}
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {fee.term_name} • {fee.session_name}
                        </p>
                      </div>

                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">
                        {fee.status}
                      </span>
<button
  type="button"
  onClick={() => startEditingFee(fee)}
  className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
>
  Edit
</button>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Amount Due
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatCurrency(fee.amount_due)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Amount Paid
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatCurrency(fee.amount_paid)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Balance
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatCurrency(fee.balance)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Due Date
                        </p>
                        <p className="mt-1 font-semibold">
                          {fee.due_date
                            ? new Date(
                                fee.due_date
                              ).toLocaleDateString("en-NG")
                            : "No due date"}
                        </p>
                      </div>
                    </div>

                    {fee.remarks && (
                      <div className="mt-4 border-t pt-4">
                        <p className="text-xs text-muted-foreground">
                          Remarks
                        </p>
                        <p className="mt-1 text-sm">
                          {fee.remarks}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
