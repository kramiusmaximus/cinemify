# Plan

## 1) Model + inference decision (first)
### What we need
- **Video-to-video** transformation (input clip → output clip)
- Accept **reference image** and/or prompt to steer the final look
- Good temporal consistency (avoid frame flicker)
- Production-ready API (auth, pricing, rate limits, job status)

### Shortlist (2026-ish reality check)
1) **Runway (Gen-3 video-to-video / stylization)**
   - Pros: strong quality, productized, designed for v2v, supports reference-driven looks (depending on endpoint)
   - Cons: cost; stricter content policy; vendor lock-in
   - Inference: Runway hosted (async jobs)

2) **Luma Dream Machine**
   - Pros: strong image/text-to-video; generally good motion
   - Cons: v2v/stylize capabilities can be limited compared to Runway; API surface may vary
   - Inference: Luma hosted (async jobs)

3) **Stability/open-source stack (AnimateDiff / SVD / CogVideoX + temporal tricks)**
   - Pros: control + potentially cheaper at scale
   - Cons: harder to reach “frontier” quality; significant eng effort for temporal stability; GPU ops
   - Inference: self-host (Modal/RunPod/K8s) or Replicate

### Recommendation for MVP
- **Start with Runway as the primary provider** (best match to “upload clip → transform style/realism”).
- Design the backend with a **provider abstraction** so we can add Luma / others later.

### Confirmed requirements (Mark)
- **Provider:** Runway (hosted async inference)
- **Input length:** up to **1 hour** per upload (we’ll splice to provider limits)
- **Output resolution:** **user-selectable** (we’ll offer discrete presets based on provider support; optional post-upscale)
- **Latency tolerance:** up to **~1 hour** is acceptable
- **Monetization:** **subscription + monthly credits**

### Confirmed UX decisions
- **Audio:** preserve original audio by default (copy input audio onto final stitched render).
- **Subtitles:** keep as-is (we’ll avoid touching subtitle tracks; if provider output drops them, we’ll remux from source when possible).
- **Reference:** allow both **preset looks** and **user-uploaded reference images**.

### Still open
- Content boundaries / moderation requirements (we should align with Runway policy + implement basic guardrails).

## 2) Product architecture (MVP)

### Repo structure (split frontend/backend)
- `frontend/` — web UI (2000s vibe, intentionally not “Vercel template”)
- `backend/` — API service (job orchestration + segmentation + provider adapter)
- `docs/` — planning + API contract

### API contract (Swagger / OpenAPI)
- Maintain an **OpenAPI (Swagger) document** as the contract between frontend and backend.
- Backend should serve Swagger UI from that document.

### Long-form (up to 1h) render strategy
Because frontier v2v endpoints usually cap duration and/or have practical upload limits, we treat a 1h upload as a **batch of short segments**.

Pipeline (high level):
1. **Ingest**: upload original → store in S3/R2 → create `job` record.
2. **Normalize**: transcode to a known format (e.g., H.264 + AAC), extract fps/resolution, generate a proxy.
3. **Segment** (choose one):
   - **Fixed chunks by size budget** (MVP): target **≤160MB** per segment (80% of Runway’s 200MB ephemeral upload max) so we stay under the limit.
     - We’ll pick duration dynamically based on the normalized encode bitrate (e.g., with ffprobe).
   - **Scene/shot detection** (upgrade): cut on shots (PySceneDetect / ffmpeg filters) while still enforcing the ≤160MB cap; better continuity at boundaries.
   - **User-provided segments** (option): let users upload a folder/zip of pre-split segments, then we only run render+stitch.
4. **Render fan-out**: submit each segment to Runway with the same style preset (and optional prompt).
   - If the provider supports it, we can try **boundary conditioning** (e.g., feed last frame of previous segment as an init/reference) to reduce flicker.
5. **Stitch**: concatenate outputs; handle overlaps with crossfades if needed.
6. **Audio**: by default, **copy original audio** onto final video (unless you want silent output).
7. **Deliver**: final asset + optional per-segment previews; mark job complete.

Credits accounting:
- Runway’s API pricing is **credits per second** by model (no resolution multiplier is mentioned in their pricing table), but we may still want internal multipliers for product simplicity.
- Charge credits on **rendered seconds × model multiplier** (and optionally resolution/quality multipliers if we choose to).

Runway v2v resolution note:
- For `gen4_aleph` video-to-video, the OpenAPI schema marks `ratio` as **deprecated/ignored** and says output resolution is determined by the **input video**. Practically: to offer “output resolution” we either (a) **scale the input segments** to the target res before sending, or (b) render then post-upscale.

### Frontend
- Next.js (single-page UX)
- Upload widget + preset picker + job status UI

### Backend
- Separate backend service (not coupled to the frontend) responsible for:
  - Auth (later)
  - Upload signing / asset registration (later; start with mocks)
  - Job creation + status
  - Segmentation planning (≤160MB/segment)
  - Provider submission + polling
  - Stitch orchestration (later)

#### Integration strategy (abstract + mock first)
For MVP implementation order, we **abstract away** and **mock** these integrations initially:
- Runway (video-to-video tasks)
- Storage (S3/R2; presigned URLs; downloading provider outputs)
- Payments (Stripe subscriptions + credit ledger)

Define small interfaces (ports) like `RunwayClient`, `StorageClient`, `PaymentsClient` and provide:
- `mock/*` implementations for local dev
- `real/*` implementations as TODO

#### Email (TODO)
- Use a 3rd-party email service (Resend/Postmark/etc.).
- Do **not** run our own SMTP server.
- Implement interface + mock now; real provider integration later.

### Storage
- S3-compatible (AWS S3 / Cloudflare R2)
  - Store input video + reference image
  - Store output video + thumbnails

### DB
- Postgres (Supabase or managed Postgres)
  - users
  - jobs (status, provider job id, urls)
  - credits/transactions

### Auth
- Supabase Auth or Clerk (fastest path)

### Payments
- Stripe (subscriptions) + webhooks
- Monthly credit balance
- Credits-based usage (rendered seconds × multipliers → credits)

### Email
- Resend/Postmark for transactional (login, receipts, job-complete)
- Newsletter: keep separate (Mailchimp/Beehiiv) or basic list via Resend

## 3) Build sequence (after decision)
1. Scaffold Next.js app + UI skeleton
2. Auth + user model
3. Upload to storage (signed URLs)
4. Render job pipeline (queue + provider API)
5. Job status + results page
6. Stripe credits + enforcement
7. Email notifications
8. Basic admin + observability
