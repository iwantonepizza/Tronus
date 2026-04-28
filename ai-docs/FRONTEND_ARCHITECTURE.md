# FRONTEND_ARCHITECTURE.md

Production React-клиент для Tronus. Живёт в `frontend/` на корне монорепы.

**Referenece:** `frontend-design/` — HTML/JSX прототип от Claude Design. Используется как визуальный референс и источник mock-данных. НЕ копируется как есть — пересоздаётся под production стек.

---

## 1. Tech Stack

| Слой            | Выбор                          | Причина                                                        |
|-----------------|--------------------------------|----------------------------------------------------------------|
| Build tool      | Vite 5+                        | Быстрый HMR, стандартный для новых React-проектов.             |
| Language        | TypeScript 5+                  | Контракт API печатается типами, меньше runtime-ошибок.         |
| UI framework    | React 18                       | Требование из `DESIGN_BRIEF.md`.                               |
| Routing         | react-router-dom 6             | SPA-роутинг, вложенные layout routes.                          |
| Styling         | Tailwind CSS 3                 | Utility-first, быстрая верстка по дизайн-системе.              |
| Data fetching   | TanStack Query (React Query) 5 | Кеш, refetch, optimistic updates, автоматическая revalidation. |
| Forms           | react-hook-form + zod          | Типизированная валидация, совпадающая с бэком.                 |
| HTTP client     | `fetch` + тонкая обёртка       | Нет необходимости в axios. `credentials: "include"` для session-auth. |
| State (global)  | React Context + Query cache    | Для auth и theme. Никакого Redux в MVP.                        |
| Animations      | Framer Motion 11               | Page transitions, FLIP, counter animations.                    |
| Icons           | Lucide React                   | Совпадает с DESIGN_BRIEF.                                      |
| Charts          | Recharts 2                     | Для stats-экранов.                                             |
| Date/time       | date-fns                       | Без moment, без dayjs — стабильный выбор.                      |
| Testing         | Vitest + React Testing Library | Встроено в Vite.                                               |
| Lint / format   | ESLint + Prettier              | Стандарт.                                                      |

**Не используем в MVP:** Redux, Next.js (нет SSR-требования), MobX, styled-components (есть Tailwind).

---

## 2. Структура проекта

```
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── .env.example
├── .eslintrc.cjs
├── src/
│   ├── main.tsx                  ← entry
│   ├── App.tsx                   ← router
│   ├── api/                      ← API client + типы
│   │   ├── client.ts             ← базовый fetch wrapper (credentials, CSRF, error shape)
│   │   ├── types.ts              ← типы, совпадающие с ai-docs/DATA_MODEL.md
│   │   ├── auth.ts
│   │   ├── sessions.ts
│   │   ├── users.ts
│   │   ├── reference.ts
│   │   ├── stats.ts
│   │   ├── comments.ts
│   │   ├── ratings.ts
│   │   └── avatars.ts
│   ├── mocks/                    ← моки (только в dev; прозрачно сменяются на API)
│   │   ├── factions.ts
│   │   ├── modes.ts
│   │   ├── players.ts
│   │   ├── sessions.ts
│   │   └── index.ts
│   ├── components/               ← переиспользуемые
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── BottomNav.tsx
│   │   ├── match/
│   │   │   ├── MatchCard.tsx
│   │   │   ├── PlacementRow.tsx
│   │   │   └── VoteButtons.tsx
│   │   ├── player/
│   │   │   ├── PlayerPill.tsx
│   │   │   └── FactionBadge.tsx
│   │   ├── stats/
│   │   │   ├── StatTile.tsx
│   │   │   ├── WinrateBar.tsx
│   │   │   └── LeaderboardRow.tsx
│   │   └── ui/                   ← атомы
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Modal.tsx
│   │       ├── Toast.tsx
│   │       ├── Skeleton.tsx
│   │       ├── EmptyState.tsx
│   │       └── Stepper.tsx
│   ├── pages/                    ← роуты верхнего уровня (по одному файлу)
│   │   ├── HomePage.tsx
│   │   ├── MatchesPage.tsx
│   │   ├── MatchDetailPage.tsx
│   │   ├── PlayerProfilePage.tsx
│   │   ├── LeaderboardPage.tsx
│   │   ├── FactionsPage.tsx
│   │   ├── FactionDetailPage.tsx
│   │   ├── HeadToHeadPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── MyProfilePage.tsx
│   │   ├── CreateSessionPage.tsx
│   │   ├── EditSessionPage.tsx
│   │   ├── FinalizeSessionPage.tsx
│   │   ├── AvatarGeneratorPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSessions.ts
│   │   ├── useCurrentUser.ts
│   │   ├── useFactions.ts
│   │   └── useMediaQuery.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── styles/
│   │   └── globals.css
│   ├── lib/
│   │   ├── csrf.ts               ← читает cookie, возвращает X-CSRFToken
│   │   ├── dates.ts              ← formatRelative, formatDate
│   │   └── cn.ts                 ← clsx-style classnames
│   └── types/                    ← общие TS-типы
│       └── domain.ts
├── public/
│   └── (статика)
└── tests/
    └── (Vitest)
```

