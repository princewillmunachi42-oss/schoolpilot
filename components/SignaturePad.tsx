"use client";

import { useEffect, useRef, useState } from "react";

type SignaturePadProps = {
  value?: string;
  onChange: (value: string) => void;
};

export default function SignaturePad({
  value,
  onChange,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(Boolean(value));

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !value) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const image = new Image();

    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
      );
    };

    image.src = value;
  }, [value]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111827";

    const getPosition = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();

      return {
        x:
          ((event.clientX - rect.left) / rect.width) *
          canvas.width,
        y:
          ((event.clientY - rect.top) / rect.height) *
          canvas.height,
      };
    };

    const startDrawing = (event: PointerEvent) => {
      drawingRef.current = true;
      canvas.setPointerCapture(event.pointerId);

      const position = getPosition(event);

      context.beginPath();
      context.moveTo(position.x, position.y);
      setHasSignature(true);
    };

    const draw = (event: PointerEvent) => {
      if (!drawingRef.current) {
        return;
      }

      const position = getPosition(event);

      context.lineTo(position.x, position.y);
      context.stroke();
    };

    const stopDrawing = () => {
      if (!drawingRef.current) {
        return;
      }

      drawingRef.current = false;
      onChange(canvas.toDataURL("image/png"));
    };

    canvas.addEventListener("pointerdown", startDrawing);
    canvas.addEventListener("pointermove", draw);
    canvas.addEventListener("pointerup", stopDrawing);
    canvas.addEventListener("pointercancel", stopDrawing);
    canvas.addEventListener("pointerleave", stopDrawing);

    return () => {
      canvas.removeEventListener("pointerdown", startDrawing);
      canvas.removeEventListener("pointermove", draw);
      canvas.removeEventListener("pointerup", stopDrawing);
      canvas.removeEventListener("pointercancel", stopDrawing);
      canvas.removeEventListener("pointerleave", stopDrawing);
    };
  }, [onChange]);

  const clearSignature = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange("");
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border bg-white">
        <canvas
          ref={canvasRef}
          width={900}
          height={300}
          className="block h-40 w-full touch-none"
          aria-label="Draw your signature"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Sign above using your finger or mouse.
        </p>

        <button
          type="button"
          onClick={clearSignature}
          disabled={!hasSignature}
          className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
