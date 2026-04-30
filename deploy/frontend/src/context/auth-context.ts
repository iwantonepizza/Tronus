import { createContext } from 'react'
import type {
  LoginPayload,
  PrivateUser,
  RegisterPayload,
  RegisterResponse,
} from '@/api/types'

export interface AuthContextValue {
  user: PrivateUser | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (payload: LoginPayload) => Promise<PrivateUser>
  logout: () => Promise<void>
  register: (payload: RegisterPayload) => Promise<RegisterResponse>
  refreshUser: () => Promise<PrivateUser | null>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
