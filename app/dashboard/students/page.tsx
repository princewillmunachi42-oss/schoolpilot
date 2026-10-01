"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Student = {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  other_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  status: "active" | "inactive" | "graduated" | "withdrawn";
  class_id: string | null;
  class_name: string | null;
};

type SchoolClass = {
  id: string;
  name: string;
};

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "graduated", label: "Graduated" },
  { value: "withdrawn", label: "Withdrawn" },
];

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({
    admissionNumber: "",
    classId: "",
    firstName: "",
    lastName: "",
    otherName: "",
    gender: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    status: "active",
  });

  async function loadStudents() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/school/students", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load students.");
      }

      setStudents(data.students);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load students."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadClasses() {
    try {
      const response = await fetch("/api/school/classes", {
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data.classes)) {
        setClasses(data.classes);
      }
    } catch {
      // The student list can still load if classes fail.
    }
  }

  useEffect(() => {
    loadStudents();
    loadClasses();
  }, []);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return students.filter((student) => {
      const fullName = [
        student.first_name,
        student.other_name,
        student.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        fullName.includes(normalizedSearch) ||
        student.admission_number.toLowerCase().includes(normalizedSearch);

      const matchesClass =
        !classFilter || student.class_id === classFilter;

      const matchesStatus =
        !statusFilter || student.status === statusFilter;

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [students, search, classFilter, statusFilter]);

  const counts = useMemo(
    () => ({
      total: students.length,
      active: students.filter((student) => student.status === "active").length,
      inactive: students.filter((student) => student.status === "inactive")
        .length,
      graduated: students.filter(
        (student) => student.status === "graduated"
      ).length,
      withdrawn: students.filter(
        (student) => student.status === "withdrawn"
      ).length,
    }),
    [students]
  );

  function openEdit(student: Student) {
    setEditingStudent(student);
    setEditForm({
      admissionNumber: student.admission_number,
      classId: student.class_id ?? "",
      firstName: student.first_name,
      lastName: student.last_name,
      otherName: student.other_name ?? "",
      gender: student.gender ?? "",
      dateOfBirth: student.date_of_birth
        ? student.date_of_birth.slice(0, 10)
        : "",
      email: student.email ?? "",
      phone: student.phone ?? "",
      status: student.status,
    });
    setMessage("");
    setError("");
  }

  function closeEdit() {
    setEditingStudent(null);
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingStudent) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/school/students", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingStudent.id,
          ...editForm,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update student.");
      }

      setMessage("Student updated successfully.");
      setEditingStudent(null);
      await loadStudents();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update student."
      );
    }
  }

  async function deactivateStudent(student: Student) {
    const confirmed = window.confirm(
      `Deactivate ${student.first_name} ${student.last_name}?`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/school/students?id=${encodeURIComponent(student.id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to deactivate student.");
      }

      setMessage("Student deactivated successfully.");
      await loadStudents();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to deactivate student."
      );
    }
  }

  function studentName(student: Student) {
    return [student.first_name, student.other_name, student.last_name]
      .filter(Boolean)
      .join(" ");
  }

  function statusClass(status: Student["status"]) {
    if (status === "active") {
      return "bg-success/10 text-success";
    }

    return "bg-muted text-muted-foreground";
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Student Management
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Students
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Register, search, manage, and monitor students in your school.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((value) => !value)}
            className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            {showAddForm ? "Close Add Student" : "+ Add Student"}
          </button>
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

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Total Students", counts.total],
            ["Active", counts.active],
            ["Inactive", counts.inactive],
            ["Graduated", counts.graduated],
            ["Withdrawn", counts.withdrawn],
          ].map(([label, count]) => (
            <div
              key={String(label)}
              className="rounded-xl border bg-card p-5"
            >
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-bold">{count}</p>
            </div>
          ))}
        </section>

        {showAddForm && (
          <section className="mb-8 rounded-xl border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Add Student</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a real student record in your school database.
              </p>
            </div>

            {classes.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Create an active class before adding a student.
              </div>
            ) : (
              <form
                action="/api/school/students"
                method="POST"
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Admission Number
                  </label>
                  <input
                    name="admissionNumber"
                    required
                    className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Class
                  </label>
                  <select
                    name="classId"
                    required
                    defaultValue=""
                    className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" disabled>
                      Select class
                    </option>
                    {classes.map((schoolClass) => (
                      <option key={schoolClass.id} value={schoolClass.id}>
                        {schoolClass.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    First Name
                  </label>
                  <input
                    name="firstName"
                    required
                    className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Last Name
                  </label>
                  <input
                    name="lastName"
                    required
                    className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Other Name
                  </label>
                  <input
                    name="otherName"
                    className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Gender
                  </label>
                  <select
                    name="gender"
                    defaultValue=""
                    className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Date of Birth
                  </label>
                  <input
                    name="dateOfBirth"
                    type="date"
                    className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Phone
                  </label>
                  <input
                    name="phone"
                    className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue="active"
                    className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="graduated">Graduated</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>

                <div className="flex items-end sm:col-span-2 lg:col-span-3">
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    Add Student
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        <section className="mb-6 rounded-xl border bg-card p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Search students
              </label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or admission number..."
                className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Filter by class
              </label>
              <select
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
                className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All classes</option>
                {classes.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Filter by status
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="flex flex-col gap-2 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">School Students</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Showing {filteredStudents.length} of {students.length} students
              </p>
            </div>

            {(search || classFilter || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setClassFilter("");
                  setStatusFilter("");
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Loading students...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium">No students found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {students.length === 0
                  ? "Add your first student using the Add Student button."
                  : "Try changing your search or filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Student</th>
                    <th className="px-6 py-4 font-semibold">Admission No.</th>
                    <th className="px-6 py-4 font-semibold">Class</th>
                    <th className="px-6 py-4 font-semibold">Gender</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {student.first_name.charAt(0)}
                            {student.last_name.charAt(0)}
                          </div>

                          <div>
                            <p className="font-semibold">
                              {studentName(student)}
                            </p>
                            {student.email && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                 {student.email}
    </p>
  )}
</div>
</div>
</td>

<td className="px-6 py-4 font-medium">
  {student.admission_number}
</td>

<td className="px-6 py-4">
  {student.class_name ?? "Not assigned"}
</td>

<td className="px-6 py-4 capitalize">
  {student.gender || "—"}
</td>

<td className="px-6 py-4">
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(
      student.status
    )}`}
  >
    {student.status}
  </span>
</td>

<td className="px-6 py-4">
  <div className="flex justify-end gap-2">
    <button
      type="button"
      onClick={() => openEdit(student)}
      className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted"
    >
      Edit
    </button>

    {student.status === "active" && (
      <button
        type="button"
        onClick={() => deactivateStudent(student)}
        className="rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
      >
        Deactivate
      </button>
    )}
  </div>
</td>
</tr>
))}
</tbody>
</table>
</div>
)}
</section>
</div>
</main>
            
);
}
