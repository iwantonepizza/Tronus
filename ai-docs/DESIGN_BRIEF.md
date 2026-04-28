# DESIGN BRIEF — GOT Tracker

Полный бриф для Claude Design. Передаётся одним файлом. Цель — получить готовый интерактивный многостраничный прототип (React + Tailwind) со всеми основными экранами, работающий на мок-данных, с чистым контрактом данных, который потом легко заменить на реальный API.

---

## 1. Продукт

**Что это:** closed-group web-приложение для учёта партий настольной «Игры престолов» среди друзей.

**Не** публичный сервис, **не** игровая платформа, **не** мобильное приложение. Это web-приложение, которое откроет ~10 человек в браузере (и на телефоне, и на ноуте).

**Основная ценность — статистика метагейма.** Не просто «вбил результат», а живой дашборд: кто за что играет, кто кого обыгрывает, какие фракции в каком режиме сильнее. Сайт должен выглядеть **как сервис, которым хочется пользоваться после каждой партии.**

---

## 2. Тон, эстетика, настроение

- **Fantasy medieval, но современный.** Тёмная палитра, золотые акценты, серифные заголовки, но чистые современные lайауты (cards, grids, не попытка стилизовать под средневековый пергамент).
- **Серьёзная статистика + самоирония.** Винрейты и графики — строго. Раздел голосования «корона / говно» — с юмором (плашечки, иконки, анимации).
- **Dark mode by default.** Light mode опционально, но вторичен. Партии играются вечерами, приложение открывают вечером, темный фон — норма.
- **Цвета фракций — драйверы визуала.** Они несут огромную часть эмоций: кто ты в партии, определяется цветом.

### Правовые ограничения (важно)

Проект — фанатский, personal use. Но дизайн:

- **Не копировать** кадры из HBO-сериала, фотографии актёров, точные логотипы Fantasy Flight Games, обложки коробки игры.
- **Не генерировать** гербы в точности как в книгах/сериале (лютоволка Старков, льва Ланнистеров и т.п.) — использовать **абстрактные символы-метафоры**: волчья морда-силуэт, лев-силуэт, кракен-силуэт, но стилизованные, не воспроизведение официальных.
- Названия домов (Starks, Lannisters etc.) — **использовать свободно**, это общие термины.
- Цвета домов — **использовать свободно**, это цветовая традиция, не защищаемая.

---

## 3. Технические параметры

- **Стек:** React + Vite + Tailwind CSS. TypeScript предпочтительно.
- **Роутинг:** React Router (многостраничная SPA).
- **Анимации:** Framer Motion + Tailwind transitions.
- **Иконки:** Lucide Icons.
- **Графики:** Recharts (или Chart.js, но Recharts проще в React).
- **Шрифты:** Google Fonts — Cinzel (заголовки), Inter (текст), JetBrains Mono (числа статистики).
- **Адаптив:** mobile-first, три breakpoint'а:
  - mobile: 360–639 px
  - tablet: 640–1023 px
  - desktop: ≥1024 px
- **Мок-данные:** инлайн как TypeScript-объекты в `src/mocks/`. Формат **точно** как в разделе 10 — чтобы подмена на fetch была переписыванием одной функции.

---

## 4. Design tokens

### Цвета — Dark theme (primary)

```css
/* Background */
--bg-base: #0E0E12;           /* основной фон */
--bg-elev-1: #17171F;         /* карточки */
--bg-elev-2: #1F1F2A;         /* приподнятые элементы, модалки */

/* Text */
--text-primary: #F0E6D2;      /* заголовки, важное, оттенок пергамента */
--text-secondary: #A8A8B3;    /* вторичный текст */
--text-tertiary: #6B6B75;     /* подписи, метки */

/* Accent */
--accent-gold: #C9A44C;       /* главный акцент, кнопки, активные states */
--accent-gold-hover: #D9B95C;

/* Feedback */
--success: #4F7D4F;
--danger: #B73E3E;
--warning: #D9883E;
--info: #4B6FA5;

/* Borders */
--border-subtle: #2A2A36;
--border-strong: #3A3A46;
```

### Цвета — Light theme (secondary)

