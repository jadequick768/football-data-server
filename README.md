# Football Data Server (SportSRC v2)

Monorepo gồm:
- `api/`: Node (Fastify) proxy + Redis cache cho SportSRC v2
- `web/`: Next.js web app (bao gồm `/watch/[matchId]` để iOS WebView mở)

## Yêu cầu
- Docker + Docker Compose

## Cấu hình

```bash
cp .env.example .env
# điền SPORTSRC_API_KEY
```

## Chạy local bằng Docker

```bash
docker compose up --build
```

- API: http://localhost:3000
- Web: http://localhost:3001

## API Endpoints
- `GET /health`
- `GET /v1/matches?date=YYYY-MM-DD&status=inprogress|upcoming|finished`
- `GET /v1/matches/:id`
- `GET /v1/matches/:id/streams`
- `GET /v1/matches/:id/deep/:type`  (type: scores|lineups|stats|incidents|h2h|standing|graph|odds|votes|shotmap|last_matches)

## Deploy

Gợi ý route:
- `api.tintuc360.net` -> container `api:3000`
- `app.tintuc360.net` hoặc `tintuc360.net` -> container `web:3000` (compose map ra host port 3001)

Bạn có thể dùng Nginx/Caddy/Traefik trên VPS để reverse proxy + TLS.
