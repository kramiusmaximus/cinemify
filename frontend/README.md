# Frontend

Minimal multi-page frontend for Cinemify using plain HTML, CSS, and JavaScript.

## Features

- Home page (`index.html`)
- Create job form (`create-job.html`) for `POST /v1/jobs`
- Jobs list (`jobs.html`) for `GET /v1/jobs`
- Job detail/status (`job.html`) for:
  - `GET /v1/jobs/:jobId`
  - `POST /v1/jobs/:jobId/plan-segments`
  - `POST /v1/jobs/:jobId/start`
- Polling on job detail page (every 5 seconds)

## Run

From repo root:

```bash
cd frontend
python3 -m http.server 5173
```

Then open:

- `http://localhost:5173/index.html`

Backend is expected at:

- `http://localhost:3001`

You can change API base URL on the Home page; it is persisted in `localStorage`.
