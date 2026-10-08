"use client";

import {
  ArrowUpDown,
  BookMarked,
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  School,
  Settings,
  UserRound,
  Users,
  Clock3,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigationGroups = [
  {
    label: "Overview",
    items: [
      {
        label: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Academic",
    items: [
      {
        label: "Academic Sessions",
        href: "/dashboard/sessions",
        icon: CalendarDays,
      },
      {
        label: "Terms",
        href: "/dashboard/terms",
        icon: BookOpen,
      },
      {
        label: "Classes",
        href: "/dashboard/classes",
        icon: GraduationCap,
      },
      {
        label: "Subjects",
        href: "/dashboard/subjects",
        icon: BookMarked,
      },
      {
        label: "Timetable",
        href: "/dashboard/timetable",
        icon: Clock3,
      },
      {
        label: "Timetable Periods",
        href: "/dashboard/timetable-periods",
        icon: CalendarDays,
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        label: "Staff",
        href: "/dashboard/staff",
        icon: Users,
      },
      {
        label: "Students",
        href: "/dashboard/students",
        icon: GraduationCap,
      },
      {
        label: "Parents",
        href: "/dashboard/parents",
        icon: UserRound,
      },
      {
        label: "Student Promotions",
        href: "/dashboard/promotions",
        icon: ArrowUpDown,
      },
      {
        label: "Class Progressions",
        href: "/dashboard/class-progressions",
        icon: ArrowUpDown,
      },
    ],
  },
  {
    label: "Attendance",
    items: [
      {
        label: "Staff Attendance",
        href: "/dashboard/staff-attendance",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Teacher Assignments",
        href: "/dashboard/teacher-assignments",
        icon: ClipboardList,
      },
      {
        label: "Student Fees",
        href: "/dashboard/fees",
        icon: CircleDollarSign,
      },
      {
        label: "Announcements",
        href: "/dashboard/announcements",
        icon: Megaphone,
      },
      {
        label: "Communications",
        href: "/dashboard/communications",
        icon: MessageSquare,
      },
      {
        label: "School Settings",
        href: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
];

export default function MobileDashboardNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="border-t lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted/60"
      >
        <span>Navigation</span>

        <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {open ? "Close" : "Menu"}
        </span>
      </button>

      {open && (
        <div className="border-t bg-card px-4 py-4">
          <nav className="space-y-5">
            {navigationGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${
                          active
                            ? "border-primary bg-primary text-white shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="leading-4">{item.label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
