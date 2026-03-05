import type { JobEvent } from "../types/domain.js";
import { createId } from "../utils/id.js";

export function buildEvent(input: Pick<JobEvent, "jobId" | "type" | "message" | "data">): JobEvent {
  return {
    id: createId("evt"),
    jobId: input.jobId,
    type: input.type,
    message: input.message,
    data: input.data,
    timestamp: new Date().toISOString(),
  };
}
