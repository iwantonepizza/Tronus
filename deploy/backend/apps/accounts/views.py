from __future__ import annotations

from typing import Any

from django.contrib.auth import authenticate, login, logout
from django.core.exceptions import ValidationError
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django_ratelimit.core import get_usage
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from . import selectors
from .permissions import IsAuthenticatedUser, IsSelfUser
from .serializers import (
    LoginSerializer,
    PasswordChangeSerializer,
    PasswordResetSerializer,
    PrivateUserSerializer,
    PublicUserSerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
)
from .services import (
    change_password,
    find_user_by_login,
    register_user,
    reset_password,
    update_profile,
)

REGISTER_RATE_GROUP = "auth-register"
LOGIN_RATE_GROUP = "auth-login"
AUTH_RATE = "5/m"


def build_error_response(
    *,
    code: str,
    message: str,
    status_code: int,
    details: dict[str, list[str]] | None = None,
) -> Response:
    payload: dict[str, Any] = {
        "error": {
            "code": code,
            "message": message,
        }
    }
    if details:
        payload["error"]["details"] = details

    return Response(payload, status=status_code)


def check_rate_limit(
    request: HttpRequest,
    *,
    group: str,
    rate: str,
) -> Response | None:
    usage = get_usage(
        request=request,
        group=group,
        key="ip",
        rate=rate,
        method=request.method,
        increment=True,
    )
    if usage and usage["should_limit"]:
        return build_error_response(
            code="rate_limited",
            message="Слишком много запросов.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    return None


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs) -> Response:
        rate_limit_response = check_rate_limit(request, group=REGISTER_RATE_GROUP, rate=AUTH_RATE)
        if rate_limit_response is not None:
            return rate_limit_response

        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        try:
            registration_result = register_user(
                email=validated_data["email"],
                password=validated_data["password"],
                nickname=validated_data["nickname"],
                secret_word=validated_data.get("secret_word"),
            )
        except ValidationError as exc:
            return build_error_response(
                code="validation_error",
                message="Ошибка валидации.",
                status_code=status.HTTP_400_BAD_REQUEST,
                details=exc.message_dict,
            )

        user = registration_result["user"]
        response_status = (
            "active" if registration_result["auto_activated"] else "pending_approval"
        )
        return Response(
            {
                "id": user.pk,
                "status": response_status,
                "auto_activated": registration_result["auto_activated"],
            },
            status=status.HTTP_201_CREATED,
        )


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfTokenView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs) -> Response:
        return Response({"detail": "CSRF cookie set"})


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs) -> Response:
        rate_limit_response = check_rate_limit(request, group=LOGIN_RATE_GROUP, rate=AUTH_RATE)
        if rate_limit_response is not None:
            return rate_limit_response

        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        login_value = serializer.validated_data["login"]
        password = serializer.validated_data["password"]
        user = find_user_by_login(login=login_value)

        if user is None:
            return build_error_response(
                code="invalid_credentials",
                message="Неверный логин или пароль.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(password):
            return build_error_response(
                code="invalid_credentials",
                message="Неверный логин или пароль.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_active:
            return build_error_response(
                code="account_pending_approval",
                message="Этот аккаунт ожидает подтверждения владельцем.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        authenticated_user = authenticate(
            request=request,
            username=user.username,
            password=password,
        )
        if authenticated_user is None:
            return build_error_response(
                code="invalid_credentials",
                message="Неверный логин или пароль.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        login(request, authenticated_user)
        return Response(
            PrivateUserSerializer(
                authenticated_user,
                context={"request": request},
            ).data
        )


class PasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs) -> Response:
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            reset_password(**serializer.validated_data)
        except ValidationError as exc:
            return build_error_response(
                code="validation_error",
                message="Ошибка валидации.",
                status_code=status.HTTP_400_BAD_REQUEST,
                details=exc.message_dict,
            )

        return Response({"status": "password_reset"}, status=status.HTTP_200_OK)


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def post(self, request, *args, **kwargs) -> Response:
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            change_password(user=request.user, **serializer.validated_data)
        except ValidationError as exc:
            return build_error_response(
                code="validation_error",
                message="Ошибка валидации.",
                status_code=status.HTTP_400_BAD_REQUEST,
                details=exc.message_dict,
            )

        return Response({"status": "password_changed"}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def post(self, request, *args, **kwargs) -> Response:
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request, *args, **kwargs) -> Response:
        return Response(PrivateUserSerializer(request.user, context={"request": request}).data)


class PublicUserListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = PublicUserSerializer

    def get_queryset(self):
        return selectors.list_public_users()


class PublicUserDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = PublicUserSerializer
    lookup_url_kwarg = "user_id"

    def get_queryset(self):
        return selectors.get_public_user_queryset()


class ProfileUpdateView(APIView):
    permission_classes = [IsSelfUser]

    def patch(self, request, user_id: int, *args, **kwargs) -> Response:
        user = get_object_or_404(selectors.get_user_queryset(), pk=user_id)
        self.check_object_permissions(request, user)

        serializer = UpdateProfileSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            profile = update_profile(profile=user.profile, **serializer.validated_data)
        except ValidationError as exc:
            return build_error_response(
                code="validation_error",
                message="Ошибка валидации.",
                status_code=status.HTTP_400_BAD_REQUEST,
                details=exc.message_dict,
            )

        return Response(PrivateUserSerializer(profile.user, context={"request": request}).data)