```css
--bg-base: #F6F1E8;           /* пергаментный */
--bg-elev-1: #FFFFFF;
--bg-elev-2: #FAF6ED;
--text-primary: #1A1A22;
--text-secondary: #4B4B55;
--text-tertiary: #7B7B85;
--accent-gold: #A88838;
--border-subtle: #E4DDD0;
```

### Цвета фракций

```ts
const FACTION_COLORS = {
  stark:     { primary: '#6B7B8C', onPrimary: '#F0F0F0', label: 'Старки' },     // steel grey-blue
  lannister: { primary: '#9B2226', onPrimary: '#F5E6C8', label: 'Ланнистеры' }, // crimson
  baratheon: { primary: '#F0B323', onPrimary: '#1A1A22', label: 'Баратеоны' },  // royal gold
  greyjoy:   { primary: '#1C3B47', onPrimary: '#E0E6E8', label: 'Грейджои' },   // kraken teal
  tyrell:    { primary: '#4B6B3A', onPrimary: '#F0E6D2', label: 'Тиреллы' },    // greenhouse green
  martell:   { primary: '#C94E2A', onPrimary: '#F5E6C8', label: 'Мартеллы' },   // sunspear orange
  arryn:     { primary: '#8AAFC8', onPrimary: '#1A2A3A', label: 'Аррены' },     // sky pale blue
  targaryen: { primary: '#5B2D8A', onPrimary: '#E0D0F0', label: 'Таргариены' }, // dark violet (dragon mode)
};
```

Цвет фракции — всегда ассоциирован с игроком в контексте партии. На аватарках — рамка этого цвета. В таблицах — левый бордер карточки. В графиках — сегмент этого цвета.

### Типография

```
h1: Cinzel 600, 40/48 (desktop), 28/36 (mobile)
h2: Cinzel 600, 28/36 / 22/30
h3: Cinzel 500, 20/28 / 18/26
body: Inter 400, 16/24
body-sm: Inter 400, 14/20
caption: Inter 500, 12/16, uppercase, letter-spacing 0.08em
number-display: JetBrains Mono 600, 32–64 (для крупных цифр статистики)
number-inline: JetBrains Mono 500, 16 (для чисел в таблицах)
```

### Spacing & radius

- spacing шкала Tailwind (4, 8, 12, 16, 24, 32, 48, 64)
- radius: `sm=6`, `md=12`, `lg=16`, `xl=24`, `full` (для pill)
- shadow: мягкие большие размытия в dark-theme, например `0 10px 40px -10px rgba(0,0,0,0.6)`

### Grid

- desktop: 12-col, gutter 24, max content width 1280, side padding 32
- tablet: 8-col, gutter 20, side padding 24
- mobile: 4-col, gutter 16, side padding 16

---

## 5. Карта экранов

### Публичные (anonymous может смотреть)

1. **Home / Overview** — главная с дашбордом
2. **Matches list** — лента матчей с фильтрами
3. **Match detail** — карточка партии со всей информацией
4. **Player profile** — публичный профиль игрока со статистикой
5. **Leaderboards** — рейтинги по нескольким метрикам
6. **Factions overview** — статистика по всем фракциям
7. **Faction detail** — одна фракция детально
8. **Head-to-Head** — сравнение двух игроков
9. **Login**
10. **Register** (с экраном «ждите апрува»)

### Приватные

11. **My profile** — свой профиль, редактирование
12. **Create session** — создать новую партию (план или готовый результат)
13. **Edit session** — редактирование плановой партии (состав, режим)
14. **Finalize session** — flow завершения партии (места, замки, раунды, причина)
15. **Avatar generator** — генератор аватарки
16. **Notifications** — уведомления

### Admin (lite-панель для owner'а)

17. **Pending users** — очередь на апрув
18. **Reference management** — справочники (факции, режимы, колоды) — опционально, Django admin уже это покрывает

### Phase 2 экраны (делаем заранее визуал, логика условная)

19. **RSVP widget** (встроен в Match detail плановой партии)
20. **Achievements page** — ачивки на профиле
21. **Seasons page** — сезоны
22. **Tournaments** — турниры

**Итого ~22 экрана.** Это много, но 90% визуальной работы — в ~6 ключевых экранах (1, 3, 4, 5, 6, 14). Остальные — вариации.

---

## 6. Глобальный layout — AppShell

