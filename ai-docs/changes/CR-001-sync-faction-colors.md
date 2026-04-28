# CR-001: Синхронизировать цвета фракций с design system

**Status:** closed
**Closed:** 2026-04-23
**Created:** 2026-04-22
**Author:** architect
**Related:** T-010 (approved), `DESIGN_BRIEF.md`, `frontend-design/data.js`

---

## Проблема

В `backend/apps/reference/migrations/0002_seed_initial_data.py` цвета фракций не совпадают с принятой в `DESIGN_BRIEF.md` и реализованной в `frontend-design/data.js` палитрой.

| Фракция     | В миграции | В design system | Дельта |
|-------------|------------|-----------------|--------|
| stark       | `#9CA3AF`  | `#6B7B8C`       | ✗      |
| lannister   | `#B91C1C`  | `#9B2226`       | ✗      |
| baratheon   | `#F59E0B`  | `#F0B323`       | ✗      |
| greyjoy     | `#111827`  | `#1C3B47`       | ✗      |
| tyrell      | `#15803D`  | `#4B6B3A`       | ✗      |
| martell     | `#D97706`  | `#C94E2A`       | ✗      |
| arryn       | `#60A5FA`  | `#8AAFC8`       | ✗      |
| targaryen   | `#7F1D1D`  | `#5B2D8A`       | ✗      |

Если не исправить — фронт и бэк разъедутся визуально: у фронта рамки аватарок, бары в графиках и левые бордеры карточек будут в одних цветах, а у бэкенда в другой.

## Решение

Добавить новую миграцию `backend/apps/reference/migrations/0003_align_faction_colors.py` которая `update`-ит цвета у существующих записей через `RunPython`. Миграция idempotent (update_or_create не нужен — записи уже есть).

Константный источник истины — `ai-docs/DESIGN_BRIEF.md` раздел 4 «Цвета фракций».

Дополнительно: добавить поле `on_primary` (цвет текста поверх основного цвета фракции) в `Faction` — оно уже есть в дизайн-системе и экономит ветки на фронте.

**Значения `on_primary` (из DESIGN_BRIEF):**

| slug      | color    | on_primary |
|-----------|----------|------------|
| stark     | #6B7B8C  | #F0F0F0    |
| lannister | #9B2226  | #F5E6C8    |
| baratheon | #F0B323  | #1A1A22    |
| greyjoy   | #1C3B47  | #E0E6E8    |
| tyrell    | #4B6B3A  | #F0E6D2    |
| martell   | #C94E2A  | #F5E6C8    |
| arryn    *| #8AAFC8  | #1A2A3A    |
| targaryen*| #5B2D8A  | #E0D0F0    |

> **Примечание (2026-04-23):** изначально в CR был также `tully` (#4B6FA5). CR-002 отменён владельцем — используется 8 фракций, Tully не нужна. Строка удалена.

*Примечание: в DESIGN_BRIEF у `arryn` значится `#A7C4E0`, но `frontend-design/data.js` использует `#8AAFC8`; у `targaryen` бриф даёт `#2B1436`, дизайн `#5B2D8A`. **Применяем значения из `frontend-design/data.js`** — это фактическая дизайн-система, бриф устарел. DESIGN_BRIEF.md обновляется отдельно (см. ниже).

## Impact на файлы

- `backend/apps/reference/models.py` — добавить поле `on_primary = CharField(max_length=7, validators=[HEX_COLOR_VALIDATOR])`.
- `backend/apps/reference/migrations/0003_faction_on_primary_and_align_colors.py` — schema migration (добавить поле) + data migration (выставить цвета).
- `backend/apps/reference/serializers.py::FactionSerializer` — добавить `on_primary` в `fields`.
- `ai-docs/DATA_MODEL.md` раздел `reference.Faction` — задокументировать поле.
- `ai-docs/DESIGN_BRIEF.md` раздел 4 — поправить arryn и targaryen на фактические значения.

## Рождает задачу

**T-070: выполнить CR-001** — см. `BACKLOG.md`.
