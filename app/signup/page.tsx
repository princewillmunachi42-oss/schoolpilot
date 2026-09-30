"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    schoolName: "",
    schoolEmail: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: string, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Unable to create your account.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-xl">
        <div className="mb-10 text-center">
          <a href="/" className="text-2xl font-bold">
            SchoolPilot
          </a>

          <h1 className="mt-8 text-3xl font-bold">
            Create your school account
          </h1>

          <p className="mt-2 text-muted-foreground">
            Set up your school and administrator account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border p-6 shadow-sm"
        >
          <section>
            <h2 className="text-lg font-semibold">
              School information
            </h2>

            <div className="mt-4 space-y-4">
              <input
                required
                placeholder="School name"
                value={form.schoolName}
                onChange={(e) =>
                  updateField("schoolName", e.target.value)
                }
                className="w-full rounded-lg border bg-transparent px-4 py-3 outline-none focus:ring-2"
              />

              <input
                required
                type="email"
                placeholder="School email"
                value={form.schoolEmail}
                onChange={(e) =>
                  updateField("schoolEmail", e.target.value)
                }
                className="w-full rounded-lg border bg-transparent px-4 py-3 outline-none focus:ring-2"
              />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold">
              Owner information
            </h2>

            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  required
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(e) =>
                    updateField("firstName", e.target.value)
                  }
                  className="w-full rounded-lg border bg-transparent px-4 py-3 outline-none focus:ring-2"
                />

                <input
                  required
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(e) =>
                    updateField("lastName", e.target.value)
                  }
                  className="w-full rounded-lg border bg-transparent px-4 py-3 outline-none focus:ring-2"
                />
              </div>

              <input
                required
                type="email"
                placeholder="Your email"
                value={form.email}
                onChange={(e) =>
                  updateField("email", e.target.value)
                }
                className="w-full rounded-lg border bg-transparent px-4 py-3 outline-none focus:ring-2"
              />

              <input
                required
                type="password"
                minLength={8}
                placeholder="Password (minimum 8 characters)"
                value={form.password}
                onChange={(e) =>
                  updateField("password", e.target.value)
                }
                className="w-full rounded-lg border bg-transparent px-4 py-3 outline-none focus:ring-2"
              />
            </div>
          </section>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-foreground px-4 py-3 font-semibold text-background disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create school account"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-foreground">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