### Desktop (≥1024)

```
┌──────────────────────────────────────────────────────────────┐
│ TopBar: [Logo]      [Search]       [Notifications] [Avatar] │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                 │
│ Sidebar    │  Main content                                   │
│            │                                                 │
│ Overview   │                                                 │
│ Matches    │                                                 │
│ Players    │                                                 │
│ Leaders    │                                                 │
│ Factions   │                                                 │
│ H2H        │                                                 │
│ ───        │                                                 │
│ New match+ │                                                 │
│            │                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

- Sidebar: 240px, dark bg, иконки + текст, активный пункт подсвечен золотой заливкой слева.
- TopBar: 64px, sticky, с блюром при скролле.
- Search: глобальный (партии, игроки), открывает палитру (cmd+k).
- «+ Новая партия» — заметная золотая кнопка в низу sidebar, pulse-анимация раз в 10 сек как привлекалка.

### Mobile (<640)

```
┌──────────────────────────────────┐
│ TopBar: [Logo] ... [Avatar]      │
├──────────────────────────────────┤
│                                  │
│  Main content                    │
│  (scrollable)                    │
│                                  │
├──────────────────────────────────┤
│ Bottom nav:                      │
│ [Home] [Matches] [+] [Stats] [Me]│
└──────────────────────────────────┘
```

- Bottom nav: 64px, 5 слотов, центральный «+» — FAB с поднятием над ровнем, золотой.
- На клик «+» — bottom sheet с выбором «Запланировать» / «Записать сыгранную».
- Search — иконка в TopBar, открывает полноэкранный поиск.

---

## 7. Экраны — детальное описание

### 7.1 Home / Overview — главная

**Цель:** человек открыл сайт, за 5 секунд видит пульс компании.

**Структура (desktop, сверху вниз):**

1. **Hero-блок:** «Ближайшая партия» — карточка на всю ширину. Дата, время, режим, список подтверждённых участников с аватарками. CTA «Я иду» / «Под вопросом» / «Не иду». Если партии запланированной нет — «Запланировать новую игру» с золотой кнопкой.

2. **Ряд плиток статистики (4 штуки в grid 4-col):**
   - Всего партий сыграно
   - Активных игроков
   - Самая популярная фракция (лого + название)
   - Текущий лидер по побед

3. **«Последние партии»** — горизонтальный scroll-ряд из 5–8 карточек партий (компонент `MatchCard`, см. раздел 8).

4. **Два столбца (2×6):**
   - **Слева**: топ-5 игроков по винрейту (мини-лидерборд).
   - **Справа**: «Фракции в метагейме» — диаграмма winrate по фракциям (горизонтальные бары, цвет каждой = цвет фракции).

5. **Блок «Фан-факты»** — 3 карточки:
   - «Самая длинная партия: 12 раундов, 4 часа»
   - «Самый быстрый камбэк: Иван с 7-го места до 1-го за 3 раунда»
   - «Легендарный момент» — с иконкой короны.

**Mobile:** всё в одну колонку, горизонтальные ряды остаются горизонтальными (swipe).

**Анимации:**
- При загрузке — staggered fade-in блоков сверху вниз, 80ms задержка между блоками.
- Числа в плитках статистики — count-up от 0 до значения, 600ms.
- Hero-карточка: при наведении на фракционные аватарки — bounce + tooltip с ником.

### 7.2 Matches list

**Цель:** лента всех партий с фильтрами.

**Desktop:**
- Левая sidebar-колонка (260px) с фильтрами:
  - Статус (запланирована / сыграна / отменена) — chips
  - Режим — chips
  - Колода — chips
  - Игрок — multi-select
  - Фракция — multi-select
  - Диапазон дат
  - Кнопка «Сбросить»
- Правая колонка — лист `MatchCard` (2 колонки grid, или 1 col при узких), сортировка: «Новые» / «Старые» / «Длинные по раундам».

**Mobile:** фильтры сворачиваются в кнопку-модалку с иконкой воронки. Список — одна колонка.

**States:**
- Empty: иллюстрация + «Партий пока нет. Сыграйте первую!» + кнопка.
- Loading: 6 skeleton-карточек с shimmer.
- Error: «Что-то пошло не так, попробуйте обновить.»

### 7.3 Match detail — ключевой экран

**Цель:** полная карточка партии, всё про неё, включая комментарии и голоса.

**Layout:**

```
[Hero]  Status badge | Date, time | Mode | Deck
        #Match-142

