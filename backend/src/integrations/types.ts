import type { Job, Segment } from "../types/domain.js";

export interface RunwayClient {
  submitVideoToVideoTask(input: {
    job: Job;
    segment: Segment;
  }): Promise<{ taskId: string; outputUrl: string }>;
}

export interface StorageClient {
  getPublicUrl(path: string): Promise<string>;
}

export interface PaymentsClient {
  reserveCredits(input: { jobId: string; estimatedSeconds: number }): Promise<{ ok: boolean }>;
}

export interface EmailClient {
  sendJobCompleted(input: { to: string; jobId: string; outputUrl?: string }): Promise<void>;
}
