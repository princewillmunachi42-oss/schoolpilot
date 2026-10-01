"use client";

import { FormEvent, useState } from "react";

type StudentProfileEditorProps = {
  studentId: string;
  firstName: string;
  lastName: string;
  otherName: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  phone: string;
};

export default function StudentProfileEditor({
  studentId,
  firstName,
  lastName,
  otherName,
  gender,
  dateOfBirth,
  email,
  phone,
}: StudentProfileEditorProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    first_name: firstName,
    last_name: lastName,
    other_name: otherName,
    gender,
    date_of_birth: dateOfBirth,
    email,
    phone,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
     const [photo, setPhoto] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
         if (photo) {
      setUploadingPhoto(true);

      try {
        const photoData = new FormData();
        photoData.append("student_id", studentId);
        photoData.append("photo", photo);

        const photoResponse = await fetch(
          "/api/school/students/photo",
          {
            method: "POST",
            body: photoData,
          },
        );

        const photoResult = await photoResponse.json();

        if (!photoResponse.ok) {
          throw new Error(
            photoResult.message || "Failed to upload student photo.",
          );
        }
      } finally {
        setUploadingPhoto(false);
      }
    }
    try {
      const response = await fetch("/api/school/students", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: studentId,
          ...form,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update student profile.");
      }

      setMessage("Profile updated successfully.");
      setOpen(false);
      window.location.reload();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update student profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          setMessage("");
        }}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        {open ? "Cancel Edit" : "Edit Profile"}
      </button>

      {message && (
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      )}

      {open && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-xl border bg-background p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
           <div className="sm:col-span-2">
  <label className="text-sm font-medium">
    Student Photo
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      onChange={(event) => {
        setPhoto(event.target.files?.[0] ?? null);
      }}
      className="mt-1 block w-full rounded-lg border bg-background px-3 py-2 text-sm"
    />
  </label>

  <p className="mt-1 text-xs text-muted-foreground">
    JPG, PNG, or WebP. Maximum 5 MB.
  </p>
</div>
            <label className="text-sm font-medium">
              First Name
              <input
                value={form.first_name}
                onChange={(event) =>
                  setForm({ ...form, first_name: event.target.value })
                }
                required
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="text-sm font-medium">
              Last Name
              <input
                value={form.last_name}
                onChange={(event) =>
                  setForm({ ...form, last_name: event.target.value })
                }
                required
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="text-sm font-medium">
              Other Name
              <input
                value={form.other_name}
                onChange={(event) =>
                  setForm({ ...form, other_name: event.target.value })
                }
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="text-sm font-medium">
              Gender
              <select
                value={form.gender}
                onChange={(event) =>
                  setForm({ ...form, gender: event.target.value })
                }
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Not specified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>

            <label className="text-sm font-medium">
              Date of Birth
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(event) =>
                  setForm({ ...form, date_of_birth: event.target.value })
                }
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="text-sm font-medium">
              Phone
              <input
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="text-sm font-medium sm:col-span-2">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
