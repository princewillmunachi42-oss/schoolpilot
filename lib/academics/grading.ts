export type GradeBand = {
  grade: string;
  min_score: number;
  max_score: number;
  remarks: string;
};

type LegacyGradeBand = {
  grade: string;
  min_score: number;
  max_score?: number;
  remarks: string;
};

export const DEFAULT_GRADING_SCALE: GradeBand[] = [
  { grade: "A", min_score: 70, max_score: 100, remarks: "Excellent" },
  { grade: "B", min_score: 60, max_score: 69, remarks: "Very Good" },
  { grade: "C", min_score: 50, max_score: 59, remarks: "Good" },
  { grade: "D", min_score: 45, max_score: 49, remarks: "Fair" },
  { grade: "E", min_score: 40, max_score: 44, remarks: "Pass" },
  { grade: "F", min_score: 0, max_score: 39, remarks: "Fail" },
];

export function validateGradingScale(value: unknown): GradeBand[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 12) {
    throw new Error("Provide between 2 and 12 grade bands.");
  }

  const rawBands: LegacyGradeBand[] = value.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("Each grade band must be an object.");
    }

    const band = item as Record<string, unknown>;
    const grade =
      typeof band.grade === "string" ? band.grade.trim().toUpperCase() : "";
    const remarks = typeof band.remarks === "string" ? band.remarks.trim() : "";

    if (!/^[A-Z][A-Z0-9+-]{0,9}$/.test(grade)) {
      throw new Error("Grade labels must be valid, short labels.");
    }

    if (
      typeof band.min_score !== "number" ||
      !Number.isFinite(band.min_score) ||
      band.min_score < 0 ||
      band.min_score > 100
    ) {
      throw new Error("Minimum scores must be between 0 and 100.");
    }

    if (
      band.max_score !== undefined &&
      (typeof band.max_score !== "number" ||
        !Number.isFinite(band.max_score) ||
        band.max_score < 0 ||
        band.max_score > 100)
    ) {
      throw new Error("Maximum scores must be between 0 and 100.");
    }

    return {
      grade,
      min_score: band.min_score,
      ...(band.max_score === undefined
        ? {}
        : { max_score: band.max_score as number }),
      remarks,
    };
  });

  if (new Set(rawBands.map((band) => band.grade)).size !== rawBands.length) {
    throw new Error("Grade labels must be unique.");
  }

  const sorted = [...rawBands].sort((a, b) => b.min_score - a.min_score);

  const legacy = sorted.every((band) => band.max_score === undefined);

  if (legacy) {
    return sorted.map((band, index) => ({
      grade: band.grade,
      min_score: band.min_score,
      max_score:
        index === 0
          ? 100
          : Number((sorted[index - 1].min_score - 0.01).toFixed(2)),
      remarks: band.remarks,
    }));
  }

  if (sorted.some((band) => band.max_score === undefined)) {
    throw new Error(
      "Every grade band must have both minimum and maximum scores.",
    );
  }

  const bands = sorted as GradeBand[];

  for (const band of bands) {
    if (band.min_score > band.max_score) {
      throw new Error(`Grade ${band.grade}: minimum exceeds maximum.`);
    }
  }

  if (bands[0].max_score !== 100) {
    throw new Error("The highest grade band must end at 100.");
  }

  if (bands[bands.length - 1].min_score !== 0) {
    throw new Error("The lowest grade band must start at 0.");
  }

  for (let i = 0; i < bands.length - 1; i++) {
    const higher = bands[i];
    const lower = bands[i + 1];

    if (lower.max_score >= higher.min_score) {
      throw new Error("Grade ranges must not overlap.");
    }

    const wholeNumberBoundary =
      Number.isInteger(lower.max_score) &&
      Number.isInteger(higher.min_score) &&
      lower.max_score + 1 === higher.min_score;

    const decimalBoundary =
      Number((lower.max_score + 0.01).toFixed(2)) === higher.min_score;

    if (!wholeNumberBoundary && !decimalBoundary) {
      throw new Error(
        "Grade ranges must cover every score without gaps. Use ranges such as 79–89 followed by 90–100, or 79–89.99 followed by 90–100.",
      );
    }
  }

  return bands;
}

export function calculateGrade(
  totalScore: number,
  scale: GradeBand[] = DEFAULT_GRADING_SCALE,
): GradeBand {
  if (!Number.isFinite(totalScore) || totalScore < 0 || totalScore > 100) {
    throw new Error("Total score must be between 0 and 100.");
  }

  const orderedScale = validateGradingScale(scale);

  const band = orderedScale.find((item, index) => {
    const nextHigherBand = index > 0 ? orderedScale[index - 1] : undefined;

    const usesWholeNumberBoundary =
      nextHigherBand !== undefined &&
      Number.isInteger(item.min_score) &&
      Number.isInteger(item.max_score) &&
      item.max_score + 1 === nextHigherBand.min_score;

    const belowUpperBoundary = usesWholeNumberBoundary
      ? totalScore < item.max_score + 1
      : totalScore <= item.max_score;

    return totalScore >= item.min_score && belowUpperBoundary;
  });

  if (!band) {
    throw new Error("No grade band covers this score.");
  }

  return band;
}
