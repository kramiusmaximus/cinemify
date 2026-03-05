import type { EmailClient } from "../types.js";

export class RealEmailClient implements EmailClient {
  async sendJobCompleted(_input: { to: string; jobId: string; outputUrl?: string }): Promise<void> {
    throw new Error("TODO: implement real Email integration");
  }
}
