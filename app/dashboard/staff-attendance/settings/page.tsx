"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  Check,
  Clock3,
  Crosshair,
  Loader2,
  MapPin,
  Save,
  Settings2,
  ShieldCheck,
  Timer,
} from "lucide-react";

type AttendanceSettings = {
  clockInTime: string | null;
  clockOutTime: string | null;
  lateGraceMinutes: number;
  timezone: string;
  mondayEnabled: boolean;
  tuesdayEnabled: boolean;
  wednesdayEnabled: boolean;
  thursdayEnabled: boolean;
  fridayEnabled: boolean;
  saturdayEnabled: boolean;
  sundayEnabled: boolean;
  latitude: number | null;
  longitude: number | null;
  geofenceRadiusMeters: number;
  geofenceEnabled: boolean;
};

type WeekdayKey =
  | "mondayEnabled"
  | "tuesdayEnabled"
  | "wednesdayEnabled"
  | "thursdayEnabled"
  | "fridayEnabled"
  | "saturdayEnabled"
  | "sundayEnabled";

const DEFAULT_SETTINGS: AttendanceSettings = {
  clockInTime: null,
  clockOutTime: null,
  lateGraceMinutes: 15,
  timezone: "Africa/Lagos",
  mondayEnabled: true,
  tuesdayEnabled: true,
  wednesdayEnabled: true,
  thursdayEnabled: true,
  fridayEnabled: true,
  saturdayEnabled: false,
  sundayEnabled: false,
  latitude: null,
  longitude: null,
  geofenceRadiusMeters: 100,
  geofenceEnabled: true,
};

const weekdays: {
  key: WeekdayKey;
  label: string;
  short: string;
}[] = [
  { key: "mondayEnabled", label: "Monday", short: "Mon" },
  { key: "tuesdayEnabled", label: "Tuesday", short: "Tue" },
  { key: "wednesdayEnabled", label: "Wednesday", short: "Wed" },
  { key: "thursdayEnabled", label: "Thursday", short: "Thu" },
  { key: "fridayEnabled", label: "Friday", short: "Fri" },
  { key: "saturdayEnabled", label: "Saturday", short: "Sat" },
  { key: "sundayEnabled", label: "Sunday", short: "Sun" },
];

