from __future__ import annotations

import pytest
from rest_framework.test import APIClient


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def authenticated_client(django_user_model) -> APIClient:
    client = APIClient()
    user = django_user_model.objects.create_user(
        username="testuser",
        email="testuser@example.com",
        password="testpass123",
    )
    client.force_authenticate(user=user)
    return client
