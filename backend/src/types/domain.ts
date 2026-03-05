export type JobStatus = "created" | "planned" | "running" | "completed" | "failed";

export interface Segment {
  id: string;
  jobId: string;
  index: number;
  startSeconds: number;
  endSeconds: number;
  estimatedSizeBytes: number;
  status: "pending" | "submitted" | "completed" | "failed";
  providerTaskId?: string;
  outputUrl?: string;
}

export interface Job {
  id: string;
  inputVideoUrl: string;
  prompt?: string;
  referenceImageUrl?: string;
  outputResolution?: "720p" | "1080p" | "1440p" | "4k";
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  segmentCount: number;
  outputUrl?: string;
}

export interface JobEvent {
  id: string;
  jobId: string;
  type:
    | "job.created"
    | "segments.planned"
    | "job.started"
    | "segment.submitted"
    | "segment.completed"
    | "job.completed"
    | "job.failed";
  timestamp: string;
  message: string;
  data?: Record<string, unknown>;
}