export default function StaffAttendanceSettingsPage() {
  const [settings, setSettings] =
    useState<AttendanceSettings>(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch(
          "/api/school/staff-attendance/settings",
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to load attendance settings."
          );
        }

        setSettings({
          ...DEFAULT_SETTINGS,
          ...data.settings,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load attendance settings."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function updateSetting<K extends keyof AttendanceSettings>(
    key: K,
    value: AttendanceSettings[K]
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setMessage("");
    setError("");
  }

  function useCurrentLocation() {
    setLocationMessage("");
    setError("");
    setMessage("");

    if (!navigator.geolocation) {
      setLocationMessage(
        "Location services are not supported by this browser."
      );
      return;
    }

    setLocating(true);

    let finished = false;
    let watchId: number | null = null;

    const finish = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      setLocating(false);
    };

    const handleSuccess = (position: GeolocationPosition) => {
      if (finished) return;
      finished = true;

      updateSetting(
        "latitude",
        Number(position.coords.latitude.toFixed(7))
      );

      updateSetting(
        "longitude",
        Number(position.coords.longitude.toFixed(7))
      );

      setLocationMessage(
        `Location captured successfully. Accuracy: approximately ${Math.round(
          position.coords.accuracy
        )} m.`
      );

      finish();
    };

    const handleError = (geoError: GeolocationPositionError) => {
      if (finished) return;

      if (geoError.code === 1) {
        finished = true;
        setLocationMessage(
          "Location permission was denied. Please allow location access and try again."
        );
        finish();
        return;
      }

      if (geoError.code === 2) {
        finished = true;
        setLocationMessage(
          "Your current location could not be determined. Please try again."
        );
        finish();
        return;
      }

      setLocationMessage(
        "Still looking for your location. Keep Location turned on and wait a moment..."
      );
    };

    watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 60000,
        maximumAge: 0,
      }
    );

    window.setTimeout(() => {
      if (finished) return;

      finished = true;

      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }

      setLocationMessage(
        "Unable to get your location from Chrome. Please keep Location enabled and try again."
      );
      setLocating(false);
    }, 60000);
  }

  async function saveSettings() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/school/staff-attendance/settings",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to save attendance settings."
        );
      }

      setSettings({
        ...DEFAULT_SETTINGS,
        ...data.settings,
      });

      setMessage(
        "Staff attendance settings saved successfully."
      );
      setLocationMessage("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save attendance settings."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[55vh] max-w-5xl items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading attendance settings...
          </div>
        </div>
      </main>
    );
  }

  const hasLocation =
    settings.latitude !== null &&
    settings.longitude !== null;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/dashboard/staff-attendance"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Staff Attendance
        </Link>

        <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="border-b px-5 py-6 sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Settings2 className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-primary">
                    Staff Attendance
                  </p>

                  <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                    Attendance settings
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Configure working hours, lateness rules,
                    attendance days, school timezone, and
                    location security.
                  </p>
                </div>
              </div>

              <div className="hidden rounded-2xl bg-primary/10 p-3 text-primary sm:block">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-7">
            {message && (
              <div className="flex items-start gap-3 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border bg-background/50 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Clock3 className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Working hours
                    </h2>

                    <p className="text-xs text-muted-foreground">
                      Used for attendance timing
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-sm font-medium">
                      Clock-in time
                    </span>

                    <input
                      type="time"
                      value={settings.clockInTime ?? ""}
                      onChange={(event) =>
                        updateSetting(
                          "clockInTime",
                          event.target.value || null
                        )
                      }
                      className="h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-medium">
                      Clock-out time
                    </span>

                    <input
                      type="time"
                      value={settings.clockOutTime ?? ""}
                      onChange={(event) =>
                        updateSetting(
                          "clockOutTime",
                          event.target.value || null
                        )
                      }
                      className="h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border bg-background/50 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
                    <Timer className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Lateness policy
                    </h2>

                    <p className="text-xs text-muted-foreground">
                      Grace period before marking late
                    </p>
                  </div>
                </div>

                <label>
                  <span className="mb-2 block text-sm font-medium">
                    Grace period
                  </span>

                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={240}
                      value={settings.lateGraceMinutes}
                      onChange={(event) =>
                        updateSetting(
                          "lateGraceMinutes",
                          Number(event.target.value)
                        )
                      }
                      className="h-11 w-full rounded-xl border bg-card px-3 pr-20 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />

                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                      minutes
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border bg-background/50 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <CalendarCheck className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Attendance days
                  </h2>

                  <p className="text-xs text-muted-foreground">
                    Choose the days staff can clock in
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {weekdays.map((day) => {
                  const enabled = settings[day.key];

                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() =>
                        updateSetting(
                          day.key,
                          !enabled
                        )
                      }
                      className={`rounded-2xl border px-3 py-4 text-center transition ${
                        enabled
                          ? "border-primary bg-primary/10 text-primary"
                          : "bg-card text-muted-foreground hover:bg-muted"
                      }`}
                      aria-pressed={enabled}
                    >
                      <span className="block text-sm font-semibold">
                        {day.short}
                      </span>

                      <span className="mt-1 block text-xs">
                        {enabled ? "Active" : "Off"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border bg-background/50 p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Attendance location
                    </h2>

                    <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
                      Staff must be physically within the
                      configured school radius when scanning
                      the printed attendance QR.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    updateSetting(
                      "geofenceEnabled",
                      !settings.geofenceEnabled
                    )
                  }
                  aria-pressed={settings.geofenceEnabled}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    settings.geofenceEnabled
                      ? "border-success/30 bg-success/10 text-success"
                      : "bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      settings.geofenceEnabled
                        ? "bg-success"
                        : "bg-muted-foreground"
                    }`}
                  />
                  {settings.geofenceEnabled
                    ? "Geofence enabled"
                    : "Geofence disabled"}
                </button>
              </div>

              <div className="mt-5 rounded-2xl border bg-card p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      School coordinates
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Use the location of the school entrance
                      where staff will scan the QR.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={locating}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-background px-4 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {locating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Getting location...
                      </>
                    ) : (
                      <>
                        <Crosshair className="h-4 w-4 text-primary" />
                        Use my current location
                      </>
                    )}
                  </button>
                </div>

                {hasLocation ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border bg-background/60 px-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        Latitude
                      </p>

                      <p className="mt-1 font-mono text-sm font-semibold">
                        {settings.latitude}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-background/60 px-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        Longitude
                      </p>

                      <p className="mt-1 font-mono text-sm font-semibold">
                        {settings.longitude}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/10 px-4 py-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-warning" />

                    <div>
                      <p className="text-sm font-semibold text-warning">
                        School location not configured
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Capture the school entrance location
                        before staff can use geofenced
                        attendance.
                      </p>
                    </div>
                  </div>
                )}

                {locationMessage && (
                  <div className="mt-4 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-xs leading-5 text-primary">
                    {locationMessage}
                  </div>
                )}

                <div className="mt-5">
                  <label>
                    <span className="mb-2 block text-sm font-medium">
                      Allowed radius
                    </span>

                    <div className="relative">
                      <input
                        type="number"
                        min={20}
                        max={5000}
                        value={
                          settings.geofenceRadiusMeters
                        }
                        onChange={(event) =>
                          updateSetting(
                            "geofenceRadiusMeters",
                            Number(
                              event.target.value
                            )
                          )
                        }
                        className="h-11 w-full rounded-xl border bg-background px-3 pr-20 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />

                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                        meters
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Allowed range: 20–5000 meters.
                    </p>
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-background/50 p-5">
              <h2 className="font-semibold">
                School timezone
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Attendance dates and lateness calculations use
                this timezone.
              </p>

              <input
                type="text"
                value={settings.timezone}
                onChange={(event) =>
                  updateSetting(
                    "timezone",
                    event.target.value
                  )
                }
                placeholder="Africa/Lagos"
                className="mt-4 h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

              <p className="mt-2 text-xs text-muted-foreground">
                Example: Africa/Lagos
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-muted-foreground">
                Changes affect future attendance calculations
                and do not modify existing attendance records.
              </p>

              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save settings
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
