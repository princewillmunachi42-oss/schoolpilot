"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Crosshair,
  LogIn,
  LogOut,
  Loader2,
  MapPin,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

type TodayAttendance = {
  id: string;
  clockInAt: string | null;
  clockOutAt: string | null;
  status: "present" | "late";
  lateMinutes: number;
};

type StaffStatus = {
  success: boolean;
  staff: {
    id: string;
    staffNumber: string;
    firstName: string;
    lastName: string;
    otherName: string | null;
    roleTitle: string | null;
  };
  timezone: string;
  settings: {
    clockInTime: string | null;
    clockOutTime: string | null;
    lateGraceMinutes: number;
  };
  today: TodayAttendance | null;
  message?: string;
};

type LocationState = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

function formatTime(value: string | null, timezone: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function StaffAttendanceScanPage() {
  const searchParams = useSearchParams();

  const stationToken = searchParams.get("s") || "";

  const [data, setData] = useState<StaffStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<LocationState | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadStatus() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/teacher/staff-attendance/status",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load your attendance status."
        );
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your attendance status."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  const action = useMemo(() => {
    if (!data?.today?.clockInAt) return "clock_in";
    if (!data.today.clockOutAt) return "clock_out";
    return "completed";
  }, [data]);

  function requestLocation() {
    setLocationMessage("");
    setError("");

    if (!navigator.geolocation) {
      setError(
        "Location services are not supported by this browser."
      );
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        setLocationMessage(
          `Location detected with approximately ${Math.round(
            position.coords.accuracy
          )}m accuracy.`
        );

        setLocating(false);
      },
      (geoError) => {
        let message =
          "Unable to determine your location. Please try again.";

        if (geoError.code === geoError.PERMISSION_DENIED) {
          message =
            "Location permission was denied. Allow location access in your browser settings to continue.";
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          message =
            "Your current location is unavailable. Make sure location services are enabled.";
        } else if (geoError.code === geoError.TIMEOUT) {
          message =
            "Location detection timed out. Please try again.";
        }

        setError(message);
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  async function handleAttendanceAction() {
    if (
      !stationToken ||
      action === "completed" ||
      !location
    ) {
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/teacher/staff-attendance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stationToken,
            action,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to record attendance."
        );
      }

      setSuccess(
        action === "clock_in"
          ? "Your clock-in has been recorded successfully."
          : "Your clock-out has been recorded successfully."
      );

      await loadStatus();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to record attendance."
      );
    } finally {
      setProcessing(false);
    }
  }

  const fullName = data
    ? [
        data.staff.firstName,
        data.staff.otherName,
        data.staff.lastName,
      ]
        .filter(Boolean)
        .join(" ")
    : "Staff member";

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-xl">
        <Link
          href="/teacher"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Teacher Dashboard
        </Link>

        <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="border-b bg-primary/5 px-6 py-7 text-center sm:px-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <p className="mt-4 text-sm font-semibold text-primary">
              Staff Attendance
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Secure attendance check-in
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Your signed-in staff account and current location are
              verified before attendance is recorded.
            </p>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            {loading ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />

                <p className="mt-4 font-semibold">
                  Verifying your attendance status...
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Please wait a moment.
                </p>
              </div>
            ) : error && !data ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-5">
                <div className="flex items-start gap-3 text-destructive">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                  <div>
                    <p className="font-semibold">
                      Attendance verification failed
                    </p>

                    <p className="mt-1 text-sm leading-6">
                      {error}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loadStatus}
                  className="mt-4 h-10 rounded-xl bg-destructive px-4 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Try again
                </button>
              </div>
            ) : data ? (
              <>
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <UserCheck className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        {fullName}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Staff ID: {data.staff.staffNumber}
                        {data.staff.roleTitle
                          ? ` · ${data.staff.roleTitle}`
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-start gap-3 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <LogIn className="h-4 w-4" />
                      Clock in
                    </div>

                    <p className="mt-2 text-xl font-bold">
                      {formatTime(
                        data.today?.clockInAt || null,
                        data.timezone
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <LogOut className="h-4 w-4" />
                      Clock out
                    </div>

                    <p className="mt-2 text-xl font-bold">
                      {formatTime(
                        data.today?.clockOutAt || null,
                        data.timezone
                      )}
                    </p>
                  </div>
                </div>

                {data.today?.status === "late" && (
                  <div className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3">
                    <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-warning" />

                    <div>
                      <p className="font-semibold text-warning">
                        Late arrival
                      </p>

                      <p className="mt-1 text-sm text-warning/90">
                        You arrived {data.today.lateMinutes} minute
                        {data.today.lateMinutes === 1 ? "" : "s"} after
                        the allowed grace period.
                      </p>
                    </div>
                  </div>
                )}

                {action !== "completed" && (
                  <div className="rounded-2xl border bg-muted/20 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <MapPin className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                          Verify your location
                        </p>

                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          You must be within the school attendance
                          area before you can {action === "clock_in"
                            ? "clock in"
                            : "clock out"}.
                        </p>
                      </div>
                    </div>

                    {location && (
                      <div className="mt-4 rounded-xl border border-success/20 bg-success/10 p-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-success">
                          <CheckCircle2 className="h-4 w-4" />
                          Location detected
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Accuracy: approximately{" "}
                          {Math.round(location.accuracy)}m
                        </p>
                      </div>
                    )}

                    {locationMessage && !location && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {locationMessage}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={requestLocation}
                      disabled={locating}
                      className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 text-sm font-bold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {locating ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Crosshair className="h-5 w-5" />
                      )}

                      {locating
                        ? "Detecting location..."
                        : location
                          ? "Refresh location"
                          : "Allow & verify location"}
                    </button>
                  </div>
                )}

                {action === "clock_in" && (
                  <button
                    type="button"
                    onClick={handleAttendanceAction}
                    disabled={
                      processing ||
                      !stationToken ||
                      !location
                    }
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-base font-bold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {processing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <LogIn className="h-5 w-5" />
                    )}

                    {processing ? "Recording..." : "Clock In"}
                  </button>
                )}

                {action === "clock_out" && (
                  <button
                    type="button"
                    onClick={handleAttendanceAction}
                    disabled={
                      processing ||
                      !stationToken ||
                      !location
                    }
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-destructive px-5 text-base font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {processing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <LogOut className="h-5 w-5" />
                    )}

                    {processing ? "Recording..." : "Clock Out"}
                  </button>
                )}

                {action === "completed" && (
                  <div className="rounded-2xl border border-success/20 bg-success/10 p-5 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>

                    <h2 className="mt-3 font-bold">
                      Attendance completed
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Your clock-in and clock-out for today have both
                      been recorded.
                    </p>
                  </div>
                )}

                {!stationToken && (
                  <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4 text-sm text-warning">
                    Scan the school attendance QR code to start your
                    attendance session.
                  </div>
                )}

                {stationToken && !location && action !== "completed" && (
                  <p className="text-center text-xs text-muted-foreground">
                    Location verification is required before attendance
                    can be recorded.
                  </p>
                )}
              </>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
