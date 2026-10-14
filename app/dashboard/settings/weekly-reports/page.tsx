"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
ArrowLeft, CalendarDays, Clock3, FileText, LoaderCircle,
Save, ShieldCheck,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const ROLES = [
{ value: "owner", label: "School owner" },
{ value: "principal", label: "Principal" },
{ value: "admin", label: "School administrator" },
];

type Settings = {
enabled: boolean;
report_days: string[];
delivery_day: string;
delivery_time: string;
report_period: "current_week" | "previous_week";
recipient_roles: string[];
timezone: string;
};

const DEFAULTS: Settings = {
enabled: true,
report_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
delivery_day: "Friday",
delivery_time: "17:00",
report_period: "previous_week",
recipient_roles: ["owner", "principal", "admin"],
timezone: "Africa/Lagos",
};

export default function WeeklyReportSettingsPage() {
const [settings, setSettings] = useState<Settings>(DEFAULTS);
const [schoolId, setSchoolId] = useState("");
const [schoolName, setSchoolName] = useState("Your school");
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [message, setMessage] = useState("");
const [error, setError] = useState("");

useEffect(() => {
let active = true;
fetch("/api/school/weekly-reports/settings", { cache: "no-store" })
.then(async (response) => {
const data = await response.json();
if (!response.ok) throw new Error(data.error || "Unable to load settings.");
if (!active) return;
setSchoolId(data.schoolId);
setSchoolName(data.schoolName);
setSettings({ ...DEFAULTS, ...data.settings });
})
.catch((err) => { if (active) setError(err.message); })
.finally(() => { if (active) setLoading(false); });
return () => { active = false; };
}, []);

function update<K extends keyof Settings>(key: K, value: Settings[K]) {
setSettings((old) => ({ ...old, [key]: value }));
}

function toggleDay(day: string, checked: boolean) {
update("report_days", checked
? [...settings.report_days, day]
: settings.report_days.filter((item) => item !== day));
}

function toggleRole(role: string, checked: boolean) {
update("recipient_roles", checked
? [...settings.recipient_roles, role]
: settings.recipient_roles.filter((item) => item !== role));
}

async function save() {
setSaving(true);
setMessage("");
setError("");
try {
const response = await fetch(
`/api/school/weekly-reports/settings?schoolId=${encodeURIComponent(schoolId)}`,
{
method: "PUT",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(settings),
},
);
const data = await response.json();
if (!response.ok) throw new Error(data.error || "Unable to save settings.");
setSettings({ ...DEFAULTS, ...data.settings });
setMessage("Weekly report settings saved successfully.");
} catch (err) {
setError(err instanceof Error ? err.message : "Unable to save settings.");
} finally {
setSaving(false);
}
}

const fieldClass = "mt-2 min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const cardClass = "rounded-2xl border bg-card p-5 shadow-sm sm:p-6";

return (
<main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
<div className="mx-auto max-w-4xl space-y-6">
<header>
<Link href="/dashboard/settings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
<ArrowLeft className="h-4 w-4" /> Back to School Settings
</Link>
<div className="mt-5 flex items-start gap-3">
<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
<CalendarDays className="h-6 w-6" />
</div>
<div>
<p className="text-sm font-medium text-primary">School Administration</p>
<h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Weekly Report Automation</h1>
<p className="mt-2 text-sm text-muted-foreground">
Configure when {schoolName} prepares and delivers its weekly PDF report.
</p>
</div>
</div>
</header>

    {loading ? (
      <div className="flex items-center gap-2 rounded-2xl border p-6 text-sm text-muted-foreground">
        <LoaderCircle className="h-5 w-5 animate-spin" /> Loading your settings…
      </div>
    ) : (
      <>
        {error && <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">{error}</div>}
        {message && <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">{message}</div>}

        <section className={cardClass}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Automatic delivery</h2>
              <p className="mt-1 text-sm text-muted-foreground">Pause scheduled reports without losing your configuration.</p>
            </div>
            <button type="button" role="switch" aria-checked={settings.enabled}
              onClick={() => update("enabled", !settings.enabled)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${settings.enabled ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.enabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          <p className={`mt-3 text-sm font-medium ${settings.enabled ? "text-emerald-600" : "text-muted-foreground"}`}>
            {settings.enabled ? "Scheduled reports are enabled" : "Scheduled reports are paused"}
          </p>
        </section>

        <section className={cardClass}>
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold">Reporting days</h2>
              <p className="text-sm text-muted-foreground">Choose which days of school activity to include.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {DAYS.map((day) => (
              <label key={day} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 hover:bg-muted/40">
                <input type="checkbox" checked={settings.report_days.includes(day)}
                  onChange={(event) => toggleDay(day, event.target.checked)}
                  className="h-4 w-4 accent-primary" />
                <span className="text-sm font-medium">{day}</span>
              </label>
            ))}
          </div>
        </section>

        <section className={cardClass}>
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold">Delivery schedule</h2>
              <p className="text-sm text-muted-foreground">Set when management receives the report notification.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold">Delivery day
              <select className={fieldClass} value={settings.delivery_day}
                onChange={(e) => update("delivery_day", e.target.value)}>
                {DAYS.map((day) => <option key={day}>{day}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">Delivery time
              <input type="time" className={fieldClass} value={settings.delivery_time}
                onChange={(e) => update("delivery_time", e.target.value)} />
            </label>
          </div>
          <div className="mt-4 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
            Time zone: <strong className="text-foreground">Africa/Lagos (WAT)</strong>
          </div>
        </section>

        <section className={cardClass}>
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold">Report period</h2>
              <p className="text-sm text-muted-foreground">Choose which week the PDF summarizes.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {[
              { value: "previous_week", title: "Previous week", description: "Report on the last completed week." },
              { value: "current_week", title: "Current week", description: "Report on the configured days in this week." },
            ].map((option) => (
              <label key={option.value} className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 hover:bg-muted/40">
                <input type="radio" name="reportPeriod" value={option.value}
                  checked={settings.report_period === option.value}
                  onChange={() => update("report_period", option.value as Settings["report_period"])}
                  className="mt-1 h-4 w-4 accent-primary" />
                <span><span className="block text-sm font-semibold">{option.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{option.description}</span></span>
              </label>
            ))}
          </div>
        </section>

        <section className={cardClass}>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold">Notification recipients</h2>
              <p className="text-sm text-muted-foreground">Choose which management roles receive the PDF link.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {ROLES.map((role) => (
              <label key={role.value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 hover:bg-muted/40">
                <input type="checkbox" checked={settings.recipient_roles.includes(role.value)}
                  onChange={(event) => toggleRole(role.value, event.target.checked)}
                  className="h-4 w-4 accent-primary" />
                <span className="text-sm font-medium">{role.label}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link href="/dashboard/weekly-reports" className="inline-flex min-h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold hover:bg-muted/40">
            View Weekly Reports
          </Link>
          <button type="button" onClick={save} disabled={saving || settings.report_days.length === 0 || settings.recipient_roles.length === 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </>
    )}
  </div>
</main>

);
}
