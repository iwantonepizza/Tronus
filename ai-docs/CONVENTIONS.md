# CONVENTIONS.md

Контракт по коду. Agent обязан следовать. Review не принимается при нарушении.

---

## Python / Django

- Python 3.12+.
- Django 5.x.
- Type hints везде, где они имеют смысл. Сигнатуры сервисов и селекторов — **обязательно** с типами.
- `from __future__ import annotations` в верху файлов с forward references.
- Никаких `import *`.
- Относительные импорты внутри аппы (`from .models import ...`), абсолютные между аппами (`from apps.games.services import ...`).

## Форматирование

- `ruff` для линта и форматирования.
- Line length: 100.
- Конфиг в `pyproject.toml`.

## Структура файла аппы

```
apps/<name>/
├── __init__.py
├── apps.py
├── models.py          # только данные и db-level constraints
├── admin.py           # регистрация в админке
├── serializers.py     # DRF сериализаторы, только shape
├── services.py        # мутации, транзакции
├── selectors.py       # чтение, агрегации
├── views.py           # DRF views/viewsets, тонкие
├── permissions.py     # DRF permission классы
├── urls.py            # роутер аппы
├── signals.py         # только если реально нужно
├── tasks.py           # Celery tasks (Phase 2)
├── migrations/
└── tests/
    ├── __init__.py
    ├── conftest.py    # фикстуры аппы
    ├── factories.py   # factory_boy
    ├── test_models.py
    ├── test_services.py
    ├── test_selectors.py
    └── test_api.py
```

Файл отсутствует, если он пуст. Не создавайте пустые `tasks.py` ради единообразия.

---

## Модели

- Наследоваться от `core.models.TimestampedModel`.
- `Meta.ordering` — только если реально нужно по умолчанию.
- `Meta.indexes` для полей, по которым фильтруют списки.
- `__str__` обязателен, должен быть информативным.
- Никаких методов с бизнес-логикой. `model.calculate_winrate()` — в `stats.selectors`, не в модели.

**OK:**
```python
class GameSession(TimestampedModel):
    scheduled_at = models.DateTimeField()
    mode = models.ForeignKey("reference.GameMode", on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED)

    class Meta:
        indexes = [models.Index(fields=["status", "scheduled_at"])]

    def __str__(self) -> str:
        return f"Session #{self.pk} @ {self.scheduled_at:%Y-%m-%d}"
```

**Не OK:**
```python
class GameSession(TimestampedModel):
    ...
    def finalize(self, outcome_data):  # ← нет, это в services
        ...
```

---

## Services

Signature: принимают явные аргументы, не DRF-сериализатор и не `request`. Возвращают модель или результат.

```python
# apps/games/services.py
from django.db import transaction

@transaction.atomic
def finalize_session(
    *,
    session: GameSession,
    rounds_played: int,
    end_reason: str,
    mvp: User | None,
    final_note: str,
    participations: list[dict],
) -> Outcome:
    _validate_can_finalize(session, participations)
    _apply_places(session, participations)
    outcome = Outcome.objects.create(
        session=session,
        rounds_played=rounds_played,
        end_reason=end_reason,
        mvp=mvp,
        final_note=final_note,
    )
    session.status = GameSession.Status.COMPLETED
    session.save(update_fields=["status", "updated_at"])
    return outcome
```

**Правила:**
- Keyword-only параметры (`*,` в сигнатуре).
- `@transaction.atomic` для мутаций, затрагивающих несколько таблиц.
- Валидация инвариантов — внутри сервиса, не в сериализаторе.
- Ошибки валидации — `django.core.exceptions.ValidationError`, DRF их ловит автоматически.

---

## Selectors

Чистые функции чтения. Без записи в БД, без побочных эффектов.

```python
# apps/stats/selectors.py
def player_profile_stats(*, user_id: int) -> dict:
    qs = Participation.objects.filter(user_id=user_id, session__status="completed")
    return {
        "total_games": qs.count(),
        "wins": qs.filter(is_winner=True).count(),
        "avg_place": qs.aggregate(Avg("place"))["place__avg"],
    }
```

Возвращаем `QuerySet`, `list[Model]`, `dict`, — то, что удобно вызывающему. Не сериализуем здесь.

---

## Serializers

Только shape. Без проверок вроде «пользователь уже в сессии» — это в service.

- `ModelSerializer` — для простых случаев.
- `Serializer` — для non-model данных (например, ответ stats).
- Валидаторы уровня формата (`min_length`, `EmailValidator`) — ок.

---

## Views

Тонкие. Делегируют.

```python
# apps/games/views.py
class SessionFinalizeView(APIView):
    permission_classes = [IsSessionCreatorOrAdmin]

    def post(self, request, pk):
        session = get_object_or_404(GameSession, pk=pk)
        serializer = FinalizeSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        outcome = games_services.finalize_session(
            session=session,
            **serializer.validated_data,
        )
        return Response(OutcomeSerializer(outcome).data, status=201)
```

---

## Permissions

В `permissions.py` аппы. Каждый класс — одна проверка.

```python
class IsSessionCreatorOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.created_by_id == request.user.id or request.user.is_staff
```

---

## Тесты

- `pytest`, `pytest-django`, `factory_boy`.
- Структура: `tests/test_<module>.py`.
- Имена: `test_<что_проверяем>_<ожидание>`.
- Arrange-Act-Assert явно, через пустые строки.

```python
def test_finalize_session_sets_status_to_completed(db, session_factory, participation_factory):
    session = session_factory(status="planned")
    p1 = participation_factory(session=session)
    p2 = participation_factory(session=session)

    games_services.finalize_session(
        session=session,
        rounds_played=10,
        end_reason="castles_7",
        mvp=None,
        final_note="",
        participations=[
            {"id": p1.id, "place": 1, "castles": 7},
            {"id": p2.id, "place": 2, "castles": 4},
        ],
    )

    session.refresh_from_db()
    assert session.status == "completed"
```

**Target coverage:**
- `services`: 90%+.
- `selectors`: 90%+.
- `views`: smoke-тесты (happy path + главный failure path).

---

## Migrations

- `python manage.py makemigrations` с осмысленным `--name`.
- Review migration до коммита: имя файла, SQL (`sqlmigrate`).
- Data migrations — отдельно от schema migrations.

---

## Commits

Conventional commits упрощённо:

```
feat(games): add finalize_session service
fix(ratings): prevent self-voting
refactor(stats): extract head-to-head to separate selector
docs: update ARCHITECTURE.md after T-015
test(games): cover finalize edge cases
```

Scope — имя аппы или `docs` / `infra`.

---

## PR / Review checklist (self-check для агента)

Перед сдачей отчёта пробежаться:

- [ ] Тесты написаны и проходят локально.
- [ ] Линтер (ruff) чистый.
- [ ] Миграции сгенерированы и проверены.
- [ ] Нет ORM-вызовов во views.
- [ ] Нет бизнес-логики в models и serializers.
- [ ] Services с `@transaction.atomic` где нужно.
- [ ] Публичный API (URL, формат ответа) соответствует `API_CONTRACT.md`.
- [ ] Если что-то отклонилось от плана — описано в отчёте с обоснованием.
