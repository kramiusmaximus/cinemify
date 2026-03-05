import { z } from "zod";

export const createJobSchema = z.object({
  inputVideoUrl: z.string().url(),
  prompt: z.string().min(1).max(1000).optional(),
  referenceImageUrl: z.string().url().optional(),
  outputResolution: z.enum(["720p", "1080p", "1440p", "4k"]).optional(),
});

export const planSegmentsSchema = z
  .object({
    durationSeconds: z.number().positive(),
    targetSegmentMaxMb: z.number().positive().max(160).optional(),
    bitrateMbps: z.number().positive().optional(),
    sizeBytes: z.number().int().positive().optional(),
  })
  .superRefine((body, ctx) => {
    const hasBitrate = typeof body.bitrateMbps === "number";
    const hasSizeAndDuration = typeof body.sizeBytes === "number" && typeof body.durationSeconds === "number";

    if (!hasBitrate && !hasSizeAndDuration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either bitrateMbps or sizeBytes with durationSeconds",
        path: ["bitrateMbps"],
      });
    }
  });

export const startJobSchema = z
  .object({
    notifyEmail: z.string().email().optional(),
  })
  // allow empty or missing JSON body
  .default({});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
