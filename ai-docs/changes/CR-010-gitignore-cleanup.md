# CR-010: Документация project в git, чёткие правила .gitignore

**Status:** closed
**Closed:** 2026-04-30
**Resolved by:** architect iteration 7
**Created:** 2026-04-30
**Author:** architect

---

## Проблема

В Wave 7 при review обнаружено, что:

1. **Корневой `.gitignore` исключал `AGENTS.md` и `ai-docs/`** — то есть **всю архитектурную документацию проекта**. Это означает, что при `git push` всё то, что architect пишет (ADR, CR, BACKLOG, IN_PROGRESS, отчёты, review) — никогда не попадало в репозиторий.
2. **Дубль `.gitignore` в `deploy/`** с тем же бракованным правилом — `AGENTS.md`, `ai-docs/`.
3. **`.dockerignore`** содержал `ai-docs/` (это OK для образов, но было сделано без объяснения).
4. В `deploy/` лежали **полные зеркала** проекта: `backend/`, `frontend/`, `ai-docs/`, `frontend-design/`, `AGENTS.md`, плюс вложенный `deploy/deploy/` и `deploy/.github/`. Похоже на ошибку распаковки или artifacts от попытки клонировать репо в подпапку.

Если бы это попало в master — codex в следующей итерации **читал бы полностью устаревшее зеркало** и работал бы вслепую. Critical bug latent в репозитории.

## Решение (применено в iteration 7)

### `.gitignore`

Корневой `.gitignore` переписан:
```gitignore
# Python
__pycache__/
*.py[cod]
.venv/
venv/
.pytest_cache/
.ruff_cache/
.mypy_cache/
.coverage
htmlcov/

# Django
staticfiles/
backend/media/
backend/test_*.sqlite3

# Node / Vite
node_modules/
frontend/dist/
frontend/src/build/
frontend/vite-*.log
frontend/vite-*.err.log

# Env / secrets
.env
.env.local
.env.*.local
deploy/env/*.env
!deploy/env/*.env.example

# IDE / OS
.idea/
.vscode/
.DS_Store
Thumbs.db
```

**Что НЕ в gitignore (т.е. в git):**
- `AGENTS.md` — обязательно.
- `README.md` — обязательно.
- `ai-docs/` — вся документация архитектора, **обязательно**.
- `frontend-design/` — read-only reference, обязательно.
- `deploy/env/*.env.example` — шаблоны, обязательно.

### `.dockerignore`

Backend и root `.dockerignore` могут исключать `ai-docs/`, `frontend-design/`, `deploy/`, `frontend/` из docker context — это нормально, эти папки не нужны в образе backend. Но **не должны** влиять на git.

### Удалены мусорные дубли

- `deploy/.gitignore` — удалён (был с такой же поломкой).
- `deploy/AGENTS.md`, `deploy/README.md`, `deploy/ai-docs/`, `deploy/backend/`, `deploy/frontend/`, `deploy/frontend-design/`, `deploy/deploy/`, `deploy/.github/`, `deploy/.dockerignore` — все удалены.

### Структура `deploy/` после cleanup

```
deploy/
├── README.md                          ← инструкция по деплою (host-nginx)
├── docker-compose.prod.yml            ← host-nginx сценарий
├── docker-compose.bundled.yml         ← fallback: всё-в-контейнерах
├── env/
│   ├── backend.prod.env.example       ← в git
│   └── frontend.prod.env.example      ← в git
├── nginx-host/
│   └── tronus.conf                    ← конфиг для хост-nginx
└── nginx-bundled/
    └── tronus.conf                    ← конфиг для contained-nginx (bundled)
```

## Acceptance

- [x] `git status --ignored` показывает, что `ai-docs/` НЕ ignored.
- [x] `AGENTS.md` НЕ ignored.
- [x] `deploy/env/*.env` ignored, `*.env.example` НЕ ignored.
- [x] `deploy/` содержит только deploy-relevant файлы.
- [x] Никаких полных копий проекта во вложенных директориях.

## Lessons learned

В будущих итерациях:
- Перед каждой архитектурной итерацией architect должен проверять `git ls-files | grep ai-docs` чтобы убедиться, что docs реально в git.
- Codex должен видеть `AGENTS.md` раздел 8 и не трогать `.gitignore` без CR.
