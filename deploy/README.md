# Tronus — Production Deploy

Этот документ — для деплоя на собственный VPS, где **nginx уже работает на хосте** (не в контейнере) и обрабатывает SSL/домен.

Если ты делаешь bundled-вариант (всё в контейнерах, nginx тоже в контейнере) — смотри `docker-compose.bundled.yml`. Не рекомендуется при наличии хост-nginx.

---

## Что у тебя в итоге работает

```
                 ┌──────────────────────────────────────┐
                 │  HOST (твой VPS)                     │
                 │                                      │
  443/80 ──────▶ │  nginx (хост, systemd)               │
                 │    │                                 │
                 │    ├─ /api/    → 127.0.0.1:8000  ────│──▶ ┌──────────┐
                 │    ├─ /admin/  → 127.0.0.1:8000  ────│──▶ │ backend  │ docker
                 │    │                                 │    │ gunicorn │
                 │    ├─ /static/ → /var/www/tronus/    │    │  + Django│
                 │    │            static/              │    └────┬─────┘
                 │    │           (bind-mount)          │         │
                 │    │                                 │         │
                 │    ├─ /media/  → /var/www/tronus/    │         │
                 │    │            media/               │         ▼
                 │    │           (bind-mount)          │    ┌──────────┐
                 │    │                                 │    │ postgres │ docker
                 │    └─ /        → /var/www/tronus/    │    └──────────┘
                 │                 dist/                │
                 │                (vite build)          │
                 │                                      │
                 └──────────────────────────────────────┘
```

- **Backend** (Django + gunicorn) и **Postgres** — в Docker через `docker-compose.prod.yml`.
- **Frontend** (`dist/` от Vite) — кладётся на хост в `/var/www/tronus/dist/`. Хост-nginx отдаёт его как статику.
- **Static / media** Django — bind-mount из контейнера в `/var/www/tronus/{static,media}/` для прямой раздачи nginx (без проксирования через gunicorn).
- Backend gunicorn слушает **только** `127.0.0.1:8000`, наружу не торчит. Хост-nginx — единственная точка входа.

---

## Однократная подготовка сервера

### 1. Зависимости

```bash
sudo apt update
sudo apt install -y nginx docker.io docker-compose-plugin nodejs npm git
nginx -v
docker compose version
node --version   # ≥ 20
```

### 2. Создать host-папки для статики и медиа

```bash
sudo mkdir -p /var/www/tronus/{static,media,dist}
sudo chown -R $USER:$USER /var/www/tronus
```

### 3. Клонировать проект

```bash
cd ~
git clone <your-git-url> tronus
cd tronus
```

### 4. Конфигурация backend env

```bash
cp deploy/env/backend.prod.env.example deploy/env/backend.prod.env
nano deploy/env/backend.prod.env
```

**Обязательно заполни:**
- `SECRET_KEY` — длинный случайный (`python3 -c "import secrets;print(secrets.token_urlsafe(60))"`).
- `POSTGRES_PASSWORD` и совпадающий `DATABASE_URL`.
- `REGISTRATION_SECRET_WORD` — секретное слово регистрации.
- `ALLOWED_HOSTS` — твой домен и IP сервера.
- `CSRF_TRUSTED_ORIGINS` — `https://твой-домен.com`.
- `CORS_ALLOWED_ORIGINS` — оставь **пустым** если nginx обслуживает всё с одного домена (same-origin, рекомендуется).

```bash
# Frontend env (используется при сборке, не runtime)
cp frontend/.env.example frontend/.env
# По умолчанию там VITE_API_BASE_URL=/api/v1 — это правильно для same-origin.
```

### 5. Хостовый nginx-конфиг

```bash
sudo cp deploy/nginx-host/tronus.conf /etc/nginx/sites-available/tronus.conf
sudo ln -sf /etc/nginx/sites-available/tronus.conf /etc/nginx/sites-enabled/tronus.conf

# Отредактируй server_name под твой домен
sudo nano /etc/nginx/sites-available/tronus.conf

sudo nginx -t           # проверка синтаксиса
sudo systemctl reload nginx
```

### 6. SSL через Let's Encrypt (рекомендуется)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tronus.example.com
# certbot сам подхватит конфиг и добавит SSL-секцию
```

После certbot — открой `tronus.conf` ещё раз и проверь, что `SESSION_COOKIE_SECURE=True`, `CSRF_COOKIE_SECURE=True`, `DJANGO_SECURE_SSL_REDIRECT=True` в `backend.prod.env`.

---

## Запуск

### Первый запуск

```bash
cd ~/tronus

# 1. Сборка фронта (один раз и при каждом обновлении)
cd frontend
npm ci
npm run build
sudo rsync -a --delete dist/ /var/www/tronus/dist/
cd ..

