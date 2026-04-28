import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import {
  ensureCsrf,
  login as loginRequest,
  logout as logoutRequest,
  me,
  register as registerRequest,
} from '@/api/auth'
import { ApiError } from '@/api/client'
import type { LoginPayload, PrivateUser, RegisterPayload } from '@/api/types'
import { AuthContext } from '@/context/auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PrivateUser | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function bootstrap() {
      try {
        await ensureCsrf()
      } catch (error) {
        console.error('Failed to initialize CSRF cookie.', error)
      }

      try {
        const currentUser = await me()

        if (isMounted) {
          setUser(currentUser)
        }
      } catch (error) {
        if (
          error instanceof ApiError &&
          (error.status === 401 || error.status === 403)
        ) {
          if (isMounted) {
            setUser(null)
          }
        } else {
          console.error('Failed to bootstrap current user.', error)
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false)
        }
      }
    }

    void bootstrap()

    return () => {
      isMounted = false
    }
  }, [])

  async function refreshUser() {
    try {
      const currentUser = await me()
      setUser(currentUser)
      return currentUser
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        setUser(null)
        return null
      }

      throw error
    }
  }

  async function login(payload: LoginPayload) {
    await ensureCsrf()
    const currentUser = await loginRequest(payload)
    setUser(currentUser)
    return currentUser
  }

  async function logout() {
    await ensureCsrf()
    await logoutRequest()
    setUser(null)
  }

  async function register(payload: RegisterPayload) {
    await ensureCsrf()
    return registerRequest(payload)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isBootstrapping,
        login,
        logout,
        register,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
