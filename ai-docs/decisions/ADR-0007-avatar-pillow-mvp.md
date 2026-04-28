# ADR-0007: Аватарка MVP — Pillow-композиция (фото + цветная рамка фракции)

**Status:** accepted
**Date:** 2026-04-21
**Deciders:** architect, owner

---

## Context

Owner хочет, чтобы у каждого игрока была персональная аватарка, ассоциированная с фракцией. AI-генерация — Phase 2. Для MVP нужен простой, работающий без внешних API, вариант.

---

## Decision

Pillow-композиция:

1. Пользователь загружает квадратное (или любое) фото через `POST /api/v1/avatars/generate/` multipart.
2. Бэкенд:
   - Валидирует: max 10 МБ, формат `JPEG/PNG/WEBP`, decode через Pillow.
   - Кадрирует в центральный квадрат.
   - Ресайзит в `512×512`.
   - Рисует **толстую цветную рамку** (цвет = `faction.color`, толщина = 24px), поверх квадратного фото.
   - Сохраняет как PNG в `MEDIA_ROOT/avatars/<user_id>/<uuid>.png`.
   - Дополнительно генерит thumbnail `128×128`.
3. Создаётся `AvatarAsset(style="basic_frame", source_photo=<original>, generated_image=<result>)`.

Всё **синхронно** в request-response цикле. Для 512×512 Pillow справляется за < 500 мс на типичном CPU.

Герб фракции (sigil overlay) — **не делаем в MVP**. Это Phase 2 отдельной задачей.

---

## Alternatives considered

| Вариант | Плюсы | Минусы | Почему не выбран |
|---------|-------|--------|------------------|
| Фото + рамка + герб фракции | Красивее | Нужны чистые SVG/PNG гербов с прозрачностью, больше кода, возможные артефакты наложения. Откладываем до Phase 2 вместе с AI-генерацией | Owner выбрал более простой вариант. |
| Только статичная аватарка фракции без фото | Нулевая инфраструктура | Все Старки одинаковые — не персонально | Против ответа owner'а. |
| AI-генерация через Replicate/OpenAI сразу | Вау-эффект | Внешний API, ключи, rate-limit, async (Celery), стоимость. Ломает «MVP без Celery» | Отложено в Phase 2. |
| Async (Celery) даже для Pillow | Готовая инфраструктура под будущее | Redis + worker ради < 500мс задачи | Overkill. При переходе на AI-генерацию добавим Celery точечно. |

---

## Consequences

### Positive
- Нулевые внешние зависимости.
- Мгновенный результат, понятный UX.
- Pillow уже в requirements для валидации upload'ов — не добавляет зависимостей.

### Negative / Trade-offs
- Синхронная обработка упирается в worker при массовой генерации — но это closed-group, массовость не ожидается.
- Если кто-то загрузит 20 МБ фото с айфона — валидация его режет. Обычный UX: ошибка с понятным сообщением.

### Neutral
- При переходе на AI-генерацию в Phase 2 модель `AvatarAsset` уже имеет поле `style` — добавляем значения `realistic`, `dark`, `heraldic` без миграции схемы. Новый сервис `generate_ai_avatar` вызывается как Celery task, старый `generate_basic_avatar` остаётся для тех, кто не хочет ждать.

---

## Implementation notes

- `apps/avatars/services.py::generate_basic_avatar(user, faction, photo_file)`.
- Валидация: `apps/avatars/validators.py::validate_image_file`.
- Composition логика: `apps/avatars/imaging.py` — чистая функция, легко unit-тестить без Django.
- Storage: дефолтный `FileSystemStorage` для dev, в prod — S3-compatible (отдельный ADR при деплое).

---

## Revisit when

- Пользователи просят разные стили → Phase 2, AI-генерация.
- Нужен герб поверх фото → расширяем Pillow-композицию или переходим на AI.