# 2. Поднять backend + db
docker compose -f deploy/docker-compose.prod.yml up -d --build

# 3. Создать суперпользователя (один раз)
docker compose -f deploy/docker-compose.prod.yml exec backend \
  python manage.py createsuperuser

# 4. Проверить
curl -i http://127.0.0.1:8000/api/v1/reference/factions/    # backend напрямую
curl -i http://твой-домен.com/api/v1/reference/factions/    # через хост-nginx
curl -I http://твой-домен.com/                              # SPA index.html
```

### Обновление при пуше в git

```bash
cd ~/tronus
git pull

# Бэкенд
docker compose -f deploy/docker-compose.prod.yml up -d --build
# Миграции и collectstatic выполнятся автоматически через entrypoint.prod.sh.

# Фронт
cd frontend
npm ci         # если package-lock изменился; иначе можно пропустить
npm run build
sudo rsync -a --delete dist/ /var/www/tronus/dist/
cd ..

sudo systemctl reload nginx
```

---

## Полезные команды

| Что | Команда |
|-----|---------|
| Логи backend | `docker compose -f deploy/docker-compose.prod.yml logs -f backend` |
| Логи postgres | `docker compose -f deploy/docker-compose.prod.yml logs -f db` |
| Перезапустить backend | `docker compose -f deploy/docker-compose.prod.yml restart backend` |
| Стоп всего | `docker compose -f deploy/docker-compose.prod.yml down` |
| Manage shell | `docker compose -f deploy/docker-compose.prod.yml exec backend python manage.py shell` |
| Применить миграции | `docker compose -f deploy/docker-compose.prod.yml exec backend python manage.py migrate` |
| createsuperuser | `docker compose -f deploy/docker-compose.prod.yml exec backend python manage.py createsuperuser` |
| Бэкап БД | `docker compose -f deploy/docker-compose.prod.yml exec db pg_dump -U tronus tronus > backup_$(date +%Y%m%d).sql` |

---

## Алиас для удобства

```bash
echo "alias dcp='docker compose -f ~/tronus/deploy/docker-compose.prod.yml'" >> ~/.bashrc
source ~/.bashrc
# Теперь:
dcp logs -f backend
dcp restart backend
```

---

## Troubleshooting

## Uptime Monitor

Для внешнего uptime-monitor используй:

```text
GET /api/v1/health/
```

Ожидаемое поведение:
- `200` + `{"status":"ok","database":"ok","version":"0.1.0"}` при живой БД.
- `503` + `{"status":"degraded","database":"error","version":"0.1.0"}` если backend поднят, но Postgres недоступен.

Это endpoint без auth, поэтому его можно подключать в UptimeRobot, Better Stack и аналогичные сервисы.

---

## Troubleshooting

### `502 Bad Gateway` на `/api/`
Backend контейнер не отвечает.
```bash
docker compose -f deploy/docker-compose.prod.yml ps         # должен быть Up
docker compose -f deploy/docker-compose.prod.yml logs backend
curl http://127.0.0.1:8000/api/v1/reference/factions/       # напрямую без nginx
```

### `404` на `/static/...` или `/media/...`
Папка `/var/www/tronus/static` или `/media` пустая — bind-mount контейнера не сработал.
```bash
ls -la /var/www/tronus/static/    # должны быть файлы admin/, rest_framework/
docker compose -f deploy/docker-compose.prod.yml exec backend ls -la /app/staticfiles/
```
Если в контейнере есть, а на хосте нет — права. `sudo chown -R $USER:$USER /var/www/tronus`.

### `403` или CSRF errors при логине
В `backend.prod.env`:
- `CSRF_TRUSTED_ORIGINS` должен содержать **точно** тот URL, с которого фронт делает запросы.
- При HTTPS — `CSRF_COOKIE_SECURE=True`, `SESSION_COOKIE_SECURE=True`.

### Авы не отображаются
Проверь, что `/var/www/tronus/media/avatars/<user>/` создаётся при загрузке. Backend логи покажут путь.

---

## Что делать, если **нет** хост-nginx (всё в контейнерах)

Используй `docker-compose.bundled.yml`:
```bash
docker compose -f deploy/docker-compose.bundled.yml up -d --build
```
Этот вариант поднимает дополнительный nginx-контейнер на порту 8080. SSL придётся ставить через Caddy/Traefik в качестве reverse-proxy. Не рекомендуется при наличии собственного nginx на хосте.

---

## Ограничения текущего setup

- **Single host** — нет HA, бэкап вручную.
- **Gunicorn 3 workers** — норм для нагрузки до десятков RPS. Менять в `backend/Dockerfile.prod` (`--workers N`).
- **Нет мониторинга** — Sentry/Prometheus в backlog (см. Wave 8).
- **Postgres backup** — пока ручной. Автоматизация в backlog (I-007).
