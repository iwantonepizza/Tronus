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
    PrivateUserSerializer,
    PublicUserSerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
)
from .services import register_user, update_profile

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
            message="Too many requests.",
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

        try:
            user = register_user(**serializer.validated_data)
        except ValidationError as exc:
            return build_error_response(
                code="validation_error",
                message="Validation error.",
                status_code=status.HTTP_400_BAD_REQUEST,
                details=exc.message_dict,
            )

        return Response(
            {"id": user.pk, "status": "pending_approval"},
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

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]
        user = self._find_user_by_email(email=email)

        if user is None:
            return build_error_response(
                code="invalid_credentials",
                message="Invalid email or password.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(password):
            return build_error_response(
                code="invalid_credentials",
                message="Invalid email or password.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_active:
            return build_error_response(
                code="account_pending_approval",
                message="This account is pending owner approval.",
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
                message="Invalid email or password.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        login(request, authenticated_user)
        return Response(PrivateUserSerializer(authenticated_user).data)

    @staticmethod
    def _find_user_by_email(*, email: str):
        return selectors.get_user_by_email(email=email)


class LogoutView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def post(self, request, *args, **kwargs) -> Response:
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request, *args, **kwargs) -> Response:
        return Response(PrivateUserSerializer(request.user).data)


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
                message="Validation error.",
                status_code=status.HTTP_400_BAD_REQUEST,
                details=exc.message_dict,
            )

        return Response(PrivateUserSerializer(profile.user).data)