---

## 3. Слои и правила

### API layer (`src/api/`)

- Каждый домен — один файл (`sessions.ts`, `users.ts`).
- Каждая функция возвращает типизированный `Promise<T>`.
- Ошибки нормализуются через `client.ts` в единый `ApiError`.
- **Нет** компонентной логики в api/. Только запросы.

```typescript
// src/api/client.ts
import { getCsrfToken } from '@/lib/csrf';

const BASE = import.meta.env.VITE_API_BASE_URL; // default: /api/v1

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, string[]>;
  constructor(p: { code: string; message: string; status: number; details?: any }) {
    super(p.message);
    this.code = p.code;
    this.status = p.status;
    this.details = p.details;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (init.method && !['GET', 'HEAD'].includes(init.method)) {
    const csrf = getCsrfToken();
    if (csrf) headers.set('X-CSRFToken', csrf);
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError({
      code: body.error?.code ?? 'unknown_error',
      message: body.error?.message ?? res.statusText,
      status: res.status,
      details: body.error?.details,
    });
  }

  return res.status === 204 ? (undefined as T) : res.json();
}
```

### Query layer (`src/hooks/`)

- React Query хуки — обёртки над `api/`.
- `queryKey` — массив, первый элемент = ресурс (`['sessions']`, `['users', id]`).
- Invalidation — через `queryClient.invalidateQueries`.

### Components (`src/components/`)

- Функциональные компоненты, типизированные props.
- **Нет прямых вызовов `fetch`** — только через hooks.
- Стили — Tailwind classnames. Для условных — `cn()` helper.
- Каждый компонент из `DESIGN_BRIEF.md` раздел 8 существует.

### Pages (`src/pages/`)

- Одна страница = один файл.
- Страница собирает hooks + components, не содержит бизнес-логики.
- Обработка загрузок / ошибок / empty states — прямо в странице, через Skeleton / EmptyState компоненты.

### Mocks (`src/mocks/`)

- **Dev-only.** В prod-бандл не попадают (`import.meta.env.DEV` гейт или условный import).
- Shape **точно** совпадает с `src/api/types.ts`.
- Активируются через `VITE_USE_MOCKS=true` — тогда `api/*` подменяется на мок-реализацию (MSW или ручной switch в `client.ts`).

---

## 4. Роутинг

```
/                           → HomePage
/login                      → LoginPage
/register                   → RegisterPage
/matches                    → MatchesPage
/matches/:id                → MatchDetailPage
/matches/new                → CreateSessionPage   (auth)
/matches/:id/edit           → EditSessionPage     (auth, creator)
/matches/:id/finalize       → FinalizeSessionPage (auth, creator)
/players                    → PlayersListPage (опционально)
/players/:id                → PlayerProfilePage
/leaderboard                → LeaderboardPage
/factions                   → FactionsPage
/factions/:slug             → FactionDetailPage
/h2h                        → HeadToHeadPage
/me                         → MyProfilePage       (auth)
/me/avatar                  → AvatarGeneratorPage (auth)
*                           → NotFoundPage
```

Реализация: `react-router-dom` v6 с nested routes и `Outlet`. `AppShell` — родительский layout route, внутри `Outlet` для страниц.

---

## 5. Auth flow

