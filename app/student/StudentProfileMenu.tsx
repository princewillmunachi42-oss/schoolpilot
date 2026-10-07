"use client";

import { useEffect, useRef, useState } from "react";

type StudentProfileMenuProps = {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
};

export default function StudentProfileMenu({
  firstName,
  lastName,
  photoUrl,
}: StudentProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open student profile menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary ring-offset-background transition hover:ring-2 hover:ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`${firstName} ${lastName}`}
            className="h-full w-full object-cover"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border bg-card p-1.5 shadow-lg">
          <div className="border-b px-3 py-2">
            <p className="truncate text-sm font-semibold">
              {firstName} {lastName}
            </p>
            <p className="text-xs text-muted-foreground">
              Student
            </p>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Logout
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
