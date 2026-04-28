import { fireEvent, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useAvatars,
  useDeleteAvatar,
  useGenerateAvatar,
  useSetCurrentAvatar,
} from '@/hooks/useAvatars'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useUpdateMyProfile } from '@/hooks/useProfile'
import { useReferenceData } from '@/hooks/useReferenceData'
import { AvatarGeneratorPage } from '@/pages/AvatarGeneratorPage'
import { MyProfilePage } from '@/pages/MyProfilePage'
import { renderWithProviders } from './renderWithProviders'

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(),
}))

vi.mock('@/hooks/useReferenceData', () => ({
  useReferenceData: vi.fn(),
}))

vi.mock('@/hooks/useProfile', () => ({
  useUpdateMyProfile: vi.fn(),
}))

vi.mock('@/hooks/useAvatars', () => ({
  useAvatars: vi.fn(),
  useGenerateAvatar: vi.fn(),
  useSetCurrentAvatar: vi.fn(),
  useDeleteAvatar: vi.fn(),
}))

const mockedUseCurrentUser = vi.mocked(useCurrentUser)
const mockedUseReferenceData = vi.mocked(useReferenceData)
const mockedUseUpdateMyProfile = vi.mocked(useUpdateMyProfile)
const mockedUseAvatars = vi.mocked(useAvatars)
const mockedUseGenerateAvatar = vi.mocked(useGenerateAvatar)
const mockedUseSetCurrentAvatar = vi.mocked(useSetCurrentAvatar)
const mockedUseDeleteAvatar = vi.mocked(useDeleteAvatar)

describe('profile pages', () => {
  beforeEach(() => {
    mockedUseCurrentUser.mockReturnValue({
      data: {
        id: 1,
        username: 'ironfist@example.com',
        email: 'ironfist@example.com',
        is_active: true,
        nickname: 'IronFist',
        favorite_faction: 'lannister',
        bio: 'King of the table.',
        current_avatar: 'http://localhost:8000/media/avatars/1/current.png',
        date_joined: '2026-04-22T00:00:00Z',
      },
      isLoading: false,
      refetch: vi.fn(),
    })

    mockedUseReferenceData.mockReturnValue({
      data: {
        factions: [
          {
            slug: 'lannister',
            name: 'Lannister',
            color: '#9B2226',
            onPrimary: '#F5E6C8',
          },
          {
            slug: 'stark',
            name: 'Stark',
            color: '#6B7B8C',
            onPrimary: '#F0F0F0',
          },
        ],
        modes: [],
        decks: [],
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useReferenceData>)

    mockedUseUpdateMyProfile.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useUpdateMyProfile>)

    mockedUseAvatars.mockReturnValue({
      data: [
        {
          id: 5,
          faction: 'lannister',
          style: 'basic_frame',
          sourcePhotoUrl: null,
          generatedImageUrl: 'http://localhost:8000/media/avatars/1/5.png',
          isCurrent: true,
          createdAt: '2026-04-23T00:00:00Z',
        },
      ],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useAvatars>)

    mockedUseGenerateAvatar.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useGenerateAvatar>)

    mockedUseSetCurrentAvatar.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof useSetCurrentAvatar>)

    mockedUseDeleteAvatar.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteAvatar>)
  })

  it('submits profile changes from my profile page', () => {
    const updateMock = vi.fn().mockResolvedValue(undefined)
    mockedUseUpdateMyProfile.mockReturnValue({
      mutateAsync: updateMock,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useUpdateMyProfile>)

    renderWithProviders(
      <MemoryRouter>
        <MyProfilePage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Nickname'), {
      target: { value: 'LionLord' },
    })
    fireEvent.change(screen.getByLabelText('Bio'), {
      target: { value: 'Still owns the Iron Bank.' },
    })
    fireEvent.change(screen.getByLabelText('Favorite faction'), {
      target: { value: 'stark' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Save profile/i }))

    expect(updateMock).toHaveBeenCalledWith({
      nickname: 'LionLord',
      bio: 'Still owns the Iron Bank.',
      favorite_faction: 'stark',
    })
  })

  it('renders avatar history and submits generation request', () => {
    const generateMock = vi.fn().mockResolvedValue(undefined)
    mockedUseGenerateAvatar.mockReturnValue({
      mutateAsync: generateMock,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useGenerateAvatar>)

    renderWithProviders(
      <MemoryRouter>
        <AvatarGeneratorPage />
      </MemoryRouter>,
    )

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })

    fireEvent.change(screen.getByLabelText('Faction'), {
      target: { value: 'stark' },
    })
    fireEvent.change(screen.getByLabelText('Photo'), {
      target: { files: [file] },
    })
    fireEvent.click(screen.getByRole('button', { name: /Generate avatar/i }))

    expect(generateMock).toHaveBeenCalledWith({
      faction: 'stark',
      photo: file,
    })
    expect(screen.getByText('Avatar history')).toBeInTheDocument()
  })
})
