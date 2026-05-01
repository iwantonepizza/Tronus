AGENTS.md
Источник истины для всех агентов, работающих над проектом Tronus — трекер партий настольной «Игры престолов».
Любой агент перед началом работы обязан прочитать этот файл целиком.

1. Что мы строим
Closed-group веб-приложение для компании друзей. Пользователи заносят результаты сыгранных партий, планируют будущие, видят статистику метагейма.
Это не соцсеть, не турнирная платформа, не публичный сервис. Нагрузка: десятки партий в месяц, десятки пользователей.
Ключевая ценность — агрегации: винрейты, матчапы, серии. Схема БД должна позволять считать их одним SQL-запросом.

2. Структура монорепы
tronus/
├── AGENTS.md              ← этот файл, единый контракт
├── README.md              ← навигация
├── .gitignore             ← единый для монорепы
├── .dockerignore
├── ai-docs/               ← вся документация и процессы
├── backend/               ← Django API (Python 3.12, DRF)
├── frontend/              ← production React (TS + Vite + Tailwind)
├── frontend-design/       ← HTML/JSX прототип от Claude Design. READ-ONLY reference.
└── deploy/                ← draft production compose + nginx config
Важно:

frontend-design/ — референс, не код. Если нужно что-то в нём менять — это архитектурное решение через ADR.
ai-docs/ существует только на корне монорепы. Не заводить backend/ai-docs/ или frontend/ai-docs/.
Все пути в задачах и отчётах даются относительно корня монорепы (backend/apps/games/models.py, не apps/games/models.py).
Backend dev стек — backend/docker-compose.yml. Prod draft — deploy/docker-compose.prod.yml. Не путать.


3. Роли агентов
РольКтоЧто делаетArchitectClaude (я)Планирует, создаёт задачи, ревьюшит, обновляет ADR и основные документы.Backend coderAI-агентБерёт задачу T-XXX из ai-docs/tasks/IN_PROGRESS.md, работает в backend/.Frontend coderAI-агентБерёт задачу F-XXX из ai-docs/tasks/IN_PROGRESS.md, работает в frontend/.IntegrationAI-агентЗадачи I-XXX: CORS, proxy, deploy, CI, env.ReviewerArchitectReview → ai-docs/reviews/, approve → APPROVALS.md и DONE.md.Human (owner)ПользовательПринимает архитектурные решения, подтверждает спорные изменения.
Coder не принимает архитектурных решений самостоятельно. Если задача требует выбора между вариантами — блокируется и пишет вопрос в отчёт.

4. Префиксы задач
ПрефиксЗначениеГде работает агентT-XXXBackend (Django API)backend/F-XXXFrontend (React production)frontend/I-XXXIntegration / DevOpsRoot + backend/ + frontend/CR-XXXChange request (от architect)Scope-изменение, ссылается на T/FADR-XXArchitecture Decision Recordai-docs/decisions/
Нумерация независимая: T-080, F-015, I-004 — три разные задачи.

5. Workflow
Для Architect

Требование от owner → анализ impact.
Если меняется архитектура — ADR в ai-docs/decisions/.
Обновляет ARCHITECTURE.md / DATA_MODEL.md / API_CONTRACT.md / FRONTEND_ARCHITECTURE.md.
Если изменяется scope уже closed задачи — change request в ai-docs/changes/CR-XXX-*.md.
Пишет задачу по ai-docs/tasks/TEMPLATE.md, кладёт в BACKLOG.md.
Переносит в IN_PROGRESS.md при назначении.
Review → ai-docs/reviews/YYYY-MM-DD-<TASK_ID>.md.
Approve → запись в APPROVALS.md, перенос в DONE.md, апдейт CHANGELOG.md.

Для Coder

Читает в этом порядке: AGENTS.md → ai-docs/CONVENTIONS.md (backend) или ai-docs/FRONTEND_ARCHITECTURE.md (frontend) → свою задачу → references из задачи.
Работает в директориях, указанных в Files to touch. Выходить за рамки — только через блокер.
Пишет код по конвенциям, добавляет тесты.
Отчёт по ai-docs/reports/TEMPLATE.md → ai-docs/reports/YYYY-MM-DD-<TASK_ID>.md.
Если пришлось изменить scope — фиксирует в Deviations from task либо просит architect открыть CR.

Правило по batch-режиму: предпочтительно одна задача → отчёт → стоп до approve. На практике агенты успешно закрывают несколько задач подряд; это приемлемо при условии качества, но не отменяет обязанности делать отчёт по каждой задаче отдельно.

6. Жёсткие правила
DO

Следовать ai-docs/CONVENTIONS.md (backend) и ai-docs/FRONTEND_ARCHITECTURE.md (frontend).
Работать в границах указанных файлов.
Тесты к каждой новой логике.
Спрашивать, если задача двусмысленная.
Использовать backend/... и frontend/... как префикс путей в отчётах.

DON'T

Не переписывать то, что не просили.
Не менять публичный API (URL, сериализаторы, shape mock-данных) без ADR / CR.
Не менять схему БД без warning в отчёте.
Не использовать ORM во views — только через selectors / services.
Не добавлять зависимости (requirements.in, package.json) без согласования.
Не коммитить .env, секреты, реальные фото в моки.
Не трогать frontend-design/ — это read-only reference.
Не оставлять в репозитории: тестовые sqlite-файлы, __pycache__, dist/, vite-логи.


