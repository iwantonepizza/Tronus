import { getCsrfToken } from '@/lib/csrf'
import type { ApiErrorPayload } from '@/api/types'

const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
const BASE = RAW_BASE.endsWith('/') ? RAW_BASE.slice(0, -1) : RAW_BASE

export class ApiError extends Error {
  code: string
  status: number
  details?: Record<string, string[]>

  constructor(params: {
    code: string
    message: string
    status: number
    details?: Record<string, string[]>
  }) {
    super(params.message)
    this.name = 'ApiError'
    this.code = params.code
    this.status = params.status
    this.details = params.details
  }
}

type ApiRequestInit = RequestInit & {
  json?: unknown
}

function getBackendOrigin(): string {
  if (RAW_BASE.startsWith('http://') || RAW_BASE.startsWith('https://')) {
    return new URL(RAW_BASE).origin
  }

  const envOrigin = import.meta.env.VITE_BACKEND_ORIGIN

  if (envOrigin) {
    return envOrigin
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:8000'
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return 'http://localhost:8000'
}

function buildUrl(path: string): string {
  return path.startsWith('/') ? `${BASE}${path}` : `${BASE}/${path}`
}

export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  return new URL(path, getBackendOrigin()).toString()
}

export async function api<T>(
  path: string,
  { json, headers: initHeaders, ...init }: ApiRequestInit = {},
): Promise<T> {
  const headers = new Headers(initHeaders)
  const body = json === undefined ? init.body : JSON.stringify(json)

  headers.set('Accept', 'application/json')

  if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (init.method && !['GET', 'HEAD'].includes(init.method.toUpperCase())) {
    const csrfToken = getCsrfToken()

    if (csrfToken) {
      headers.set('X-CSRFToken', csrfToken)
    }
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    body,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    const fallbackMessage = response.statusText || 'Request failed.'
    const responseBody = (await response.json().catch(() => undefined)) as
      | ApiErrorPayload
      | undefined

    throw new ApiError({
      code: responseBody?.error.code ?? 'unknown_error',
      message: responseBody?.error.message ?? fallbackMessage,
      status: response.status,
      details: responseBody?.error.details,
    })
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
