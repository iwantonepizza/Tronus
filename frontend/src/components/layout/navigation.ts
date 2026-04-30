import type { LucideIcon } from 'lucide-react'
import {
  Crown,
  Flame,
  Home,
  Plus,
  Shield,
  ShieldCheck,
  Sword,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  to: string
  match: (pathname: string) => boolean
  /** When true, only visible to staff/superuser users. */
  adminOnly?: boolean
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Обзор',
    icon: Home,
    to: '/',
    match: (pathname) => pathname === '/',
  },
  {
    id: 'matches',
    label: 'Партии',
    icon: Sword,
    to: '/matches',
    match: (pathname) => pathname.startsWith('/matches'),
  },
  {
    id: 'players',
    label: 'Игроки',
    icon: Users,
    to: '/players',
    match: (pathname) => pathname.startsWith('/players'),
  },
  {
    id: 'leaderboard',
    label: 'Рейтинг',
    icon: Trophy,
    to: '/leaderboard',
    match: (pathname) => pathname.startsWith('/leaderboard'),
  },
  {
    id: 'factions',
    label: 'Фракции',
    icon: Shield,
    to: '/factions',
    match: (pathname) => pathname.startsWith('/factions'),
  },
  {
    id: 'h2h',
    label: 'H2H',
    icon: Flame,
    to: '/h2h',
    match: (pathname) => pathname.startsWith('/h2h'),
  },
  {
    id: 'admin-registrations',
    label: 'Заявки',
    icon: ShieldCheck,
    to: '/admin/registrations',
    match: (pathname) => pathname.startsWith('/admin/registrations'),
    adminOnly: true,
  },
]

export const MOBILE_NAV_ITEMS: NavItem[] = [
  PRIMARY_NAV_ITEMS[0],
  PRIMARY_NAV_ITEMS[1],
  {
    id: 'create',
    label: 'Новая',
    icon: Plus,
    to: '/matches/new',
    match: (pathname) => pathname === '/matches/new',
  },
  PRIMARY_NAV_ITEMS[3],
  {
    id: 'me',
    label: 'Я',
    icon: UserRound,
    to: '/me',
    match: (pathname) => pathname.startsWith('/me'),
  },
]

export const QUICK_CREATE = {
  label: 'Новая партия',
  to: '/matches/new',
  icon: Plus,
}

export const BRAND_MARK = Crown
