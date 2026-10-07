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
        className="inline-flex min-h-10 items-center justify-center rounded-xl border bg-background px-3.5 py-2 text-sm font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border bg-card shadow-2xl">
            <div className="border-b bg-muted/20 px-5 py-5 sm:px-6">
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
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border bg-background px-3.5 py-2 text-sm font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  Close
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSave}
              className="grid gap-4 p-5 sm:p-6"
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
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border bg-background px-4 py-2.5 text-sm font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
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