[Result board]
┌─────────────────────────────────────────┐
│ 🏆 1  [ava] Nickname    House Stark    │ ← row цвет фракции слева
│    2  [ava] Nickname    House Lannister│
│    3  [ava] Nickname    House Tyrell   │
│    4  [ava] Nickname    House Greyjoy  │
└─────────────────────────────────────────┘

[Outcome summary]
- Rounds played: 9
- End reason: 7 castles by Stark
- MVP: Nickname

[Votes section] — корона/говно каждому от каждого
[Comments thread] — вертикальный список + form ввода

[Sidebar widgets] (desktop only):
- «Эта партия в цифрах» — 4 плитки
- «Между участниками» — мини-H2H-стрелочки
```

**Детальный `Result board`:**
- Для каждого игрока: место (крупная цифра слева), аватарка с цветной рамкой фракции, никнейм, название фракции, число замков (иконка замка + число).
- 1-е место: тонкий золотой фон карточки, иконка короны.
- Hover на строке игрока → подсветка + tooltip «Профиль».
- Клик → переход в профиль игрока.

**`Votes section`:**
- Для каждой пары «участник X → участник Y» (где X != Y, оба участвовали в партии, current user = X) — две кнопки:
  - 👑 Корона (gold)
  - 💩 Говно (muted danger)
- Если уже проголосовал — кнопка активна, можно поменять (если < 24ч).
- Если прошло 24ч — кнопки disabled, показывается тултип.
- Для anonymous — секция read-only с агрегатом: «Иван получил 2 короны, 1 говно».

**`Comments thread`:**
- Каждый комментарий: аватарка, ник, текст, время (относительное — «5 минут назад»).
- Автор видит кнопку «Изменить/Удалить» на hover.
- Форма ввода внизу (sticky на mobile).
- Для anonymous — форма заменяется на «Войдите, чтобы написать».
- **Polling:** при фокусе на окне и каждые 30s фетч новых, визуально подсвечиваем новые (короткая золотая полоса слева, fade 1.5s).

**Анимации:**
- Клик на «корона» — золотой particle burst из кнопки + pulse аватарки голосуемого.
- Клик на «говно» — коричневый небольшой dust puff.
- Новый комментарий после polling — slide-in сверху.
- При переходе на экран — hero-блок делает scale-up от 0.96 до 1 (200ms).

### 7.4 Player profile

**Цель:** всё про конкретного игрока.

**Hero:**
- Крупная аватарка слева (с рамкой любимой фракции), справа — никнейм h1, подпись «играет с <date_joined>», счётчики «N партий, N побед».
- Кнопка «Head-to-Head с ним» (открывает H2H с этим игроком vs current user).
- Для owner своего профиля — кнопка «Редактировать профиль».

**Табы:** `Overview` / `Matches` / `Factions` / `Achievements` / `Votes` (пришедшие ему).

**Overview:**
- Plitki (2×4): всего партий, побед, винрейт, среднее место, среднее число замков, самая играемая фракция, лучшая фракция (по винрейту), худшая.
- График «Динамика винрейта по последним 20 партиям» — линия.
- «Текущая серия» — большая цифра и пиктограмма (win streak / loss streak).
- «Последние 10 партий» — мини-таблица с иконкой места и фракцией.

**Matches:** обычный список `MatchCard` отфильтрованный по этому игроку.

**Factions:** таблица «Фракция | Партий | Побед | Винрейт | Среднее место | Среднее замков». Каждая строка — цветной левый бордер фракции.

**Achievements:** grid из карточек ачивок (полученные — яркие, ненакопленные — тусклые с прогрессом «3/10»).

**Votes:** «получено корон — N», «получено говна — M», график по последним 20 партиям.

**Mobile:** табы становятся горизонтальным scroll, plitki в 2 столбца.

### 7.5 Leaderboards

**Цель:** рейтинги.

**Структура:**
- Переключатель метрики (pill-группа): `Winrate` / `Победы` / `Партий` / `Короны` / `Говно` / `Среднее место`.
- Таблица топ-20: позиция (крупная), аватарка, ник, метрика (крупным числом), подпись «из N партий».
- Топ-3 выделены: 🥇🥈🥉 + фон с лёгкой градиентной подсветкой (gold / silver / bronze).

**Анимации:**
- При смене метрики — rows пересобираются с анимацией перемещения (FLIP animation через Framer Motion layoutId).

### 7.6 Factions overview

**Цель:** метагейм по фракциям.

- Grid карточек фракций (3 col desktop, 1 col mobile).
- Каждая карточка: фон — градиент из цвета фракции → чёрный; герб-силуэт крупно по центру; название; 3 числа (партий / побед / винрейт).
- Hover: градиент усиливается, герб slight scale.
- Клик → Faction detail.

### 7.7 Faction detail

- Hero с большим гербом и цветным градиентом.
- Плитки: всего партий, побед, винрейт, среднее место, среднее замков.
- График «Винрейт по режимам» (bar chart).
- «Лучшие игроки за эту фракцию» — лидерборд топ-5 по винрейту на этой фракции.
- «Типичные оппоненты» — кто чаще всего стоит в партиях с этой фракцией.

### 7.8 Head-to-Head

**Цель:** сравнение двух игроков.

- Два селектора игроков сверху.
- Hero: две аватарки с «VS» между ними.
- Плитки:
  - Партий сыграно вместе
  - Побед X / побед Y
  - Кто чаще на более высоком месте
  - Их любимые фракции
- Таблица «Партии, где оба играли» — список `MatchCard` с подсветкой мест обоих.

### 7.9 Login / 7.10 Register

**Минималистично, но атмосферно.**
- Фон: тёмный с декоративным паттерном (сплющенные гербы с низкой opacity).
- Центрированная карточка 400px.
- Register: email, password, nickname. После отправки — экран «Заявка отправлена. Когда владелец апрувит вас, сможете войти.» с иконкой песочных часов.
- Login: email + password. Если backend вернул `account_pending_approval` — inline-сообщение «Ждёте апрува, потерпите».

### 7.11 My profile (edit)

- Форма: nickname, favorite_faction (dropdown с цветными плашками), bio.
- Блок «Аватар»: превью текущей аватарки, галерея старых (с кнопкой «сделать текущей»), кнопка «создать новую» → ведёт на 7.15.

### 7.12 Create session

**Два режима — через pill-переключатель сверху:**

**A. Запланировать на будущее:**
- Форма: дата+время (date/time picker), режим (cards 2×2 с иконками: Classic / Quests / Alternative / Dragons, каждая показывает диапазон игроков), колода (3 chip), planning_note (textarea).
- Шаг «Пригласить игроков»: поиск по нику, добавление в список. Для каждого — прикрепить фракцию (dropdown со списком доступных, уже выбранные — disabled).
- Кнопка «Запланировать» → переход на Match detail.

**B. Записать только что сыгранную:**
- Те же поля + сразу переход к Finalize flow.

**Анимации:**
- Переключение A/B — slide-transition.
- Выбор режима — selected card slight scale + gold border.

### 7.13 Edit session

То же что Create (A), но pre-filled. Нельзя, если `status=completed`.

### 7.14 Finalize session — ВАЖНЫЙ flow

**Цель:** за 1–2 минуты владелец партии вводит результат.

**Шаги (wizard с progress-bar):**

**Step 1 — Места.**
Список участников в drag-and-drop порядке. Сверху — «1-е место», перетаскиваешь. Каждая строка: аватарка, ник, фракция с цветом. При перетаскивании — smooth reorder animation.

**Step 2 — Замки.**
Для каждого игрока — number stepper (0–15). Визуально иконка замка + число, нажатие +/-.

**Step 3 — Детали игры.**
- Rounds played (number, 1–20).
- End reason (radio cards): `7 замков у Х` (автозаполняется победителем если у него 7) / `Таймер` / `Закончились раунды` / `Досрочно` / `Другое`.
- MVP (optional, select из участников).
- Final note (textarea).

**Step 4 — Подтверждение.**
Превью result board как на Match detail. Кнопка «Финализировать» — золотая, большая.

**Анимации:**
- При успешной финализации — **confetti** (react-confetti) из центра + аудио-пинг (опционально, тихо).
- Плавный переход на Match detail созданной партии.
- Цвета конфетти — цвет победившей фракции.

### 7.15 Avatar generator

**Цель:** сделать свою аватарку.

**Layout:**
- Слева — превью (круглая область 320×320), обновляется в реальном времени.
- Справа — контролы:
  - Загрузить фото (drag-drop зона + кнопка).
  - Выбрать фракцию (grid цветных плашек, активная — золотая окантовка).
  - Толщина рамки (slider 8–40 px, default 24).
  - Кнопка «Сохранить как новую».
- Ниже — «Мои аватарки» — галерея, каждая с кнопкой «Сделать текущей» / «Удалить».

**Анимации:**
- При смене фракции — цвет рамки превью плавно перетекает (300ms).
- При сохранении — превью «вспыхивает» и появляется в галерее с stagger.

### 7.16 Notifications

Простой список карточек:
- «Артём запланировал партию на завтра в 19:00» — с CTA «Посмотреть».
- «Иван поставил тебе корону в партии #142» — с CTA «Ответить».
- «Твоя партия начнётся через час.»

Mobile: fullscreen. Desktop: dropdown из TopBar.

### 7.17–7.18 Admin lite

**Pending users:** таблица с кнопкой «Апрувить». Запасной путь — Django admin уже работает, но на сайте удобнее.

**Reference:** список факций/режимов/колод с inline-редактированием. Можно скрыть и отправить owner'а в Django admin.

### 7.19 RSVP widget (Phase 2, но в прототипе рисуем)

Встроен в Match detail плановой партии:
- Для каждого приглашённого — плашка: ava + ник + статус (going / maybe / not going / pending).
- Текущий user видит переключатель под собой.
- Админ сессии может добавить/убрать приглашённых.

### 7.20 Achievements

Grid карточек. Каждая: иконка (крупная, в цвете), название, описание, прогресс (progress bar). Полученная — подсвечена, с датой получения. Неполученная — чёрно-белая.

Примеры ачивок:
- Первая победа
- 10 партий за Старков
- Хет-трик (3 победы подряд)
- Король метагейма (10 корон)
- Диванный стратег (комментарий в 20 партиях)
- Победа в каждом режиме

### 7.21 Seasons

- Селектор сезона сверху.
- Внутри — копия Overview, но отфильтрованная по сезону.
- Лидерборд сезона с наградами «Чемпион сезона».

### 7.22 Tournaments

- Список турниров (карточки).
- Детали турнира: таблица результатов + сетка матчей + призёры.

Phase 3 визуал, можно сделать минималистично.

---

## 8. Переиспользуемые компоненты

Важно — Claude Design должен создать их как отдельные компоненты с чистыми props, чтобы потом легко подключать реальные данные.

| Компонент | Props | Где используется |
|-----------|-------|------------------|
| `AppShell` | `children`, `user` | Все страницы |
| `Sidebar` | `currentRoute` | AppShell desktop |
| `BottomNav` | `currentRoute` | AppShell mobile |
| `TopBar` | `user`, `notifications` | AppShell |
| `MatchCard` | `match` (полная структура, см. раздел 10) | Matches list, Home, Profile |
| `PlacementRow` | `participation` | Match detail result board |
| `PlayerPill` | `user`, `faction?`, `size` | Везде где упоминается игрок |
| `FactionBadge` | `factionSlug`, `size`, `showLabel` | Повсеместно |
| `StatTile` | `label`, `value`, `icon?`, `trend?`, `countUp?` | Home, Profile, Faction |
| `VoteButtons` | `matchId`, `toUser`, `currentVote`, `editable` | Match detail |
| `Comment` | `comment`, `canEdit`, `canDelete` | Match detail |
| `CommentThread` | `matchId`, `comments`, `onPost` | Match detail |
| `LeaderboardRow` | `rank`, `user`, `metricValue`, `metricLabel` | Leaderboard, Home mini |
| `WinrateBar` | `faction`, `value`, `max` | Home, Factions |
| `EmptyState` | `icon`, `title`, `description`, `cta?` | Везде |
| `LoadingSkeleton` | `variant` (card / row / tile) | Везде |
| `Toast` | `message`, `type` | Глобально |
| `ConfirmDialog` | `title`, `onConfirm`, `onCancel` | Удаления, финализация |
| `AvatarUploader` | `onChange`, `factionColor` | Avatar generator |
| `NumberStepper` | `value`, `onChange`, `min`, `max`, `icon` | Castles input |
| `Stepper` | `steps`, `currentStep` | Finalize wizard |

---

## 9. Анимации и микро-интеракции

**Принципы:**
- Все анимации < 400ms, дефолт 200ms.
- Easing: `ease-out` для входящих, `ease-in` для исходящих.
- `prefers-reduced-motion` — отключает анимации.

**Обязательные:**
1. **Page transitions** между роутами — fade + slide-up 200ms.
2. **Cards hover** (desktop) — lift (`translateY(-2px)`) + shadow intensify + tiny scale 1.01, 150ms.
3. **Number count-up** в `StatTile` — 600ms ease-out при появлении во viewport (IntersectionObserver).
4. **Skeleton shimmer** — 1.5s loop, градиент движется слева направо.
5. **Confetti** на финализации партии — 3 секунды, цвет фракции победителя.
6. **Vote button press** — crown: gold particle burst 8 шт, разлёт + fade 600ms. Shit: dust puff brown.
7. **Faction color transition** при смене фракции в avatar generator — interpolate HEX 300ms.
8. **Leaderboard reorder** при смене метрики — FLIP animation 400ms (Framer Motion `layout`).
9. **Bottom nav FAB** — при клике на «+» sheet выезжает снизу 300ms ease-out.
10. **Navigation active indicator** — gold bar слева от активного пункта, animate при смене.

**Необязательные (если остаётся бюджет):**
- Parallax-эффект на hero-блоках.
- Subtle float animation на гербах фракций (медленный sin-wave 4s).
- «Dust» particles на фоне login/register экранов.

---

## 10. Mock-данные — контракт

Размещаются в `src/mocks/`. Когда подключится API — эти же shape отдаёт бэк, меняется только source функции (было `import { matches } from 'mocks'`, станет `const matches = await fetch('/api/v1/sessions/')`).

```ts
// src/mocks/types.ts

