# Cinemify

Upload an anime (or any clip) + choose a target “look” (preset or your own reference image + optional prompt) → get back a more **3D / realistic / cinematic** version.

Project notes and implementation plan live in **`docs/PLAN.md`**.

## Run (Docker)
Requirements: Docker Desktop.

```bash
make up
```

Then open:
- Frontend: http://localhost:5173/index.html
- Backend: http://localhost:3001/health
- Swagger UI: http://localhost:3001/docs

Stop:
```bash
make down
```
