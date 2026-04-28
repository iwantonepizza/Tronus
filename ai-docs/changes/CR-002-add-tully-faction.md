# CR-002: Добавить фракцию Tully (Талли)

**Status:** CANCELLED BY USER
**Created:** 2026-04-22
**Cancelled:** 2026-04-22
**Author:** architect
**Related:** T-010, CR-001, DESIGN_BRIEF.md

---

## Resolution

Отменён владельцем проекта. Решение: в игре используется **8 фракций** (stark, lannister, baratheon, greyjoy, tyrell, martell, arryn, targaryen), Tully не нужна.

В T-070 дизайн-бриф был синхронизирован: убраны упоминания Tully из палитры и `FactionSlug`. Backend seed-миграция никогда и не содержала Tully, поэтому миграционных действий не потребовалось.

**Все упоминания Tully в документации удалены в рамках итерации 3 архитектора.**

---

## Оригинальная проблема (для истории)

В seed-миграции `backend/apps/reference/migrations/0002_seed_initial_data.py` отсутствовала фракция `tully`. В первой версии `frontend-design/data.js` было 9 фракций, включая Талли — это был baseline дизайн-прототипа.

Юзер уточнил: нужно 8 фракций без Tully. Задача закрыта без кода.
