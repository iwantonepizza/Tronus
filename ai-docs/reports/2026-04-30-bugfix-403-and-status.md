# Report: 403 fix (IsPlayerUser) + UI кракозябры (in_progress статус)

**Agent:** claude-sonnet-4-6 (coder role)
**Date:** 2026-04-30
**Status:** `completed`

---

## Summary

### Баг 1: 403 на /api/v1/sessions/{id}/invites/me/

**Корень:** `register_user` создаёт авто-активированного пользователя с `is_active=True` напрямую при создании объекта. Сигнал `ensure_profile_and_player_group_on_activation` срабатывает только при переходе `False→True`, поэтому у авто-активированных пользователей группа `player` никогда не добавлялась. `IsPlayerUser` требовал группу — 403.

### Баг 2: кракозябры/«Отменена» для активных партий

**Корень:** статус `in_progress` не был обработан в label-маппингах во всех компонентах — падал в дефолт «Отменена».

---

## Changes

**Backend — 403 fix:**
- `backend/apps/games/permissions.py` — `IsPlayerUser` теперь принимает `user.is_active=True` (без проверки группы). Группа `player` остаётся для совместимости, но не является условием доступа.
- `backend/apps/accounts/services.py` — `register_user` явно добавляет группу `player` при `auto_activated=True` сразу после создания пользователя.
- `backend/apps/accounts/management/commands/backfill_player_group.py` — команда для починки уже существующих активных пользователей без группы.
- `backend/entrypoint.prod.sh` — `backfill_player_group` запускается при каждом старте контейнера (идемпотентно).

**Frontend — статус in_progress:**
- `frontend/src/components/match/MatchCard.tsx` — добавлен `in_progress → 'В процессе'` + синий бейдж `bg-blue-500/12 text-blue-200`
- `frontend/src/pages/MatchDetailPage.tsx` — добавлен `in_progress → 'В процессе'` в строку статуса на детальной странице
- `frontend/src/pages/MatchesPage.tsx` — добавлен фильтр «В процессе» в список filterOptions

---

## Immediate action required on server

```bash
# Fix existing users without player group:
docker compose -f deploy/docker-compose.prod.yml exec backend python manage.py backfill_player_group
```

---

## Deviations from task

Нет. Оба слоя исправлений выполнены как и описал предыдущий AI-агент.
