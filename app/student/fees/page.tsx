import Link from "next/link";
import { redirect } from "next/navigation";
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

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 text-gray-900 dark:bg-gray-950 dark:text-gray-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            href="/student"
            className="mb-4 inline-flex items-center text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Back to Student Dashboard
          </Link>

          <h1 className="text-2xl font-bold sm:text-3xl">
            Fees
          </h1>

          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            View your school fees, payments, balances, and due dates.
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Due
            </p>
            <p className="mt-2 text-2xl font-bold">
              {formatCurrency(totalDue)}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Paid
            </p>
            <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalPaid)}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:col-span-2 lg:col-span-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Outstanding
            </p>
            <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalOutstanding)}
            </p>
          </div>
        </div>

        {fees.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-lg font-semibold">
              No fee records available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
              Your school has not added any fee records for your student
              account yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {fees.map((fee) => (
              <div
                key={fee.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {fee.fee_name}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {fee.term_name} • {fee.session_name}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                      fee.status
                    )}`}
                  >
                    {getStatusLabel(fee.status)}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Amount Due
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatCurrency(fee.amountDue)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Amount Paid
                    </p>
                    <p className="mt-1 font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(fee.amountPaid)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Balance
                    </p>
                    <p className="mt-1 font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(fee.balance)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Due Date
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatDate(fee.due_date)}
                    </p>
                  </div>
                </div>

                {fee.remarks && (
                  <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
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
      </div>
    </main>
  );
}