export type FactionSlug =
  | 'stark' | 'lannister' | 'baratheon' | 'greyjoy'
  | 'tyrell' | 'martell' | 'arryn' | 'targaryen';

export interface Faction {
  slug: FactionSlug;
  name: string;
  color: string;
  sigilUrl: string;
}

export interface GameMode {
  slug: 'classic' | 'quests' | 'alternative' | 'dragons';
  name: string;
  minPlayers: number;
  maxPlayers: number;
}

export interface Deck {
  slug: 'original' | 'expansion_a' | 'expansion_b';
  name: string;
}

export interface PublicUser {
  id: number;
  nickname: string;
  favoriteFaction: FactionSlug | null;
  currentAvatarUrl: string | null;
  dateJoined: string; // ISO
}

export interface Participation {
  id: number;
  user: PublicUser;
  faction: FactionSlug;
  place: number | null;   // null пока не финализирована
  castles: number | null;
  isWinner: boolean;
}

export interface Outcome {
  roundsPlayed: number;
  endReason: 'castles_7' | 'timer' | 'rounds_end' | 'early' | 'other';
  mvp: PublicUser | null;
  finalNote: string;
}

export interface MatchComment {
  id: number;
  author: PublicUser;
  body: string;
  createdAt: string;
  editedAt: string | null;
}

