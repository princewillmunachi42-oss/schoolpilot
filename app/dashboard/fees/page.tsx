"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";

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

function statusLabel(status: string) {
  return (
    statusOptions.find((option) => option.value === status)?.label ?? status
  );
}

function statusClasses(status: string) {
  switch (status) {
    case "paid":
      return "bg-success/10 text-success border-success/20";
    case "partial":
      return "bg-warning/10 text-warning border-warning/20";
    case "overdue":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "waived":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-primary/10 text-primary border-primary/20";
  }
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
        throw new Error(data.error || "Unable to save fee record.");
      }

      setMessage(
        editingFeeId
          ? "Fee updated successfully. The student has been notified."
          : "Fee created successfully. The student has been notified."
      );

      setEditingFeeId(null);
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
          : "Unable to save fee record."
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

  const feeSummary = useMemo(() => {
    const totalDue = fees.reduce(
      (sum, fee) => sum + Number(fee.amount_due || 0),
      0
    );

    const totalPaid = fees.reduce(
      (sum, fee) => sum + Number(fee.amount_paid || 0),
      0
    );

    const totalBalance = fees.reduce(
      (sum, fee) => sum + Number(fee.balance || 0),
      0
    );

    return {
      totalDue,
      totalPaid,
      totalBalance,
      records: fees.length,
    };
  }, [fees]);

  const activeStudents = students.filter(
    (student) => student.status === "active"
  ).length;

  const inputClass =
    "min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-8">
          <Link
            href="/dashboard"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                <CircleDollarSign className="h-4 w-4" />
                Finance Management
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Student Fees
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Create, review, and manage real student fee records across
                academic sessions and terms.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground shadow-sm">
              <Users className="h-4 w-4 text-primary" />
              {activeStudents} active students
            </div>
          </div>
        </header>

        {message && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {selectedStudentData && (
          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Records
                </span>
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Receipt className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-bold">{feeSummary.records}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                For selected student
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Amount Due
                </span>
                <div className="rounded-xl bg-warning/10 p-2.5 text-warning">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(feeSummary.totalDue)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Total billed
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Amount Paid
                </span>
                <div className="rounded-xl bg-success/10 p-2.5 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(feeSummary.totalPaid)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Payments recorded
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Balance
                </span>
                <div className="rounded-xl bg-destructive/10 p-2.5 text-destructive">
                  <CircleDollarSign className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(feeSummary.totalBalance)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Outstanding amount
              </p>
            </div>
          </section>
        )}

        <section className="mb-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b bg-muted/30 px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                {editingFeeId ? (
                  <Pencil className="h-5 w-5" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </div>

              <div>
                <h2 className="font-semibold">
                  {editingFeeId ? "Edit Fee Record" : "Add Student Fee"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {editingFeeId
                    ? "Update the selected student's existing fee record."
                    : "Create a fee record for a specific student."}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              <div className="h-11 animate-pulse rounded-xl bg-muted" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="h-11 animate-pulse rounded-xl bg-muted" />
                <div className="h-11 animate-pulse rounded-xl bg-muted" />
                <div className="h-11 animate-pulse rounded-xl bg-muted" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 sm:p-6">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    Student
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(event) =>
                      setSelectedStudent(event.target.value)
                    }
                    required
                    className={inputClass}
                  >
                    <option value="">Select student</option>
                    {students
                      .filter((student) => student.status === "active")
                      .map((student) => (
                        <option key={student.id} value={student.id}>
                          {studentName(student)} — {student.admission_number}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    Academic Session
                  </label>
                  <select
                    value={selectedSession}
                    onChange={(event) => {
                      setSelectedSession(event.target.value);
                      setSelectedTerm("");
                    }}
                    required
                    className={inputClass}
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
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    Term
                  </label>
                  <select
                    value={selectedTerm}
                    onChange={(event) =>
                      setSelectedTerm(event.target.value)
                    }
                    required
                    disabled={!selectedSession}
                    className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
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
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Amount Due
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      ₦
                    </span>
                    <input
                      value={amountDue}
                      onChange={(event) =>
                        setAmountDue(event.target.value)
                      }
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="50000"
                      required
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Amount Paid
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      ₦
                    </span>
                    <input
                      value={amountPaid}
                      onChange={(event) =>
                        setAmountPaid(event.target.value)
                      }
                      type="number"
                      min="0"
                      step="0.01"
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Clock3 className="h-4 w-4 text-muted-foreground" />
                    Due Date
                  </label>
                  <input
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    type="date"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className={inputClass}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Remarks
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    rows={3}
                    placeholder="Optional remarks about this fee..."
                    className={`${inputClass} min-h-24 resize-y`}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                {editingFeeId && (
                  <button
                    type="button"
                    onClick={cancelEditingFee}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition-colors hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                    Cancel Edit
                  </button>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {editingFeeId ? "Updating Fee..." : "Creating Fee..."}
                    </>
                  ) : (
                    <>
                      {editingFeeId ? (
                        <Pencil className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {editingFeeId ? "Update Fee" : "Create Fee"}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </section>

        {selectedStudentData && (
          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b bg-muted/30 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                    <Receipt className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold">Fee Records</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {studentName(selectedStudentData)} ·{" "}
                      {selectedStudentData.admission_number}
                      {selectedStudentData.class_name
                        ? ` · ${selectedStudentData.class_name}`
                        : ""}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => loadFees(selectedStudent)}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>

            {fees.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <div className="mb-4 rounded-2xl bg-muted p-4 text-muted-foreground">
                  <Receipt className="h-7 w-7" />
                </div>
                <h3 className="font-semibold">No fee records yet</h3>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Create the first fee record for this student using the form
                  above.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {fees.map((fee) => (
                  <article
                    key={fee.id}
                    className="p-5 transition-colors hover:bg-muted/20 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{fee.fee_name}</h3>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses(
                              fee.status
                            )}`}
                          >
                            {statusLabel(fee.status)}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5" />
                            {fee.term_name}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {fee.session_name}
                          </span>

                          {fee.due_date && (
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 className="h-3.5 w-3.5" />
                              Due{" "}
                              {new Date(fee.due_date).toLocaleDateString(
                                "en-NG",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => startEditingFee(fee)}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border bg-background p-4">
                        <p className="text-xs font-medium text-muted-foreground">
                          Amount Due
                        </p>
                        <p className="mt-1 text-lg font-bold">
                          {formatCurrency(fee.amount_due)}
                        </p>
                      </div>

                      <div className="rounded-xl border bg-background p-4">
                        <p className="text-xs font-medium text-muted-foreground">
                          Amount Paid
                        </p>
                        <p className="mt-1 text-lg font-bold text-success">
                          {formatCurrency(fee.amount_paid)}
                        </p>
                      </div>

                      <div className="rounded-xl border bg-background p-4">
                        <p className="text-xs font-medium text-muted-foreground">
                          Balance
                        </p>
                        <p className="mt-1 text-lg font-bold text-destructive">
                          {formatCurrency(fee.balance)}
                        </p>
                      </div>
                    </div>

                    {fee.remarks && (
                      <div className="mt-4 rounded-xl bg-muted/50 px-4 py-3">
                        <p className="text-xs font-semibold text-muted-foreground">
                          Remarks
                        </p>
                        <p className="mt-1 text-sm">{fee.remarks}</p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {!selectedStudentData && !loading && (
          <section className="rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
            <div className="mx-auto mb-4 w-fit rounded-2xl bg-primary/10 p-4 text-primary">
              <GraduationCap className="h-7 w-7" />
            </div>

            <h2 className="font-semibold">Select a student to begin</h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              Choose an active student from the fee form above to view their
              existing fee records, balances, and payment history.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