1. App bootstrap → `GET /api/v1/auth/csrf/` (ставит `csrftoken` cookie).
2. App bootstrap → `GET /api/v1/auth/me/`:
   - `200` — пользователь залогинен, кладём в `AuthContext`.
   - `401` / `403` — не залогинен, UI показывает login-state.
3. Logout → `POST /api/v1/auth/logout/`, очищаем `AuthContext`, редирект на `/`.
4. Login → `POST /api/v1/auth/login/` → при успехе redirect на `/`. При `403 account_pending_approval` — показываем inline-сообщение.
5. Register → `POST /api/v1/auth/register/` → показываем экран «ждите апрува».

**Protected routes** — через `<RequireAuth>` wrapper-компонент, использующий `useAuth()`.

**Public routes** работают для anonymous — см. ADR-0005.

---

## 6. Styling и дизайн-система

### Tailwind config

В `tailwind.config.ts` регистрируем кастомные цвета из `DESIGN_BRIEF.md` раздел 4:

```ts
export default {
  theme: {
    extend: {
      colors: {
        bg: { base: '#0E0E12', elev1: '#17171F', elev2: '#1F1F2A' },
        text: { primary: '#F0E6D2', secondary: '#A8A8B3', tertiary: '#6B6B75' },
        gold: { DEFAULT: '#C9A44C', hover: '#D9B95C' },
        border: { subtle: '#2A2A36', strong: '#3A3A46' },
        faction: {
          stark: '#6B7B8C',
          lannister: '#9B2226',
          baratheon: '#F0B323',
          greyjoy: '#1C3B47',
          tyrell: '#4B6B3A',
          martell: '#C94E2A',
          arryn: '#8AAFC8',
          targaryen: '#5B2D8A',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
};
```

Использование: `bg-faction-stark`, `text-gold`, `border-border-subtle`, `font-display`.

### Faction как data

`faction.color` приходит с бэка (через `/api/v1/reference/factions/`). На фронте используем две стратегии:

1. **Статические цвета в Tailwind** — для быстрых утилит (`bg-faction-stark`).
2. **Runtime-цвет из API** — для inline-styles (рамка аватарки, бордер карточки):
   ```tsx
   <div style={{ borderColor: faction.color }} />
   ```

Оба подхода совпадают по значениям после применения CR-001.

---

## 7. Adaptivity

Breakpoints (Tailwind defaults):
- `sm` (640px) — tablet portrait
- `md` (768px) — tablet landscape
- `lg` (1024px) — desktop

Основное правило: **mobile-first.** Компонент пишется для мобилки, desktop добавляется через `md:` / `lg:` классы.

Sidebar виден на `lg:`+. BottomNav виден до `md:`. Между ними — упрощённый layout.

---

## 8. Environment variables

`frontend/.env.example`:

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_USE_MOCKS=false
VITE_APP_NAME=Tronus
```

В prod переменные выставляются при билде через CI.

---

## 9. Тесты

- `npm run test` → Vitest.
- Smoke-тесты: рендер Home, Login, Match detail с моками.
- API layer — mock-тесты `fetch` через MSW или `vi.mock`.
- Components — React Testing Library, проверяем по roles и labels, не по classnames.

В MVP coverage не обязательна, но ключевые формы (register, login, finalize) должны быть покрыты.

---

## 10. Правила для агентов, пишущих фронт

### DO

- Соблюдать структуру из раздела 2.
- Типы в `api/types.ts` и `types/domain.ts` **точно** соответствуют `ai-docs/DATA_MODEL.md`.
- Каждая новая фича — pull request с описанием, что из `frontend-design/` был референс.
- Использовать Tailwind utility-classes, не писать CSS в компонентах.
- Атомы живут в `components/ui/`. Доменные компоненты — в `components/<domain>/`.
- Переиспользовать компоненты. Если два места рисуют похожее — вынести.

### DON'T

- Не писать `fetch` напрямую в компонентах.
- Не тащить новые зависимости без согласования (Architect обновляет `package.json` или CR).
- Не копировать код из `frontend-design/` как есть — там inline styles и IIFE-модули. Пересоздаём по дизайн-системе из `tailwind.config.ts`.
- Не использовать `any` в TypeScript. Если очень надо — `unknown` + narrowing.
- Не рендерить формы через `<form>` с дефолтным submit — используем `onClick` / `react-hook-form`.
