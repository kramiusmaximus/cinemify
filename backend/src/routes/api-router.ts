import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import {
  planSegmentsSchema,
  createJobSchema,
  startJobSchema,
  registerSchema,
  loginSchema,
} from "./schemas.js";
import type { InMemoryStore } from "../stores/in-memory-store.js";
import { createId } from "../utils/id.js";
import type { EmailClient, PaymentsClient, RunwayClient, StorageClient } from "../integrations/types.js";
import { planSegments } from "../services/segmentation.js";
import { buildEvent } from "../services/job-events.js";
import { requireAuth } from "../middleware/auth.js";
import type { UsersRepo } from "../db/users-repo.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { signAuthToken } from "../auth/jwt.js";

interface ApiRouterDeps {
  store: InMemoryStore;
  usersRepo: UsersRepo;
  runwayClient: RunwayClient;
  storageClient: StorageClient;
  paymentsClient: PaymentsClient;
  emailClient: EmailClient;
}

function toPublicUser(user: { id: number; email: string; role: string; createdAt?: string }) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    ...(user.createdAt ? { createdAt: user.createdAt } : {}),
  };
}

export function createApiRouter(deps: ApiRouterDeps): Router {
  const router = Router();
  const authRequired = requireAuth(deps.usersRepo);

  router.post("/v1/auth/register", validateBody(registerSchema), async (req, res, next) => {
    try {
      const existing = await deps.usersRepo.findByEmail(req.body.email);
      if (existing) {
        return res.status(409).json({
          error: "Conflict",
          message: "A user with this email already exists",
        });
      }

      const passwordHash = await hashPassword(req.body.password);
      const user = await deps.usersRepo.createUser({
        email: req.body.email,
        passwordHash,
        role: "user",
      });

      return res.status(201).json({ user: toPublicUser(user) });
    } catch (error) {
      next(error);
      return;
    }
  });

  router.post("/v1/auth/login", validateBody(loginSchema), async (req, res, next) => {
    try {
      const user = await deps.usersRepo.findByEmail(req.body.email);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
      }

      const passwordOk = await verifyPassword(req.body.password, user.passwordHash);
      if (!passwordOk) {
        return res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
      }

      const token = signAuthToken({
        sub: String(user.id),
        email: user.email,
        role: user.role,
      });

      return res.json({ token, user: toPublicUser(user) });
    } catch (error) {
      next(error);
      return;
    }
  });

  router.get("/v1/auth/me", authRequired, async (req, res) => {
    res.json({ user: toPublicUser(req.user!) });
  });

  router.post("/v1/jobs", authRequired, validateBody(createJobSchema), async (req, res) => {
    const now = new Date().toISOString();
    const jobId = createId("job");

    const inputVideoUrl = await deps.storageClient.getPublicUrl(req.body.inputVideoUrl);
    const referenceImageUrl = req.body.referenceImageUrl
      ? await deps.storageClient.getPublicUrl(req.body.referenceImageUrl)
      : undefined;

    const job = deps.store.createJob({
      id: jobId,
      inputVideoUrl,
      prompt: req.body.prompt,
      referenceImageUrl,
      outputResolution: req.body.outputResolution,
      status: "created",
      createdAt: now,
      updatedAt: now,
      segmentCount: 0,
    });

    deps.store.addEvent(
      buildEvent({
        jobId,
        type: "job.created",
        message: "Job created",
      }),
    );

    res.status(201).json(job);
  });

  router.get("/v1/jobs", authRequired, (_req, res) => {
    res.json({ items: deps.store.listJobs() });
  });

  router.get("/v1/jobs/:jobId", authRequired, (req, res) => {
    const job = deps.store.getJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: "NotFound", message: "Job not found" });
    }

    return res.json({ job, segments: deps.store.getSegments(job.id) });
  });

  router.post("/v1/jobs/:jobId/plan-segments", authRequired, validateBody(planSegmentsSchema), (req, res) => {
    const job = deps.store.getJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: "NotFound", message: "Job not found" });
    }

    const plan = planSegments({
      jobId: job.id,
      durationSeconds: req.body.durationSeconds,
      targetSegmentMaxMb: req.body.targetSegmentMaxMb,
      bitrateMbps: req.body.bitrateMbps,
      sizeBytes: req.body.sizeBytes,
    });

    deps.store.setSegments(job.id, plan.segments);
    deps.store.updateJob(job.id, (current) => ({
      ...current,
      status: "planned",
      segmentCount: plan.segments.length,
      updatedAt: new Date().toISOString(),
    }));

    deps.store.addEvent(
      buildEvent({
        jobId: job.id,
        type: "segments.planned",
        message: `Planned ${plan.segments.length} segments`,
        data: {
          estimatedBitrateMbps: Number(plan.estimatedBitrateMbps.toFixed(3)),
          targetSegmentMaxBytes: plan.targetSegmentMaxBytes,
          maxSegmentDurationSeconds: Number(plan.maxSegmentDurationSeconds.toFixed(3)),
        },
      }),
    );

    return res.json(plan);
  });

  router.post("/v1/jobs/:jobId/start", authRequired, validateBody(startJobSchema), async (req, res, next) => {
    try {
      const job = deps.store.getJob(req.params.jobId);
      if (!job) {
        return res.status(404).json({ error: "NotFound", message: "Job not found" });
      }

      const segments = deps.store.getSegments(job.id);
      if (!segments.length) {
        return res.status(409).json({
          error: "Conflict",
          message: "Plan segments before starting the job",
        });
      }

      const totalDurationSeconds = segments.reduce((total, segment) => total + (segment.endSeconds - segment.startSeconds), 0);
      const paymentResult = await deps.paymentsClient.reserveCredits({
        jobId: job.id,
        estimatedSeconds: totalDurationSeconds,
      });

      if (!paymentResult.ok) {
        return res.status(402).json({ error: "PaymentRequired", message: "Not enough credits" });
      }

      deps.store.updateJob(job.id, (current) => ({
        ...current,
        status: "running",
        updatedAt: new Date().toISOString(),
      }));
      deps.store.addEvent(
        buildEvent({
          jobId: job.id,
          type: "job.started",
          message: "Job started",
        }),
      );

      for (const segment of segments) {
        const task = await deps.runwayClient.submitVideoToVideoTask({ job, segment });

        deps.store.updateSegment(job.id, segment.id, (current) => ({
          ...current,
          providerTaskId: task.taskId,
          outputUrl: task.outputUrl,
          status: "completed",
        }));

        deps.store.addEvent(
          buildEvent({
            jobId: job.id,
            type: "segment.submitted",
            message: `Segment ${segment.index} submitted`,
            data: { segmentId: segment.id, providerTaskId: task.taskId },
          }),
        );
        deps.store.addEvent(
          buildEvent({
            jobId: job.id,
            type: "segment.completed",
            message: `Segment ${segment.index} completed`,
            data: { segmentId: segment.id, outputUrl: task.outputUrl },
          }),
        );
      }

      const stitchedOutputPath = `jobs/${job.id}/final.mp4`;
      const outputUrl = await deps.storageClient.getPublicUrl(stitchedOutputPath);

      deps.store.updateJob(job.id, (current) => ({
        ...current,
        status: "completed",
        outputUrl,
        updatedAt: new Date().toISOString(),
      }));

      deps.store.addEvent(
        buildEvent({
          jobId: job.id,
          type: "job.completed",
          message: "Job completed",
          data: { outputUrl },
        }),
      );

      if (req.body.notifyEmail) {
        await deps.emailClient.sendJobCompleted({
          to: req.body.notifyEmail,
          jobId: job.id,
          outputUrl,
        });
      }

      return res.json({ ok: true, jobId: job.id, status: "completed", outputUrl });
    } catch (error) {
      next(error);
      return;
    }
  });

  router.get("/v1/jobs/:jobId/events", authRequired, (req, res) => {
    const job = deps.store.getJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: "NotFound", message: "Job not found" });
    }

    return res.json({ items: deps.store.getEvents(job.id) });
  });

  return router;
}
