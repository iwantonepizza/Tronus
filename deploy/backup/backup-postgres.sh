#!/usr/bin/env bash
# backup-postgres.sh — nightly Postgres dump for Tronus
#
# Install:
#   1. Copy this file to /opt/tronus/backup-postgres.sh
#   2. chmod +x /opt/tronus/backup-postgres.sh
#   3. Set BACKUP_DIR below (or export before calling)
#   4. Add to crontab or systemd timer (see backup-postgres.timer)
#
# Restoring a backup:
#   gunzip -c /path/to/tronus_YYYY-MM-DD.sql.gz | \
#     docker compose -f /opt/tronus/deploy/docker-compose.prod.yml \
#     exec -T db psql -U tronus tronus

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
COMPOSE_FILE="${COMPOSE_FILE:-/opt/tronus/deploy/docker-compose.prod.yml}"
BACKUP_DIR="${BACKUP_DIR:-/opt/tronus/backups}"
RETAIN_DAYS="${RETAIN_DAYS:-7}"
DB_SERVICE="${DB_SERVICE:-db}"
DB_USER="${DB_USER:-tronus}"
DB_NAME="${DB_NAME:-tronus}"

# ── Setup ─────────────────────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M)
FILENAME="tronus_${TIMESTAMP}.sql.gz"
DEST="${BACKUP_DIR}/${FILENAME}"

# ── Dump ──────────────────────────────────────────────────────────────────────
echo "[$(date)] Starting backup → ${DEST}"

docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" \
    pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$DEST"

echo "[$(date)] Backup complete: $(du -sh "$DEST" | cut -f1)"

# ── Rotate old backups ─────────────────────────────────────────────────────────
find "$BACKUP_DIR" -name "tronus_*.sql.gz" -mtime +"$RETAIN_DAYS" -delete
echo "[$(date)] Rotation done (kept last ${RETAIN_DAYS} days)"
