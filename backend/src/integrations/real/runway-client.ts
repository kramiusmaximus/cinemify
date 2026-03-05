import type { RunwayClient } from "../types.js";

export class RealRunwayClient implements RunwayClient {
  async submitVideoToVideoTask(_input: {
    job: { id: string };
    segment: { id: string };
  }): Promise<{ taskId: string; outputUrl: string }> {
    throw new Error("TODO: implement real Runway integration");
  }
}
