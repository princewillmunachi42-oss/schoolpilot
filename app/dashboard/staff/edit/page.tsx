"use client";

import { FormEvent, useEffect, useState } from "react";

type StaffData = {
  id: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  other_name: string | null;
  email: string | null;
  phone: string | null;
  role_title: string | null;
  status: "active" | "inactive";
};

export default function EditStaffPage() {
  const [id, setId] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffData | null>(null);

  const [staffId, setStaffId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [otherName, setOtherName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [status, setStatus] =
    useState<"active" | "inactive">("active");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const staffMemberId = params.get("id");

    if (!staffMemberId) {
      setMessage("Staff member ID is missing.");
      setLoading(false);
      return;
    }

    setId(staffMemberId);

    async function loadStaff() {
      try {
        const response = await fetch(
          `/api/school/staff/${encodeURIComponent(staffMemberId ?? "")}`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Unable to load staff member."
          );
        }

        const loadedStaff = result.staff as StaffData;

        setStaff(loadedStaff);
        setStaffId(loadedStaff.staff_id);
        setFirstName(loadedStaff.first_name);
        setLastName(loadedStaff.last_name);
        setOtherName(loadedStaff.other_name ?? "");
        setEmail(loadedStaff.email ?? "");
        setPhone(loadedStaff.phone ?? "");
        setRoleTitle(loadedStaff.role_title ?? "");
        setStatus(loadedStaff.status);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load staff member."
        );
      } finally {
        setLoading(false);
      }
    }

    loadStaff();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!id) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/school/staff", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          staffId,
          firstName,
          lastName,
          otherName,
          email,
          phone,
          roleTitle,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to update staff member."
        );
      }

      window.location.href = "/dashboard/staff";
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update staff member."
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-muted-foreground">
          Loading staff member...
        </p>
      </main>
    );
  }

  if (!staff) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <a
          href="/dashboard/staff"
          className="text-sm font-semibold underline"
        >
          ← Back to Staff
        </a>

        <div className="mt-6 rounded-2xl border p-6">
          <p className="text-sm text-destructive">
            {message || "Staff member not found."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <a
          href="/dashboard/staff"
          className="text-sm font-semibold underline"
        >
          ← Back to Staff
        </a>

        <h1 className="mt-4 text-2xl font-bold">
          Edit Staff Member
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Update this staff member's information.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border bg-card p-6 shadow-sm"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="staffId"
              className="mb-2 block text-sm font-semibold"
            >
              Staff ID
            </label>

            <input
              id="staffId"
              value={staffId}
              onChange={(event) =>
                setStaffId(event.target.value.toUpperCase())
              }
              required
              className="w-full rounded-lg border bg-background px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="roleTitle"
              className="mb-2 block text-sm font-semibold"
            >
              Role / Job Title
            </label>

            <input
              id="roleTitle"
              value={roleTitle}
              onChange={(event) =>
                setRoleTitle(event.target.value)
              }
              placeholder="e.g. Mathematics Teacher"
              className="w-full rounded-lg border bg-background px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="firstName"
              className="mb-2 block text-sm font-semibold"
            >
              First Name
            </label>

            <input
              id="firstName"
              value={firstName}
              onChange={(event) =>
                setFirstName(event.target.value)
              }
              required
              className="w-full rounded-lg border bg-background px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="mb-2 block text-sm font-semibold"
            >
              Last Name
            </label>

            <input
              id="lastName"
              value={lastName}
              onChange={(event) =>
                setLastName(event.target.value)
              }
              required
              className="w-full rounded-lg border bg-background px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="otherName"
              className="mb-2 block text-sm font-semibold"
            >
              Other Name
            </label>

            <input
              id="otherName"
              value={otherName}
              onChange={(event) =>
                setOtherName(event.target.value)
              }
              className="w-full rounded-lg border bg-background px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="w-full rounded-lg border bg-background px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-semibold"
            >
              Phone
            </label>

            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              className="w-full rounded-lg border bg-background px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-semibold"
            >
              Status
            </label>

            <select
              id="status"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as "active" | "inactive"
                )
              }
              className="w-full rounded-lg border bg-background px-3 py-2"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {message && (
          <p className="mt-5 text-sm text-destructive">
            {message}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <a
            href="/dashboard/staff"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted"
          >
            Cancel
          </a>
        </div>
      </form>
    </main>
  );
}
