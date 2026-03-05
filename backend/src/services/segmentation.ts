import { createId } from "../utils/id.js";
import type { Segment } from "../types/domain.js";

const MB = 1024 * 1024;

export interface SegmentationInput {
  jobId: string;
  durationSeconds: number;
  targetSegmentMaxMb?: number;
  bitrateMbps?: number;
  sizeBytes?: number;
}

export interface SegmentationPlan {
  estimatedBitrateMbps: number;
  targetSegmentMaxBytes: number;
  maxSegmentDurationSeconds: number;
  segments: Segment[];
}

function calculateBitrateMbps(input: SegmentationInput): number {
  if (typeof input.bitrateMbps === "number") {
    return input.bitrateMbps;
  }

  if (typeof input.sizeBytes === "number" && input.durationSeconds > 0) {
    const bytesPerSecond = input.sizeBytes / input.durationSeconds;
    return (bytesPerSecond * 8) / 1_000_000;
  }

  throw new Error("Provide either bitrateMbps or sizeBytes+durationSeconds");
}

export function planSegments(input: SegmentationInput): SegmentationPlan {
  const targetSegmentMaxMb = input.targetSegmentMaxMb ?? 160;
  if (targetSegmentMaxMb <= 0) {
    throw new Error("targetSegmentMaxMb must be > 0");
  }

  if (input.durationSeconds <= 0) {
    throw new Error("durationSeconds must be > 0");
  }

  const estimatedBitrateMbps = calculateBitrateMbps(input);
  if (estimatedBitrateMbps <= 0) {
    throw new Error("bitrate must be > 0");
  }

  const targetSegmentMaxBytes = Math.floor(targetSegmentMaxMb * MB);
  const bytesPerSecond = (estimatedBitrateMbps * 1_000_000) / 8;
  const maxSegmentDurationSeconds = targetSegmentMaxBytes / bytesPerSecond;
  const segmentCount = Math.max(1, Math.ceil(input.durationSeconds / maxSegmentDurationSeconds));

  const segments: Segment[] = [];
  for (let index = 0; index < segmentCount; index += 1) {
    const startSeconds = (input.durationSeconds / segmentCount) * index;
    const endSeconds = Math.min(input.durationSeconds, (input.durationSeconds / segmentCount) * (index + 1));
    const duration = endSeconds - startSeconds;
    const estimatedSizeBytes = Math.min(targetSegmentMaxBytes, Math.ceil(duration * bytesPerSecond));

    segments.push({
      id: createId("seg"),
      jobId: input.jobId,
      index,
      startSeconds: Number(startSeconds.toFixed(3)),
      endSeconds: Number(endSeconds.toFixed(3)),
      estimatedSizeBytes,
      status: "pending",
    });
  }

  return {
    estimatedBitrateMbps,
    targetSegmentMaxBytes,
    maxSegmentDurationSeconds,
    segments,
  };
}