export interface MatchVote {
  id: number;
  fromUser: PublicUser;
  toUser: PublicUser;
  voteType: 'positive' | 'negative';
  createdAt: string;
}

export interface MatchSession {
  id: number;
  scheduledAt: string;
  mode: GameMode;
  deck: Deck;
  createdBy: PublicUser;
  status: 'planned' | 'completed' | 'cancelled';
  planningNote: string;
  participations: Participation[];
  outcome: Outcome | null;
  commentsCount: number;
  votes: MatchVote[];
}

export interface PlayerStats {
  user: PublicUser;
  totalGames: number;
  wins: number;
  winrate: number;             // 0..1
  avgPlace: number;
  avgCastles: number;
  favoriteFaction: FactionSlug;
  bestFaction: { faction: FactionSlug; winrate: number };
  worstFaction: { faction: FactionSlug; winrate: number };
  currentStreak: { type: 'win' | 'loss'; count: number };
  last10: Array<{ matchId: number; place: number; faction: FactionSlug }>;
  crownsReceived: number;
  shitsReceived: number;
}

export interface FactionStats {
  faction: Faction;
  totalGames: number;
  wins: number;
  winrate: number;
  avgPlace: number;
  avgCastles: number;
  byMode: Array<{ mode: GameMode['slug']; winrate: number; games: number }>;
  topPlayers: Array<{ user: PublicUser; winrate: number; games: number }>;
}

