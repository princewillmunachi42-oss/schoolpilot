import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  GraduationCap,
  Receipt,
} from "lucide-react";
import { getCurrentStudent } from "@/lib/auth/student";
import pool from "@/lib/db";

function formatCurrency(value: number) {
  return `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null) {
  if (!value) return "No due date";

  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusLabel(status: string) {
  switch (status) {
    case "paid":
      return "Paid";
    case "partial":
      return "Partially Paid";
    case "overdue":
      return "Overdue";
    case "waived":
      return "Waived";
    default:
      return "Pending";
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "partial":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "overdue":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "waived":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "paid":
      return CheckCircle2;
    case "overdue":
      return AlertCircle;
    case "partial":
      return Clock3;
    default:
      return Receipt;
  }
}

export default async function StudentFeesPage() {
  const currentStudent = await getCurrentStudent();

  if (!currentStudent) {
    redirect("/login");
  }

  const result = await pool.query(
    `
      SELECT
        sf.id,
        sf.fee_name,
        sf.amount_due,
        sf.amount_paid,
        sf.due_date,
        sf.status,
        sf.remarks,
        sf.academic_session_id,
        sf.term_id,
        a.name AS session_name,
        t.name AS term_name
      FROM student_fees sf
      INNER JOIN academic_sessions a
        ON a.id = sf.academic_session_id
       AND a.school_id = sf.school_id
      INNER JOIN terms t
        ON t.id = sf.term_id
       AND t.school_id = sf.school_id
      WHERE sf.school_id = $1
        AND sf.student_id = $2
      ORDER BY
        CASE
          WHEN sf.status = 'overdue' THEN 0
          WHEN sf.status = 'pending' THEN 1
          WHEN sf.status = 'partial' THEN 2
          WHEN sf.status = 'paid' THEN 3
          ELSE 4
        END,
        sf.due_date ASC NULLS LAST,
        sf.created_at DESC
    `,
    [currentStudent.schoolId, currentStudent.studentId]
  );

  const fees = result.rows.map((fee) => {
    const amountDue = Number(fee.amount_due);
    const amountPaid = Number(fee.amount_paid);
    const balance = Math.max(amountDue - amountPaid, 0);

    return {
      ...fee,
      amountDue,
      amountPaid,
      balance,
    };
  });

  const totalDue = fees.reduce(
    (sum, fee) => sum + fee.amountDue,
    0
  );

  const totalPaid = fees.reduce(
    (sum, fee) => sum + fee.amountPaid,
    0
  );

  const totalOutstanding = fees.reduce(
    (sum, fee) => sum + fee.balance,
    0
  );

  const overdueCount = fees.filter(
    (fee) => fee.status === "overdue"
  ).length;

  const paidCount = fees.filter(
    (fee) => fee.status === "paid"
  ).length;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/student"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Student Dashboard
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <CircleDollarSign className="h-3.5 w-3.5" />
            Student Portal
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Fees
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                View your school fees, payments, outstanding balances, and due
                dates.
              </p>
            </div>

            <div className="flex w-fit items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Fee Records
                </p>
                <p className="text-sm font-bold">
                  {fees.length} {fees.length === 1 ? "Record" : "Records"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Summary */}
        <section className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={Receipt}
            label="Total Due"
            value={formatCurrency(totalDue)}
            description="Total billed amount"
          />

          <StatCard
            icon={CheckCircle2}
            label="Total Paid"
            value={formatCurrency(totalPaid)}
            description={`${paidCount} fully paid ${
              paidCount === 1 ? "record" : "records"
            }`}
          />

          <StatCard
            icon={AlertCircle}
            label="Outstanding"
            value={formatCurrency(totalOutstanding)}
            description={
              overdueCount > 0
                ? `${overdueCount} overdue ${
                    overdueCount === 1 ? "record" : "records"
                  }`
                : "No overdue records"
            }
          />
        </section>

        {fees.length === 0 ? (
          <section className="rounded-3xl border border-dashed bg-card p-10 text-center shadow-sm sm:p-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Receipt className="h-7 w-7 text-muted-foreground" />
            </div>

            <h2 className="mt-5 text-xl font-bold">
              No fee records available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Your school has not added any fee records for your student
              account yet.
            </p>

            <Link
              href="/student"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Link>
          </section>
        ) : (
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold">Fee Records</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your current and previous school fee records.
              </p>
            </div>

            <div className="space-y-4">
              {fees.map((fee) => {
                const StatusIcon = getStatusIcon(fee.status);

                return (
                  <article
                    key={fee.id}
                    className="rounded-3xl border bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col gap-5">
                      {/* Fee heading */}
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Receipt className="h-5 w-5 text-primary" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-lg font-bold tracking-tight">
                              {fee.fee_name}
                            </h3>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <span>{fee.term_name}</span>
                              <span aria-hidden="true">•</span>
                              <span>{fee.session_name}</span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClass(
                            fee.status
                          )}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {getStatusLabel(fee.status)}
                        </span>
                      </div>

                      {/* Amount details */}
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <FeeDetail
                          label="Amount Due"
                          value={formatCurrency(fee.amountDue)}
                        />

                        <FeeDetail
                          label="Amount Paid"
                          value={formatCurrency(fee.amountPaid)}
                          valueClassName="text-green-600 dark:text-green-400"
                        />

                        <FeeDetail
                          label="Balance"
                          value={formatCurrency(fee.balance)}
                          valueClassName={
                            fee.balance > 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-green-600 dark:text-green-400"
                          }
                        />

                        <FeeDetail
                          label="Due Date"
                          value={formatDate(fee.due_date)}
                          icon={<CalendarDays className="h-3.5 w-3.5" />}
                        />
                      </div>

                      {fee.remarks && (
                        <div className="rounded-2xl border bg-muted/40 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Remarks
                          </p>

                          <p className="mt-1 text-sm leading-6">
                            {fee.remarks}
                          </p>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof Receipt;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="group rounded-3xl border bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-4 text-sm font-medium text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 break-words text-2xl font-bold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function FeeDetail({
  label,
  value,
  valueClassName = "",
  icon,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-background px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </p>

      <p className={`mt-1 text-sm font-bold ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}
