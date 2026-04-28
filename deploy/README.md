# Deploy Draft

Черновой production-like контур для `Tronus` по варианту A из `ai-docs/INTEGRATION_PLAN.md`.

- `frontend` — статический Vite build в nginx
- `backend` — Django API за reverse-proxy
- `db` — Postgres
- `/api/*` и `/admin/*` проксируются в Django
- `/static/*` и `/media/*` отдаёт nginx

## Быстрый smoke

```bash
cd deploy
docker compose -f docker-compose.prod.yml config
docker compose -f docker-compose.prod.yml up --build
```

Приложение будет доступно на `http://localhost:8080`.

## Важная оговорка

Это именно `draft`, а не финальный production-hardening:

- backend запускается через `gunicorn` (3 workers, timeout 60s)
- секреты и пароли в `.example` файлах — заглушки
- HTTPS/TLS и внешний ingress не настроены

Перед реальным деплоем нужно заменить секреты и включить secure-cookie настройки.
