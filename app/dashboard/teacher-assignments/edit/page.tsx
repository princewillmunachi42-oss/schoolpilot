"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Staff = {
  id: string;
  first_name: string;
  last_name: string;
  staff_id: string;
};

type ClassItem = {
  id: string;
  name: string;
};

type Subject = {
  id: string;
  name: string;
  code: string;
};

type Assignment = {
  id: string;
  staff_id: string;
  class_id?: string | null;
  subject_id?: string | null;
  is_primary?: boolean;
};

export default function EditTeacherAssignmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const type = searchParams.get("type");

  const [staff, setStaff] = useState<Staff[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);

  const [staffId, setStaffId] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || !type || !["class", "subject"].includes(type)) {
      setError("Invalid assignment.");
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
                  if (!id || !type) {
          throw new Error("Invalid assignment.");
        }
        const [assignmentResponse, staffResponse, classesResponse, subjectsResponse] =
          await Promise.all([
            fetch(
              `/api/school/teacher-assignments/${encodeURIComponent(
                id
              )}?type=${encodeURIComponent(type)}`
            ),
            fetch("/api/school/staff"),
            fetch("/api/school/classes"),
            fetch("/api/school/subjects"),
          ]);

        const assignmentData = await assignmentResponse.json();
        const staffData = await staffResponse.json();
        const classesData = await classesResponse.json();
        const subjectsData = await subjectsResponse.json();

        if (!assignmentResponse.ok) {
          throw new Error(
            assignmentData.message || "Unable to load assignment."
          );
        }

        if (!staffResponse.ok) {
          throw new Error(
            staffData.message || "Unable to load staff."
          );
        }

        if (!classesResponse.ok) {
          throw new Error(
            classesData.message || "Unable to load classes."
          );
        }

        if (!subjectsResponse.ok) {
          throw new Error(
            subjectsData.message || "Unable to load subjects."
          );
        }

        const loadedAssignment = assignmentData.assignment;

        setAssignment(loadedAssignment);
        setStaff(staffData.staff || staffData);
        setClasses(classesData.classes || classesData);
        setSubjects(subjectsData.subjects || subjectsData);

        setStaffId(loadedAssignment.staff_id);
        setClassId(loadedAssignment.class_id || "");
        setSubjectId(loadedAssignment.subject_id || "");
        setIsPrimary(Boolean(loadedAssignment.is_primary));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load assignment."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, type]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!id || !type) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        "/api/school/teacher-assignments",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            assignmentType: type,
            staffId,
            classId: classId || null,
            subjectId: subjectId || null,
            isPrimary,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update assignment."
        );
      }

      router.push("/dashboard/teacher-assignments");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update assignment."
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="p-6">
        <p>Loading assignment...</p>
      </main>
    );
  }

  if (error && !assignment) {
    return (
      <main className="p-6">
        <div className="max-w-xl rounded-xl border p-6">
          <h1 className="text-xl font-semibold">
            Unable to edit assignment
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/dashboard/teacher-assignments")
            }
            className="mt-6 rounded-lg border px-4 py-2 font-medium"
          >
            Back to Teacher Assignments
          </button>
        </div>
      </main>
    );
  }

  const isClassAssignment = type === "class";

  return (
    <main className="p-6">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() =>
            router.push("/dashboard/teacher-assignments")
          }
          className="mb-6 rounded-lg border px-4 py-2 text-sm font-medium"
        >
          ← Back
        </button>

        <div className="rounded-xl border p-6">
          <h1 className="text-2xl font-bold">
            Edit {isClassAssignment ? "Class Teacher" : "Subject Teacher"} Assignment
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Update the teacher assignment below.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/30 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-medium">
                Teacher
              </label>

              <select
                value={staffId}
                onChange={(event) =>
                  setStaffId(event.target.value)
                }
                required
                className="w-full rounded-lg border bg-background px-3 py-2"
              >
                <option value="">Select teacher</option>

                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.first_name} {member.last_name} (
                    {member.staff_id})
                  </option>
                ))}
              </select>
            </div>

            {isClassAssignment ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Class
                  </label>

                  <select
                    value={classId}
                    onChange={(event) =>
                      setClassId(event.target.value)
                    }
                    required
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  >
                    <option value="">Select class</option>

                    {classes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(event) =>
                      setIsPrimary(event.target.checked)
                    }
                  />
                  Primary class teacher
                </label>
              </>
            ) : (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Subject
                  </label>

                  <select
                    value={subjectId}
                    onChange={(event) =>
                      setSubjectId(event.target.value)
                    }
                    required
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  >
                    <option value="">Select subject</option>

                    {subjects.map((subject) => (
                      <option
                        key={subject.id}
                        value={subject.id}
                      >
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Class
                  </label>

                  <select
                    value={classId}
                    onChange={(event) =>
                      setClassId(event.target.value)
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  >
                    <option value="">
                      All classes / no specific class
                    </option>

                    {classes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-5 py-2 font-semibold text-primary-foreground disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push("/dashboard/teacher-assignments")
                }
                className="rounded-lg border px-5 py-2 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