7. Структура документации
ФайлНазначениеКто правитAGENTS.mdЭтот файл.Architectai-docs/README.mdИндекс и навигация.Architectai-docs/ARCHITECTURE.mdBackend apps, слои, стек.Architectai-docs/FRONTEND_ARCHITECTURE.mdFrontend стек, структура, правила.Architectai-docs/DATA_MODEL.mdСущности, поля, инварианты.Architectai-docs/API_CONTRACT.mdREST endpoints.Architectai-docs/INTEGRATION_PLAN.mdКак фронт и бэк живут вместе (CORS, auth, env, deploy).Architectai-docs/CONVENTIONS.mdBackend код-стайл.Architectai-docs/ROADMAP.mdФазы проекта.Architectai-docs/DESIGN_BRIEF.mdБриф для Claude Design (исходник прототипа).Architectai-docs/tasks/TEMPLATE.mdШаблон задачи.Architectai-docs/tasks/BACKLOG.mdОчередь задач.Architectai-docs/tasks/IN_PROGRESS.mdВыданные задачи.Architectai-docs/tasks/DONE.mdЛог закрытых задач.Architectai-docs/reports/TEMPLATE.mdШаблон отчёта агента.Architectai-docs/reports/*.mdОтчёты по задачам.Coderai-docs/decisions/ADR-*.mdArchitecture Decision Records.Architectai-docs/changes/TEMPLATE.mdШаблон change request.Architectai-docs/changes/CR-*.mdChange requests.Architectai-docs/reviews/TEMPLATE.mdШаблон review.Architectai-docs/reviews/*.mdReview-отчёты.Reviewerai-docs/reviews/APPROVALS.mdЖурнал approve / reject.Reviewerai-docs/logs/CHANGELOG.mdХронологический лог.Architect

8. Текущее состояние проекта
Актуальная дата: 2026-04-23.
Фаза: Phase 1 MVP — CLOSED. Следующая — Phase 2.
Статистика выполнения (на 2026-05-01):
МетрикаЗначениеЗакрытых задач~125 (Phase 1 49 + Waves 5–10)Backend tests passing200+Frontend tests passing15+Backend API endpoints~72Frontend pages23ADR принятых17 (ADR-0019 новый)Change requests resolved / cancelled10 / 1Change requests open0
Phase 1 — CLOSED. Phase 2 — IN PROD на got.craft-hookah.ru. Wave 11 — hotfix-pivot после третьего прод-теста.
Что закрыто:
✅ Phase 1 MVP (Waves 0-4): backend домен (8 apps), frontend (18 страниц), CI, хостинг draft.
✅ Wave 5 (auth/rules pivot): secret word, login email/nick, password reset/change, GameMode rules, House decks → 2, русские validation messages.
✅ Wave 6 (Phase 2 ядро): lifecycle planned/in_progress/completed, RoundSnapshot, SessionInvite, randomize/replace participant, finalize из последнего snapshot, timeline events.
✅ Wave 7 (Phase 2 завершение): action modals, timeline UI, notifications, search Cmd+K, fun facts, русификация, error pages.
✅ Wave 8 (production hardening): real Westeros cards, deploy на VPS с host-nginx, Sentry, backup, healthcheck, security headers.
✅ Wave 9 (хотфиксы первого прод-теста): RSVP NOT_GOING fix, encoding fix, robust 500 handler, retroactive finalize, admin tab подтверждения регистраций.
✅ Wave 10 (UI rework): ADR-0017 (UI roster = invites), полный rework MatchDetailPage, H2H autopick, TZ Asia/Yekaterinburg, ~13 UI правок и баг-фиксов.
Что в Wave 11 (текущая, 9 задач) — hotfix-pivot после третьего прод-теста:
После Wave 10 на проде вылезли блокеры: создание сессии создавало Participation напрямую через старый addParticipant flow → конфликт со start_session → 400. И MethodNotAllowed классифицировался как 500. Принят ADR-0019: при создании сессии фронт создаёт invites со статусом maybe, не Participations.

🔴 Backend hotfixes (architect-applied, agent дописывает тесты): T-170 (invite_user/self_invite принимают desired_faction и rsvp_status), T-171 (MethodNotAllowed → 405), T-172 (reset password только по email), T-173 (cleanup_orphan_participations management команда).
🔴 Frontend P0: F-230 (CreateSessionPage/EditSessionPage используют inviteUser вместо addParticipant), F-231 (RsvpBlock работает без предварительного invite).
🟡 Frontend P1: F-232 (toggle visibility password), F-233 (PasswordResetPage: только email, без подсказки секрета).
🟢 Carry-over: F-213 (cancelled UI), T-160 (force_remove_participation).

Blocked / waiting:

T-161 (votes до finalize) — нужен ADR-0018.
Phase 3 (Seasons, Achievements, Tournaments) — после Wave 11 и подтверждения от owner что прод стабилен.

Что ждёт после Wave 11:

T-162/T-163 (расширенные тесты), F-204 (admin badge), очистка чек-листа.
Phase 3 — Seasons, Achievements, Tournaments.


9. Глоссарий

Session / GameSession — партия как событие (план или сыгранная).
Participation — участие игрока в сессии (фракция, место, замки).
Outcome — итог партии (раунды, причина окончания, MVP).
MatchVote — оценка «корона/говно» от участника участнику в рамках партии. API: positive / negative.
MatchComment — комментарий под партией, soft-delete.
AvatarAsset — сгенерированный аватар пользователя (Pillow MVP или будущий AI).
Reference data — справочники (Faction, GameMode, Deck).
Selector — функция чтения данных без сайд-эффектов.
Service — функция мутации данных в транзакции.
Mock data — фикстуры в frontend/src/mocks/, shape совпадает с API-контрактом. Dev-only, не попадает в prod-бандл.