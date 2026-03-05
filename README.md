# Cinemify

Upload an anime (or any clip) + choose a target “look” (preset or your own reference image + optional prompt) → get back a more **3D / realistic / cinematic** version.

## MVP scope
- Upload up to **1 hour** source video
- Choose a **look preset** (thumbnail grid) or upload a **reference image**
- Optional prompt
- Start a render job → wait (async) → view/download result
- **Preserve original audio**
- **Keep subtitles as-is** when possible (we won’t edit them; we’ll remux from source if the provider drops subtitle tracks)

## Provider + economics (initial)
- Primary provider: **Runway API**
- Video-to-video model: **`gen4_aleph`** (Runway-hosted inference)
- Pricing (Runway credits): `gen4_aleph` is **15 credits / second** (1 credit = **$0.01**) → **$0.15 per output second**.
- Product pricing: **subscription with monthly credits** (we’ll meter usage as rendered seconds × model multiplier; optional quality/resolution multipliers are a product decision).

## Long-form processing (1h uploads)
Runway generation jobs are practical-limit / cap constrained, so we process long videos as **segments**.

### Hard constraints we design around
- Runway ephemeral uploads max: **200MB** per file.
- We target **≤160MB per segment** (20% headroom).

### Segmentation modes
1) **Auto-split (default):**
   - Normalize/transcode (baseline encode)
   - Choose segment duration dynamically to keep each segment ≤160MB (via ffprobe bitrate estimate)
2) **Shot-based split (upgrade):**
   - Scene/shot detect, then enforce ≤160MB cap
3) **User-supplied split (option):**
   - User uploads pre-split segments (folder/zip); we only render + stitch

### Stitching
- Render each segment with consistent style settings
- Concatenate outputs; if overlaps are used, crossfade at boundaries
- Remux original audio + subtitle tracks when applicable

## Technical plan (high level)
Frontend:
- Next.js SPA UI (upload, preset picker, job progress, results)

Backend:
- API routes/service for auth, uploads, job orchestration, provider adapter (Runway)

Storage:
- S3-compatible (AWS S3 / Cloudflare R2) for inputs/outputs

DB:
- Postgres (users, jobs, segments, credit ledger)

Payments:
- Stripe subscriptions + webhooks → monthly credit balance

Email:
- Resend/Postmark (transactional + job complete)

---
More detailed notes live in `docs/PLAN.md`.
