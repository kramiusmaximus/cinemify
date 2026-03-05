import type { Job, JobEvent, Segment } from "../types/domain.js";

export class InMemoryStore {
  private jobs = new Map<string, Job>();
  private segmentsByJob = new Map<string, Segment[]>();
  private eventsByJob = new Map<string, JobEvent[]>();

  createJob(job: Job): Job {
    this.jobs.set(job.id, job);
    this.segmentsByJob.set(job.id, []);
    this.eventsByJob.set(job.id, []);
    return job;
  }

  listJobs(): Job[] {
    return [...this.jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  updateJob(jobId: string, updater: (job: Job) => Job): Job | undefined {
    const current = this.jobs.get(jobId);
    if (!current) return undefined;
    const updated = updater(current);
    this.jobs.set(jobId, updated);
    return updated;
  }

  setSegments(jobId: string, segments: Segment[]): void {
    this.segmentsByJob.set(jobId, segments);
  }

  getSegments(jobId: string): Segment[] {
    return this.segmentsByJob.get(jobId) ?? [];
  }

  updateSegment(jobId: string, segmentId: string, updater: (segment: Segment) => Segment): Segment | undefined {
    const segments = this.segmentsByJob.get(jobId);
    if (!segments) return undefined;
    const index = segments.findIndex((segment) => segment.id === segmentId);
    if (index < 0) return undefined;
    const updated = updater(segments[index]);
    segments[index] = updated;
    this.segmentsByJob.set(jobId, segments);
    return updated;
  }

  addEvent(event: JobEvent): void {
    const events = this.eventsByJob.get(event.jobId) ?? [];
    events.push(event);
    this.eventsByJob.set(event.jobId, events);
  }

  getEvents(jobId: string): JobEvent[] {
    return this.eventsByJob.get(jobId) ?? [];
  }
}
