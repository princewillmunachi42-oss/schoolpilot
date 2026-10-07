"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Search,
  SlidersHorizontal,
  UserCheck,
  UserMinus,
  UserRoundX,
  Users,
} from "lucide-react";
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
  portal_enabled: boolean;
  user_id: string | null;
  login_id: string | null;
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
  const [enablingPortal, setEnablingPortal] = useState<string | null>(null);
  const [portalCredentials, setPortalCredentials] = useState<{
    studentName: string;
    loginId: string;
    temporaryPassword: string;
  } | null>(null);
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

  async function enablePortal(student: Student) {
    if (student.status !== "active") {
      setError("Only active students can be given portal access.");
      return;
    }

    if (student.portal_enabled) {
      setError("This student's portal access is already enabled.");
      return;
    }

    const confirmed = window.confirm(
      `Enable Student Portal access for ${studentName(student)}?\\n\\nA secure Login ID and temporary password will be generated.`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");
    setPortalCredentials(null);
    setEnablingPortal(student.id);

    try {
      const response = await fetch("/api/school/students/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: student.id,
          action: "enable",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to enable student portal access."
        );
      }

      setPortalCredentials({
        studentName: studentName(student),
        loginId: data.credentials.loginId,
        temporaryPassword: data.credentials.temporaryPassword,
      });

      setMessage("Student Portal access enabled successfully.");
      await loadStudents();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to enable student portal access."
      );
    } finally {
      setEnablingPortal(null);
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
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              <span aria-hidden="true">←</span>
              Back to Dashboard
            </Link>

            <div className="mt-5">
              <p className="text-sm font-semibold text-primary">
                Student Management
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                Students
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Register, search, manage, and monitor students in your school.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((value) => !value)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md"
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

        {portalCredentials && (
          <section className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Student Portal Credentials
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Portal access has been enabled for{" "}
                  <span className="font-semibold text-foreground">
                    {portalCredentials.studentName}
                  </span>
                  .
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Save these credentials securely. The temporary password will
                  not be shown again after this message is closed.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPortalCredentials(null)}
                className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Login ID
                </p>
                <p className="mt-2 break-all font-mono text-lg font-bold">
                  {portalCredentials.loginId}
                </p>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Temporary Password
                </p>
                <p className="mt-2 break-all font-mono text-lg font-bold">
                  {portalCredentials.temporaryPassword}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Give these credentials to the student securely. The student
              should change the temporary password after signing in.
            </p>
          </section>
        )}

        <section className="mb-8">
          <div>
            <p className="text-sm font-semibold text-primary">
              At a glance
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Student overview
            </h2>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                label: "Total Students",
                count: counts.total,
                icon: Users,
                tone: "bg-primary/10 text-primary",
              },
              {
                label: "Active",
                count: counts.active,
                icon: UserCheck,
                tone: "bg-success/10 text-success",
              },
              {
                label: "Inactive",
                count: counts.inactive,
                icon: UserRoundX,
                tone: "bg-muted text-muted-foreground",
              },
              {
                label: "Graduated",
                count: counts.graduated,
                icon: GraduationCap,
                tone: "bg-accent/10 text-accent",
              },
              {
                label: "Withdrawn",
                count: counts.withdrawn,
                icon: UserMinus,
                tone: "bg-destructive/10 text-destructive",
              },
            ].map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="group rounded-2xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {card.label}
                      </p>
                      <p className="mt-2 text-3xl font-bold tracking-tight">
                        {card.count}
                      </p>
                    </div>

                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.tone}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {showAddForm && (
          <section className="mb-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b bg-muted/20 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-primary">
                    Student Registration
                  </p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight">
                    Add Student
                  </h2>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    Create a real student record in your school database.
                  </p>
                </div>
              </div>
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
                    className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                    className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                    className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Last Name
                  </label>
                  <input
                    name="lastName"
                    required
                    className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Other Name
                  </label>
                  <input
                    name="otherName"
                    className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Gender
                  </label>
                  <select
                    name="gender"
                    defaultValue=""
                    className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                    className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Phone
                  </label>
                  <input
                    name="phone"
                    className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue="active"
                    className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="graduated">Graduated</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>

                <div className="border-t pt-5 sm:col-span-2 lg:col-span-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      Required fields are marked by the browser.
                    </p>

                    <button
                      type="submit"
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md sm:w-auto"
                    >
                      Add Student
                    </button>
                  </div>
                </div>
              </form>
            )}
          </section>
        )}

        {editingStudent && (
          <section className="mb-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b bg-muted/20 px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <GraduationCap className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-primary">
                      Student Management
                    </p>
                    <h2 className="mt-1 text-xl font-bold tracking-tight">
                      Edit Student
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      Update the student information and status.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeEdit}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border bg-background px-3.5 py-2 text-sm font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  Close
                </button>
              </div>
            </div>

            <form
              onSubmit={handleEditSubmit}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Admission Number
                </label>
                <input
                  value={editForm.admissionNumber}
                  onChange={(event) =>
                    setEditForm((form) => ({
                      ...form,
                      admissionNumber: event.target.value,
                    }))
                  }
                  required
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Class
                </label>
                <select
                  value={editForm.classId}
                  onChange={(event) =>
                    setEditForm((form) => ({
                      ...form,
                      classId: event.target.value,
                    }))
                  }
                  required
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="" disabled>Select class</option>
                  {classes.map((schoolClass) => (
                    <option key={schoolClass.id} value={schoolClass.id}>
                      {schoolClass.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">First Name</label>
                <input
                  value={editForm.firstName}
                  onChange={(event) =>
                    setEditForm((form) => ({ ...form, firstName: event.target.value }))
                  }
                  required
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Last Name</label>
                <input
                  value={editForm.lastName}
                  onChange={(event) =>
                    setEditForm((form) => ({ ...form, lastName: event.target.value }))
                  }
                  required
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Other Name</label>
                <input
                  value={editForm.otherName}
                  onChange={(event) =>
                    setEditForm((form) => ({ ...form, otherName: event.target.value }))
                  }
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Gender</label>
                <select
                  value={editForm.gender}
                  onChange={(event) =>
                    setEditForm((form) => ({ ...form, gender: event.target.value }))
                  }
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Date of Birth</label>
                <input
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(event) =>
                    setEditForm((form) => ({ ...form, dateOfBirth: event.target.value }))
                  }
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(event) =>
                    setEditForm((form) => ({ ...form, email: event.target.value }))
                  }
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Phone</label>
                <input
                  value={editForm.phone}
                  onChange={(event) =>
                    setEditForm((form) => ({ ...form, phone: event.target.value }))
                  }
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Status</label>
                <select
                  value={editForm.status}
                  onChange={(event) =>
                    setEditForm((form) => ({ ...form, status: event.target.value }))
                  }
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>

              <div className="border-t pt-5 sm:col-span-2 lg:col-span-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border bg-background px-6 py-3 text-sm font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary sm:w-auto"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md sm:w-auto"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </section>
        )}

        <section className="mb-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Find students</h2>
                <p className="text-xs text-muted-foreground">
                  Search and filter your student records
                </p>
              </div>
            </div>

            {(search || classFilter || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setClassFilter("");
                  setStatusFilter("");
                }}
                className="mt-2 text-left text-sm font-semibold text-primary transition-colors hover:text-primary-hover sm:mt-0"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px_220px]">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name or admission number..."
                  className="min-h-11 w-full rounded-xl border bg-background pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Class
              </label>
              <select
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
                className="min-h-11 w-full rounded-xl border bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="min-h-11 w-full rounded-xl border bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-lg font-bold tracking-tight">
                    School Students
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Showing{" "}
                    <span className="font-semibold text-foreground">
                      {filteredStudents.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-foreground">
                      {students.length}
                    </span>{" "}
                    students
                  </p>
                </div>
              </div>

              {(search || classFilter || statusFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setClassFilter("");
                    setStatusFilter("");
                  }}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2 text-sm font-semibold text-primary transition-all hover:border-primary/30 hover:bg-primary/10"
                >
                  Clear filters
                </button>
              )}
            </div>
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
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Student
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Admission No.
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Class
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Gender
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Portal
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="group transition-colors hover:bg-muted/20"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/10">
                            {student.first_name.charAt(0)}
                            {student.last_name.charAt(0)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {studentName(student)}
                            </p>

                            {student.email && (
                              <p className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">
                                {student.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="font-mono text-xs font-semibold">
                          {student.admission_number}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span className="font-medium">
                          {student.class_name ?? "Not assigned"}
                        </span>
                      </td>

                      <td className="px-6 py-5 capitalize text-muted-foreground">
                        {student.gender || "—"}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(
                            student.status
                          )}`}
                        >
                          {student.status}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        {student.portal_enabled ? (
                          <div>
                            <span className="inline-flex rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                              Enabled
                            </span>

                            {student.login_id && (
                              <p className="mt-1 font-mono text-xs text-muted-foreground">
                                {student.login_id}
                              </p>
                            )}
                          </div>
                        ) : student.status === "active" ? (
                          <button
                            type="button"
                            onClick={() => enablePortal(student)}
                            disabled={enablingPortal === student.id}
                            className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition-all hover:border-primary/40 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {enablingPortal === student.id
                              ? "Enabling..."
                              : "Enable Portal"}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Not available
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/dashboard/students/${student.id}`}
                            className="rounded-lg border bg-background px-3 py-2 text-xs font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                          >
                            View
                          </Link>

                          <button
                            type="button"
                            onClick={() => openEdit(student)}
                            className="rounded-lg border bg-background px-3 py-2 text-xs font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                          >
                            Edit
                          </button>

                          {student.status === "active" && (
                            <button
                              type="button"
                              onClick={() => deactivateStudent(student)}
                              className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive transition-all hover:bg-destructive/10"
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
