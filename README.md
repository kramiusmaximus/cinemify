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
- Login page: http://localhost:5173/login.html
- Backend: http://localhost:3001/health
- Swagger UI: http://localhost:3001/docs
- MySQL Adminer: http://localhost:8081

Local dev database defaults in `docker-compose.yml`:
- `MYSQL_DATABASE=cinemify`
- `MYSQL_USER=cinemify`
- `MYSQL_PASSWORD=cinemify_password`
- `MYSQL_ROOT_PASSWORD=root_password`

Default backend admin account (created at startup):
- Email: `admin@cinemify.local`
- Password: `admin12345`

Change these values for any non-local environment.

Stop:
```bash
make down
```
