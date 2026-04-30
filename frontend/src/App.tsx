import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { AppShell } from '@/components/layout/AppShell'
import { AdminRegistrationsPage } from '@/pages/AdminRegistrationsPage'
import { AvatarGeneratorPage } from '@/pages/AvatarGeneratorPage'
import { CreateSessionPage } from '@/pages/CreateSessionPage'
import { EditSessionPage } from '@/pages/EditSessionPage'
import { FactionDetailPage } from '@/pages/FactionDetailPage'
import { FactionsPage } from '@/pages/FactionsPage'
import { FinalizePlayedPage } from '@/pages/FinalizePlayedPage'
import { FinalizeSessionPage } from '@/pages/FinalizeSessionPage'
import { HeadToHeadPage } from '@/pages/HeadToHeadPage'
import { HomePage } from '@/pages/HomePage'
import { LeaderboardPage } from '@/pages/LeaderboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { MatchDetailPage } from '@/pages/MatchDetailPage'
import { MatchStartPage } from '@/pages/MatchStartPage'
import { MatchesPage } from '@/pages/MatchesPage'
import { MyProfilePage } from '@/pages/MyProfilePage'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { NetworkErrorPage } from '@/pages/NetworkErrorPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PasswordResetPage } from '@/pages/PasswordResetPage'
import { PlayerProfilePage } from '@/pages/PlayerProfilePage'
import { PlayersPage } from '@/pages/PlayersPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { RoundTrackerPage } from '@/pages/RoundTrackerPage'
import { ServerErrorPage } from '@/pages/ServerErrorPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/password-reset" element={<PasswordResetPage />} />

        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/matches/:id" element={<MatchDetailPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/:id" element={<PlayerProfilePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/factions" element={<FactionsPage />} />
          <Route path="/factions/:slug" element={<FactionDetailPage />} />
          <Route path="/h2h" element={<HeadToHeadPage />} />

          <Route element={<RequireAuth />}>
            <Route path="/me" element={<MyProfilePage />} />
            <Route path="/me/avatar" element={<AvatarGeneratorPage />} />
            <Route path="/matches/new" element={<CreateSessionPage />} />
            <Route path="/matches/:id/edit" element={<EditSessionPage />} />
            <Route path="/matches/:id/start" element={<MatchStartPage />} />
            <Route path="/matches/:id/rounds" element={<RoundTrackerPage />} />
            <Route
              path="/matches/:id/finalize"
              element={<FinalizeSessionPage />}
            />
            <Route
              path="/matches/:id/finalize-played"
              element={<FinalizePlayedPage />}
            />
            <Route
              path="/admin/registrations"
              element={<AdminRegistrationsPage />}
            />
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/500" element={<ServerErrorPage />} />
        <Route path="/network-error" element={<NetworkErrorPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
