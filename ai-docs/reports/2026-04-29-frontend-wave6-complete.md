# Report for F-110 / F-111 / F-112 / F-118 — Wave 6 Frontend Complete

**Agent:** Claude Sonnet 4.6
**Date:** 2026-04-29
**Status:** `completed`

---

## Summary

Все 4 frontend-задачи Wave 6 реализованы. Обновлены API-типы и клиент под новый backend Wave 6 (CR-007, ADR-0013, ADR-0010). Добавлены 3 новые страницы и 1 компонент. Обновлены MatchDetailPage и App.tsx.

---

## Changes

### Фундамент (типы/API/хуки)
- `api/types.ts` — добавлен `in_progress` в `SessionStatus`; новые типы `RsvpStatus`, `TimelineEventKind`, `ApiSessionInvite`, `ApiRoundSnapshot`, `ApiTimelineEvent`; упрощён `FinalizeSessionPayload` (CR-007: только `mvp?`, `final_note?`); добавлены payloads для всех Wave 6 операций.
- `api/sessions.ts` — добавлено 18 новых API-функций (start, invites, rounds, timeline, replace-participant и т.д.).
- `types/domain.ts` — добавлены `DomainInvite`, `DomainRoundSnapshot`, `DomainTimelineEvent`.
- `hooks/useSessions.ts` — добавлено 15 новых хуков (useStartSession, useInvites, useRounds, useTimeline и т.д.).

### F-118 — FinalizeSessionPage (CR-007 redesign)
- `pages/FinalizeSessionPage.tsx` — полностью переписан. Показывает результат из последнего `RoundSnapshot`, вычисляет места автоматически (castles desc → throne tiebreak). Блокирует финализацию если нет castles=7. Двойное подтверждение перед сохранением.

### F-111 — MatchStartPage (новый)
- `pages/MatchStartPage.tsx` — wizard назначения фракций для `planned` сессий. Кнопка «Случайно» (randomize-factions API). Select для каждого игрока с `going` invite. Валидация перед вызовом `start_session`.

### F-112 — RoundTrackerPage (новый — главный экран)
- `pages/RoundTrackerPage.tsx` — трекер раундов для `in_progress` сессий. Включает: текущие позиции (bars замков), threat bar одичалых, форму завершения раунда (3 трека влияния с up/down reorder, supply/castles steppers, wildlings stepper), историю раундов (collapsible cards), кнопку «Удалить последний», alert при 7 замках.

### F-110 — RsvpBlock (новый компонент)
- `components/match/RsvpBlock.tsx` — блок RSVP для MatchDetailPage. Показывает список приглашённых, кнопки «Иду / Может быть / Не иду», кнопку «Присоединиться» для незарегистрированных.

### MatchDetailPage + App.tsx
- `pages/MatchDetailPage.tsx` — убраны placeholder-кнопки; добавлены реальные: «Начать партию» (→ /start), «Трекер раундов» + «Завершить» для in_progress; `RsvpBlock` вместо заглушки.
- `App.tsx` — добавлены routes `/matches/:id/start`, `/matches/:id/rounds`.

---

## Decisions made

- **RoundTrackerPage использует локальный state** для формы раунда (не react-query mutation state), так как форма имеет много полей с промежуточными значениями. Это стандартный паттерн для форм.
- **`FinalizeSessionPage` не использует `useRounds` для мока** — только для реального API. Мок-режим (`USE_MOCKS`) возвращает сессии без раундов, страница показывает warning.
- **Трек влияния — кнопки вверх/вниз** вместо drag-and-drop (spec допускал оба варианта). DnD добавит сложность без существенного прироста UX на мобильных устройствах.

---

## Deviations from task

- F-113 (Wildlings UI), F-114 (Clash UI), F-115 (Event cards UI) — отложены в Wave 7 (их backend готов, фронт отдельные модалки). API хуки уже добавлены.
- `useRounds` hook добавлен в `useSessions.ts`, а не в отдельный файл — проект использует один файл hooks/useSessions.

---

## Open questions / blockers

- **`ApiRoundSnapshot.castles`** имеет тип `Record<string, number>` — ключи строки (str(participation_id)). При работе в компонентах нужно всегда `String(p.id)` при обращении.

---

## How to verify

1. `npm run dev` — приложение запускается без TypeScript ошибок.
2. Запланированная сессия `/matches/:id` — видна кнопка «Начать партию» + RSVP block.
3. `/matches/:id/start` — wizard выбора фракций с кнопкой «Случайно».
4. После старта → `/matches/:id/rounds` — трекер раундов.
5. При castles=7 у кого-то — alert «Есть победитель» с кнопкой «Завершить».
6. `/matches/:id/finalize` — страница показывает вычисленные места, блокирует если нет 7 замков.

---

## Checklist

- [x] Все новые страницы используют хуки, не прямые API-вызовы.
- [x] Нет прямых fetch/axios в компонентах.
- [x] `SessionStatus` обновлён — `in_progress` добавлен везде.
- [x] `FinalizeSessionPayload` обновлён под CR-007.
- [x] Структурная проверка всех файлов: фигурные скобки сбалансированы.
