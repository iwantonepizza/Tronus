# Tronus — Backup setup

## Быстрый старт

```bash
# 1. Скопировать файлы на сервер
sudo mkdir -p /opt/tronus/deploy/backup /opt/tronus/backups
sudo cp deploy/backup/* /opt/tronus/deploy/backup/
sudo chmod +x /opt/tronus/deploy/backup/backup-postgres.sh

# 2. Установить systemd units
sudo cp /opt/tronus/deploy/backup/tronus-backup.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tronus-backup.timer

# 3. Проверить что timer активен
systemctl status tronus-backup.timer

# 4. Тест (запуск вручную)
sudo systemctl start tronus-backup.service
journalctl -u tronus-backup.service -n 30
ls -lh /opt/tronus/backups/
```

## Конфигурация

| Переменная | По умолчанию | Описание |
|---|---|---|
| `COMPOSE_FILE` | `/opt/tronus/deploy/docker-compose.prod.yml` | Путь к prod compose |
| `BACKUP_DIR` | `/opt/tronus/backups` | Куда сохранять дампы |
| `RETAIN_DAYS` | `7` | Сколько дней хранить |
| `DB_USER` | `tronus` | Postgres user |
| `DB_NAME` | `tronus` | Postgres database |

Изменить через export перед запуском или через `Environment=` в `.service` файле.

## Восстановление

```bash
# Выбрать нужный дамп
ls /opt/tronus/backups/

# Восстановить
gunzip -c /opt/tronus/backups/tronus_YYYY-MM-DD_HH-MM.sql.gz | \
  docker compose -f /opt/tronus/deploy/docker-compose.prod.yml \
  exec -T db psql -U tronus tronus
```

## Расписание

Каждый день в 03:00 по времени сервера. Хранится 7 последних дней.
