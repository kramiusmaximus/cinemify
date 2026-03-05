import type { EmailClient } from "../types.js";

export class MockEmailClient implements EmailClient {
  async sendJobCompleted(_input: { to: string; jobId: string; outputUrl?: string }): Promise<void> {
    return;
  }
}
