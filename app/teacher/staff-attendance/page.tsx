"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Loader2,
  QrCode,
  ShieldCheck,
} from "lucide-react";

export default function StaffAttendanceScannerPage() {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startingRef = useRef(false);
  const scannedRef = useRef(false);

  const [starting, setStarting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    "Allow camera access, then scan your school's attendance QR code."
  );

  async function stopScanner() {
    const scanner = scannerRef.current;

    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch {
        // The camera may already have stopped.
      }

      try {
        scanner.clear();
      } catch {
        // The scanner may already be cleared.
      }

      scannerRef.current = null;
    }

    setScanning(false);
  }

  async function startScanner() {
    if (startingRef.current || scannedRef.current) return;

    startingRef.current = true;
    setStarting(true);
    setError("");
    setMessage("Starting your camera...");

    try {
      if (!window.isSecureContext) {
        throw new Error(
          "Camera access requires HTTPS or localhost. Open SchoolPilot using its secure HTTPS address."
        );
      }

      const scanner = new Html5Qrcode("staff-attendance-qr-reader");
      scannerRef.current = scanner;
const cameras = await Html5Qrcode.getCameras();

if (!cameras.length) {
  throw new Error("No camera detected. Check your phone's camera permissions.");
}

const backCamera =
  cameras.find((camera) => /back|rear|environment/i.test(camera.label)) ??
  cameras[0];

await scanner.start(
  backCamera.id || { facingMode: { exact: "environment" } },
  {
    fps: 10,
    qrbox: { width: 230, height: 230 },
    aspectRatio: 1,
  },

        async (decodedText) => {
          if (scannedRef.current) return;

          let stationToken = decodedText.trim();

          try {
            const scannedUrl = new URL(decodedText);
            stationToken = scannedUrl.searchParams.get("s") || "";
          } catch {
            // A raw station token is also accepted.
          }

          if (!/^[a-fA-F0-9]{64}$/.test(stationToken)) {
            setError(
              "This QR code is not a valid SchoolPilot attendance station code. Scan the QR code displayed by your school."
            );
            return;
          }

          scannedRef.current = true;
          setMessage("QR code scanned. Opening attendance verification...");

          await stopScanner();

          router.push(
            `/teacher/staff-attendance/scan?s=${encodeURIComponent(
              stationToken
            )}`
          );
        },
        () => {
          // Ignore individual frames that do not contain a QR code.
        }
      );

      setScanning(true);
      setMessage("Camera ready. Point it at the school's attendance QR code.");
} catch (err) {
  await stopScanner();

  const details =
    err && typeof err === "object"
      ? [
          "name" in err ? String(err.name) : "",
          "message" in err ? String(err.message) : "",
          "constraint" in err ? String(err.constraint) : "",
        ].filter(Boolean).join(": ")
      : String(err);

  setError(details || "Unknown camera error. Check Chrome camera permissions.");
  setMessage("Camera could not start.");
}

     finally {
      startingRef.current = false;
      setStarting(false);
    }
  }

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;

      if (scanner) {
        if (scanner.isScanning) {
          void scanner.stop().catch(() => {});
        }
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-xl">
        <Link
          href="/teacher"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Teacher Dashboard
        </Link>

        <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="border-b bg-primary/5 px-6 py-7 text-center sm:px-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <QrCode className="h-8 w-8" />
            </div>

            <p className="mt-4 text-sm font-semibold text-primary">
              Teacher Portal
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Staff Attendance Scanner
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Scan your school's attendance QR code directly with your
              phone camera. Your account and location are still verified
              before attendance is recorded.
            </p>
          </div>

          <div className="space-y-5 p-5 sm:p-7">
            <div className="overflow-hidden rounded-2xl border bg-black">
              <div
                id="staff-attendance-qr-reader"
                className="min-h-[280px] w-full"
              />
            </div>

            <div className="flex items-start gap-3 rounded-2xl border bg-muted/30 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

              <div>
                <p className="font-semibold">Secure attendance verification</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Scanning the code does not record attendance by itself.
                  SchoolPilot will verify your teacher account and require
                  location verification on the next screen.
                </p>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <p aria-live="polite" className="text-center text-sm text-muted-foreground">
              {message}
            </p>

            {!scanning && (
              <button
                type="button"
                onClick={startScanner}
                disabled={starting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {starting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : error ? (
                  <Camera className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}

                {starting
                  ? "Starting camera..."
                  : error
                    ? "Try camera again"
                    : "Start QR Scanner"}
              </button>
            )}

            {scanning && (
              <button
                type="button"
                onClick={() => {
                  void stopScanner();
                  setMessage("Camera stopped. Start the scanner when ready.");
                }}
                className="h-12 w-full rounded-xl border px-4 text-sm font-semibold hover:bg-muted"
              >
                Stop Scanner
              </button>
            )}

            <p className="text-center text-xs leading-5 text-muted-foreground">
              If prompted, allow camera access. Location permission will be
              requested separately during attendance verification.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
