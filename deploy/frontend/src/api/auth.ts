import { api, resolveAssetUrl } from '@/api/client'
import type {
  ChangePasswordPayload,
  ChangePasswordResponse,
  CsrfResponse,
  LoginPayload,
  PasswordResetPayload,
  PasswordResetResponse,
  PrivateUser,
  RegisterPayload,
  RegisterResponse,
} from '@/api/types'

function normalizePrivateUser(user: PrivateUser): PrivateUser {
  return {
    ...user,
    current_avatar: resolveAssetUrl(user.current_avatar),
  }
}

export async function ensureCsrf(): Promise<void> {
  await api<CsrfResponse>('/auth/csrf/')
}

export function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return api<RegisterResponse>('/auth/register/', {
    method: 'POST',
    json: payload,
  })
}

export function login(payload: LoginPayload): Promise<PrivateUser> {
  return api<PrivateUser>('/auth/login/', {
    method: 'POST',
    json: payload,
  }).then(normalizePrivateUser)
}

export function resetPassword(
  payload: PasswordResetPayload,
): Promise<PasswordResetResponse> {
  return api<PasswordResetResponse>('/auth/password/reset/', {
    method: 'POST',
    json: payload,
  })
}

export function changePassword(
  payload: ChangePasswordPayload,
): Promise<ChangePasswordResponse> {
  return api<ChangePasswordResponse>('/auth/password/change/', {
    method: 'POST',
    json: payload,
  })
}

export function logout(): Promise<void> {
  return api<void>('/auth/logout/', {
    method: 'POST',
  })
}

export function me(): Promise<PrivateUser> {
  return api<PrivateUser>('/auth/me/').then(normalizePrivateUser)
}