export interface OverviewData {
  nextMatch: MatchSession | null;
  recentMatches: MatchSession[];
  totalMatches: number;
  activePlayers: number;
  mostPopularFaction: { faction: Faction; games: number };
  currentLeader: { user: PublicUser; wins: number };
  factionWinrates: Array<{ faction: Faction; winrate: number }>;
  topWinrate: Array<{ user: PublicUser; winrate: number }>;
  funFacts: Array<{ icon: string; title: string; description: string }>;
}

export interface Achievement {
  slug: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  progress: { current: number; target: number };
}

export interface HeadToHead {
  userA: PublicUser;
  userB: PublicUser;
  gamesTogetherCount: number;
  winsA: number;
  winsB: number;
  avgPlaceA: number;
  avgPlaceB: number;
  matches: MatchSession[];
}
```

**Заполните моки реалистичными данными** — не `"Lorem ipsum"`:
- 8 игроков с русскими никами (`IronFist`, `Kraken42`, `DireWolf`, `GoldHand`, `RedViper`, `FireQueen`, `Frey73`, `Bookworm`)
- Минимум 20 сессий: 15 completed, 3 planned, 2 cancelled
- Разные режимы и колоды
- 5–20 комментариев на популярные партии
- Голоса разбросаны правдоподобно
- Стата — не равномерная (у каждого свой характер: один всегда за Ланнистеров, другой универсал, третий играет редко но сильно)

---

## 11. Чего ТОЧНО не нужно делать

- Не добавлять кнопки «Купить» / «Премиум» / «Подписка».
- Не делать chat в realtime с typing indicators — это обычные комментарии с polling.
- Не добавлять социальные share на Twitter/Facebook — закрытая компания.
- Не встраивать Google Analytics / любую телеметрию в прототип.
- Не рисовать копии официальных гербов FFG / HBO — стилизованные силуэты OK, буквальные копии нет.
- Не делать публичную регистрацию без approval-шага.

---

## 12. Финальная инструкция для Claude Design

Создай полный многостраничный React + Vite + Tailwind + TypeScript прототип.

**Порядок реализации:**

1. Настрой проект, установи зависимости (react-router-dom, framer-motion, lucide-react, recharts, react-confetti).
2. Определи design tokens в `tailwind.config.ts` (цвета из раздела 4, включая все faction colors как `colors.faction.*`) и в `src/styles/globals.css`.
3. Создай `src/mocks/` с полными мок-данными по типам из раздела 10. Минимум 8 игроков, 20 сессий.
4. Создай переиспользуемые компоненты из раздела 8 в `src/components/`.
5. Создай AppShell с Sidebar (desktop) и BottomNav (mobile), роутинг.
6. Реализуй экраны в порядке: Home → Match detail → Matches list → Player profile → Leaderboards → Factions → Faction detail → H2H → Login/Register → My profile → Create session → Finalize → Avatar generator → Notifications → RSVP → Achievements → Seasons → Tournaments → Admin.
7. Добавь анимации из раздела 9.
8. Убедись, что каждый компонент принимает чётко типизированные props из типов раздела 10 — так мы сможем подменить моки на API без рефакторинга.
9. Напиши короткий `README.md` с командами запуска и списком роутов.

**Что важно:**
- Дизайн должен быть цельным, не эклектичным. Одна визуальная линия сквозь все экраны.
- Mobile-first, но desktop-layout должен выглядеть богато (не растянутый mobile).
- Цвета фракций — главный визуальный ритм. Используй их везде, где упоминается игрок с фракцией.
- Анимации — сдержанные, не разваливают ощущение «серьёзной статистики».
- Текст — на русском.
