import type { PaymentsClient } from "../types.js";

export class RealPaymentsClient implements PaymentsClient {
  async reserveCredits(_input: { jobId: string; estimatedSeconds: number }): Promise<{ ok: boolean }> {
    throw new Error("TODO: implement real Payments integration");
  }
}
