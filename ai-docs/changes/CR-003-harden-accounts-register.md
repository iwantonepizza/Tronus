# CR-003: Hardening `accounts.register_user` и `LoginView`

**Status:** closed
**Closed:** 2026-04-23
**Created:** 2026-04-22
**Author:** architect
**Related:** T-013 (approved_with_comments)

---

## Проблема

### 1. `register_user` полагается на сигнал для создания Profile

В `backend/apps/accounts/services.py::register_user`:

```python
user = User(...); user.set_password(password); user.save()
Profile.objects.filter(user=user).update(nickname=normalized_nickname)
user.refresh_from_db()
```

Это работает благодаря `post_save(User)` → `create_profile_for_user` сигналу. Но:
- Если сигнал отключён (тесты с `@pytest.mark.skip_signals`, management-команды с `--raw`), nickname **не** запишется, и никто не заметит — `update()` молча не найдёт строк.
- Связь «регистрация ↔ профиль» размазана между двумя файлами.

### 2. `LoginView` передаёт email как username при `user is None`

В `backend/apps/accounts/views.py::LoginView.post`:

```python
user = self._find_user_by_email(email=email)
...
authenticated_user = authenticate(
    request=request,
    username=user.username if user is not None else email,
    password=password,
)
```

Работает только потому, что `User.username == email` (соглашение в `register_user`). Если когда-то разрешим кастомный username, этот код молча сломается.

## Решение

### Часть 1 (register_user):

Переписать так, чтобы Profile создавался сервисом явно, а сигнал оставался fallback:

```python
@transaction.atomic
def register_user(*, email: str, password: str, nickname: str) -> User:
    # ... нормализация, валидация как было ...

    user = User(
        username=normalized_email,
        email=normalized_email,
        is_active=False,
    )
    user.set_password(password)
    user.save()

    # Explicit create — не полагаемся на сигнал
    Profile.objects.update_or_create(
        user=user,
        defaults={"nickname": normalized_nickname},
    )
    return user
```

Сигнал оставить для ситуаций, когда User создан не через register_user (admin, management-команда) — он создаёт Profile с `nickname=username`, который позже можно переименовать.

### Часть 2 (LoginView):

Если `user is None` — сразу возвращать `400 invalid_credentials` без попытки `authenticate`. Это не утечка: Django и так даёт одинаковое сообщение. Плюс убирает хрупкость.

```python
if user is None:
    return build_error_response(
        code="invalid_credentials",
        message="Invalid email or password.",
        status_code=status.HTTP_400_BAD_REQUEST,
    )
if not user.check_password(password):
    return build_error_response(...)  # тот же ответ
if not user.is_active:
    return build_error_response(code="account_pending_approval", ...)
authenticated_user = authenticate(request=request, username=user.username, password=password)
```

## Impact на файлы

- `backend/apps/accounts/services.py` — `register_user` переписать на explicit Profile create.
- `backend/apps/accounts/views.py` — `LoginView.post` упростить.
- `backend/apps/accounts/tests/test_services.py` — добавить тест `test_register_user_works_without_signals` (через `@override_settings`-подобный механизм или direct disconnect сигнала).
- `backend/apps/accounts/tests/test_api.py` — проверить, что порядок проверок в login не сломал существующие кейсы.

## Рождает задачу

**T-071: выполнить CR-003** — см. `BACKLOG.md`.
