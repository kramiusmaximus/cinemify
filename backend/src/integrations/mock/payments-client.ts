import type { PaymentsClient } from "../types.js";

export class MockPaymentsClient implements PaymentsClient {
  async reserveCredits(_input: { jobId: string; estimatedSeconds: number }): Promise<{ ok: boolean }> {
    return { ok: true };
  }
}
