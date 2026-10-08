"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  MapPin,
  Printer,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Power,
  PowerOff,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

type Station = {
  id: string;
  stationName: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

type StationResponse = {
  success: boolean;
  stations?: Station[];
  message?: string;
};

export default function StaffAttendanceQrPage() {
  const [station, setStation] = useState<Station | null>(null);
  const [token, setToken] = useState("");
  const [tokenUnavailable, setTokenUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showRegenerateWarning, setShowRegenerateWarning] =
    useState(false);

  async function loadStation() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/school/staff-attendance/station",
        {
          cache: "no-store",
        }
      );

      const data: StationResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load attendance QR."
        );
      }

      setStation(data.stations?.[0] ?? null);
      setTokenUnavailable(Boolean(data.stations?.[0]));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load attendance QR."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStation();
  }, []);

  async function generateQr() {
    setWorking(true);
    setError("");
    setMessage("");
    setToken("");
    setCopied(false);

    try {
      const response = await fetch(
        "/api/school/staff-attendance/station",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stationName: "Main Entrance",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to generate attendance QR."
        );
      }

      setStation(data.station);
      setToken(data.station.token);
      setTokenUnavailable(false);
      setMessage(
        data.regenerated
          ? "A new QR has been generated. The previous QR is now invalid."
          : "Attendance QR generated successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate attendance QR."
      );
    } finally {
      setWorking(false);
    }
  }

  async function updateStation(
    action: "activate" | "deactivate" | "regenerate"
  ) {
    if (!station) return;

    setWorking(true);
    setError("");
    setMessage("");
    setToken("");
    setCopied(false);

    try {
      const response = await fetch(
        "/api/school/staff-attendance/station",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stationId: station.id,
            action,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to update attendance QR."
        );
      }

      setStation(data.station);

      if (data.station.token) {
        setToken(data.station.token);
      setTokenUnavailable(false);
      }

      setMessage(data.message);
      setShowRegenerateWarning(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update attendance QR."
      );
    } finally {
      setWorking(false);
    }
  }

  function getQrUrl() {
    if (!token) return "";

    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/teacher/staff-attendance/scan?s=${token}`;
  }

  async function copyQrUrl() {
    const url = getQrUrl();

    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setError(
        "Unable to copy the QR link."
      );
    }
  }

  function printQr() {
    window.print();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[55vh] max-w-5xl items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading attendance QR...
          </div>
        </div>
      </main>
    );
  }

  const qrUrl = getQrUrl();
  const hasActiveToken = Boolean(token);
  const stationActive =
    station?.status === "active";

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-5xl space-y-6 print:max-w-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <Link
            href="/dashboard/staff-attendance"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Staff Attendance
          </Link>

          <Link
            href="/dashboard/staff-attendance/settings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover"
          >
            <MapPin className="h-4 w-4" />
            Location settings
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl border bg-card shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <div className="border-b px-5 py-6 sm:px-7 print:hidden">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <QrCode className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-semibold text-primary">
                  Staff Attendance
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  Attendance QR station
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Create and manage the permanent QR code
                  staff will scan at the school entrance.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_360px]">
            <div className="space-y-5 print:hidden">
              {message && (
                <div className="flex items-start gap-3 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="rounded-2xl border bg-background/50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Station
                    </p>

                    <h2 className="mt-1 text-lg font-bold">
                      {station?.stationName ||
                        "Main Entrance"}
                    </h2>
                  </div>

                  {station && (
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        stationActive
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          stationActive
                            ? "bg-success"
                            : "bg-muted-foreground"
                        }`}
                      />
                      {stationActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  {!station ? (
                    <button
                      type="button"
                      onClick={generateQr}
                      disabled={working}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {working ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <QrCode className="h-4 w-4" />
                      )}
                      Generate attendance QR
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setShowRegenerateWarning(
                            true
                          )
                        }
                        disabled={working}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {working ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Generate new QR
                      </button>

                      {stationActive ? (
                        <button
                          type="button"
                          onClick={() =>
                            updateStation(
                              "deactivate"
                            )
                          }
                          disabled={working}
                          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <PowerOff className="h-4 w-4" />
                          Deactivate QR
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            updateStation(
                              "activate"
                            )
                          }
                          disabled={working}
                          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Power className="h-4 w-4" />
                          Activate QR
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {showRegenerateWarning && (
                <div className="rounded-2xl border border-warning/30 bg-warning/10 p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />

                    <div>
                      <h3 className="font-semibold">
                        Generate a new QR?
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        The current printed QR will stop
                        working immediately. You will need
                        to print and display the new QR.
                      </p>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() =>
                            updateStation(
                              "regenerate"
                            )
                          }
                          disabled={working}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-warning px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                        >
                          {working && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          Yes, generate new QR
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setShowRegenerateWarning(
                              false
                            )
                          }
                          className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {hasActiveToken && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                    <div>
                      <h3 className="font-semibold">
                        New QR generated
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        This QR is ready to print. Keep the
                        printed code at the school entrance.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={printQr}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
                    >
                      <Printer className="h-4 w-4" />
                      Print QR
                    </button>

                    <button
                      type="button"
                      onClick={copyQrUrl}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold hover:bg-muted"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied
                        ? "Copied"
                        : "Copy QR link"}
                    </button>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border bg-background/50 p-5">
                <h3 className="font-semibold">
                  Security
                </h3>

                <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                  <li>
                    • The QR does not contain a staff ID.
                  </li>
                  <li>
                    • The server stores only a secure token
                    hash.
                  </li>
                  <li>
                    • Staff must be authenticated before
                    attendance is recorded.
                  </li>
                  <li>
                    • Geofencing verifies the staff member is
                    at the school.
                  </li>
                  <li>
                    • Regenerating the QR immediately
                    invalidates the previous one.
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-3xl border bg-white p-6 text-slate-900 shadow-sm print:border-0 print:shadow-none">
              {hasActiveToken ? (
                <>
                  <div className="rounded-2xl border bg-white p-5">
                    <QRCodeSVG
                      value={qrUrl}
                      size={280}
                      level="H"
                      includeMargin
                    />
                  </div>

                  <h2 className="mt-5 text-center text-xl font-bold">
                    Staff Attendance
                  </h2>

                  <p className="mt-1 text-center text-sm font-medium text-slate-600">
                    Scan at the Main Entrance
                  </p>

                  <p className="mt-4 max-w-xs text-center text-xs leading-5 text-slate-500">
                    Staff must sign in and allow location
                    access before clocking in or out.
                  </p>

                  <div className="mt-5 hidden print:block">
                    <p className="text-center text-xs text-slate-500">
                      Scan this QR code to open staff
                      attendance.
                    </p>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <QrCode className="h-8 w-8" />
                  </div>

                  <h2 className="mt-4 font-bold text-slate-900">
                    {tokenUnavailable ? "QR needs to be regenerated" : "No QR generated"}
                  </h2>

                  <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                    This station is already registered, but its secure token cannot be recovered after a page reload. Generate a new QR to issue a printable code.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }

          body {
            background: white !important;
          }
        }
      `}</style>
    </main>
  );
}
