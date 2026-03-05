import type { RunwayClient } from "../types.js";

export class MockRunwayClient implements RunwayClient {
  async submitVideoToVideoTask(input: {
    job: { id: string };
    segment: { id: string };
  }): Promise<{ taskId: string; outputUrl: string }> {
    const taskId = `rw_${input.segment.id}`;
    const outputUrl = `https://mock.runway.local/outputs/${input.job.id}/${taskId}.mp4`;
    return { taskId, outputUrl };
  }
}
