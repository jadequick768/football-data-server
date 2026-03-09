# Football Data Server (SportSRC v2)

Monorepo gồm:
- `api/`: Node (Fastify) proxy + Redis cache cho SportSRC v2
- `web/`: Next.js web app (bao gồm `/watch/[matchId]` để iOS WebView mở)
- `mobile/`: Expo (React Native) iOS app (mở stream bằng WebView tới `app.tintuc360.net/watch/{matchId}`)

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

Gợi ý DNS + route:
- `api.tintuc360.net` -> reverse proxy tới service `api:3000`
- `app.tintuc360.net` -> reverse proxy tới service `web:3000` (để iOS WebView mở `/watch/{matchId}`)

Bạn có thể dùng Caddy (đã có sẵn trong `docker-compose.prod.yml`) để tự động TLS.

## Mobile (Expo)

```bash
cd mobile
npm install
npm run ios
```

Cấu hình base URLs nằm trong `mobile/app.json` (expo.extra):
- `apiBaseUrl`: https://api.tintuc360.net
- `watchBaseUrl`: https://app.tintuc360.net
