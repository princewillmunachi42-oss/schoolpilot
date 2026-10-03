"use client";

import { useState } from "react";

type Parent = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
};

type EditParentButtonProps = {
  parent: Parent;
};

export default function EditParentButton({
  parent,
}: EditParentButtonProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState(parent.full_name);
  const [email, setEmail] = useState(parent.email ?? "");
  const [phone, setPhone] = useState(parent.phone ?? "");
  const [address, setAddress] = useState(parent.address ?? "");
  const [status, setStatus] = useState(parent.status);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);

    try {
      const response = await fetch("/api/school/parents", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentId: parent.id,
          fullName,
          email,
          phone,
          address,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        window.alert(data.message || "Unable to update parent.");
        return;
      }

      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Update parent request failed:", error);
      window.alert("Unable to update parent.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted"
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  Edit Parent
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Update this parent or guardian's information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="mt-6 grid gap-4"
            >
              <div>
                <label
                  htmlFor={`edit-name-${parent.id}`}
                  className="mb-2 block text-sm font-medium"
                >
                  Full Name
                </label>

                <input
                  id={`edit-name-${parent.id}`}
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  required
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor={`edit-email-${parent.id}`}
                  className="mb-2 block text-sm font-medium"
                >
                  Email
                </label>

                <input
                  id={`edit-email-${parent.id}`}
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor={`edit-phone-${parent.id}`}
                  className="mb-2 block text-sm font-medium"
                >
                  Phone
                </label>

                <input
                  id={`edit-phone-${parent.id}`}
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor={`edit-address-${parent.id}`}
                  className="mb-2 block text-sm font-medium"
                >
                  Address
                </label>

                <textarea
                  id={`edit-address-${parent.id}`}
                  value={address}
                  onChange={(event) =>
                    setAddress(event.target.value)
                  }
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor={`edit-status-${parent.id}`}
                  className="mb-2 block text-sm font-medium"
                >
                  Status
                </label>

                <select
                  id={`edit-status-${parent.id}`}
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value)
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
