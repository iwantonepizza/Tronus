export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('csrftoken='))

  return cookie
    ? decodeURIComponent(cookie.split('=').slice(1).join('='))
    : null
}
