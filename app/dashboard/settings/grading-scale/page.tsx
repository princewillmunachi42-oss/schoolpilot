"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import {
  DEFAULT_GRADING_SCALE,
  validateGradingScale,
  type GradeBand,
} from "@/lib/academics/grading";

export default function GradingScalePage() {
  const [bands, setBands] = useState<GradeBand[]>(DEFAULT_GRADING_SCALE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadScale() {
      try {
        const response = await fetch("/api/school/grading-scale", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load grading scale.");
        }

        setBands(
          validateGradingScale(data.grading_scale ?? DEFAULT_GRADING_SCALE),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load grading scale.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadScale();
  }, []);

  function updateBand(index: number, field: keyof GradeBand, value: string) {
    setBands((current) =>
      current.map((band, i) =>
        i === index
          ? {
              ...band,
              [field]:
                field === "min_score" || field === "max_score"
                  ? value === ""
                    ? ""
                    : Number(value)
                  : value,
            }
          : band,
      ),
    );
    setError("");
    setSuccess("");
  }

  function addBand() {
    if (bands.length >= 12) {
      setError("You can configure a maximum of 12 grade bands.");
      return;
    }

    setError("");
    setSuccess("");
    setBands((current) => [
      ...current,
      { grade: "", min_score: 0, max_score: 0, remarks: "" },
    ]);
  }

  function removeBand(index: number) {
    if (bands.length <= 2) {
      setError("At least two grade bands are required.");
      return;
    }

    setError("");
    setSuccess("");
    setBands((current) => current.filter((_, i) => i !== index));
  }

  async function saveScale() {
    setError("");
    setSuccess("");

    let normalized: GradeBand[];

    try {
      normalized = validateGradingScale(
        bands.map((band) => ({
          grade: band.grade.trim().toUpperCase(),
          min_score: Number(band.min_score),
          max_score: Number(band.max_score),
          remarks: band.remarks.trim(),
        })),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Please check your grade ranges.",
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/school/grading-scale", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grading_scale: normalized }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save grading scale.");
      }

      setBands(validateGradingScale(data.grading_scale));
      setSuccess("Grading scale saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save grading scale.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to School Settings
          </Link>

          <p className="mt-6 text-sm font-medium text-primary">
            Academic Configuration
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Grading Scale
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Set the minimum and maximum score for every grade. New and updated
            results use these ranges. Existing saved grades and published report
            cards are not recalculated when this scale changes.
          </p>
        </header>

        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-5 sm:p-6">
            <h2 className="font-semibold">Grade ranges</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ranges must cover scores from 0 to 100 without overlaps or gaps.
              Since scores can contain decimals, a range ending at 89 should
              normally end at 89.99 when the next range starts at 90.
            </p>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading grading scale...
              </p>
            ) : (
              <>
                <div className="hidden grid-cols-[1fr_120px_120px_1.3fr_44px] gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
                  <span>Grade</span>
                  <span>Minimum</span>
                  <span>Maximum</span>
                  <span>Remarks</span>
                  <span />
                </div>

                {bands.map((band, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1fr_120px_120px_1.3fr_44px] sm:items-center sm:border-0 sm:p-0"
                  >
                    <div>
                      <label
                        htmlFor={`grade-${index}`}
                        className="mb-1 block text-xs font-medium text-muted-foreground sm:hidden"
                      >
                        Grade
                      </label>
                      <input
                        id={`grade-${index}`}
                        value={band.grade}
                        maxLength={10}
                        onChange={(event) =>
                          updateBand(index, "grade", event.target.value)
                        }
                        placeholder="e.g. A or BE"
                        className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`minimum-${index}`}
                        className="mb-1 block text-xs font-medium text-muted-foreground sm:hidden"
                      >
                        Minimum score
                      </label>
                      <input
                        id={`minimum-${index}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={band.min_score}
                        onChange={(event) =>
                          updateBand(index, "min_score", event.target.value)
                        }
                        className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`maximum-${index}`}
                        className="mb-1 block text-xs font-medium text-muted-foreground sm:hidden"
                      >
                        Maximum score
                      </label>
                      <input
                        id={`maximum-${index}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={band.max_score}
                        onChange={(event) =>
                          updateBand(index, "max_score", event.target.value)
                        }
                        className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`remarks-${index}`}
                        className="mb-1 block text-xs font-medium text-muted-foreground sm:hidden"
                      >
                        Remarks
                      </label>
                      <input
                        id={`remarks-${index}`}
                        value={band.remarks}
                        maxLength={100}
                        onChange={(event) =>
                          updateBand(index, "remarks", event.target.value)
                        }
                        placeholder="e.g. Excellent"
                        className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeBand(index)}
                      aria-label={`Remove grade band ${band.grade || index + 1}`}
                      className="flex h-10 w-full items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted sm:w-11"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={addBand}
                    disabled={bands.length >= 12}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add grade band
                  </button>

                  <button
                    type="button"
                    onClick={saveScale}
                    disabled={saving || loading}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save grading scale"}
                  </button>
                </div>
              </>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            {success && (
              <p
                role="status"
                className="rounded-xl border border-success/20 bg-success/5 p-3 text-sm text-success"
              >
                {success}
              </p>
            )}
          </div>
        </section>

        <p className="text-sm text-muted-foreground">
          Score components remain unchanged: CA is out of 40 and the exam is out
          of 60, for a total of 100.
        </p>
      </div>
    </main>
  );
}
