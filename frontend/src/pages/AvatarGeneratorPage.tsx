import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ImagePlus, ShieldAlert, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import {
  useAvatars,
  useDeleteAvatar,
  useGenerateAvatar,
  useSetCurrentAvatar,
} from '@/hooks/useAvatars'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useReferenceData } from '@/hooks/useReferenceData'
import type { FactionSlug } from '@/types/domain'

export function AvatarGeneratorPage() {
  const { data: user, isLoading: isUserLoading } = useCurrentUser()
  const avatarsQuery = useAvatars()
  const referenceQuery = useReferenceData()
  const generateMutation = useGenerateAvatar()
  const setCurrentMutation = useSetCurrentAvatar()
  const deleteMutation = useDeleteAvatar()
  const [selectedFaction, setSelectedFaction] = useState<FactionSlug | ''>('')
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  const formError =
    generateMutation.error instanceof Error ? generateMutation.error.message : null

  const factionOptions = useMemo(() => {
    if (!referenceQuery.data) {
      return [{ label: 'Loading factions...', value: '' }]
    }

    return [
      { label: 'Select faction', value: '' },
      ...referenceQuery.data.factions.map((faction) => ({
        label: faction.name,
        value: faction.slug,
      })),
    ]
  }, [referenceQuery.data])

  if (isUserLoading || referenceQuery.isLoading || avatarsQuery.isLoading) {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <p className="font-display text-3xl text-text-primary">
            Loading avatar studio...
          </p>
        </section>
      </main>
    )
  }

  if (referenceQuery.isError || avatarsQuery.isError || !referenceQuery.data || !user) {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-5 w-5" />}
        title="Avatar studio is unavailable"
        description="The frontend could not load profile or avatar data required for generation."
      />
    )
  }

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-border-subtle bg-[radial-gradient(circle_at_top_left,_rgba(91,45,138,0.18),_transparent_34%),linear-gradient(135deg,_rgba(23,23,31,1),_rgba(14,14,18,0.98))] p-6 shadow-panel">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-gold/80">
          Avatar Studio
        </p>
        <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-4xl text-text-primary md:text-5xl">
              Generate faction-framed avatars
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">
              Upload a photo, choose a faction, and generate a framed avatar
              through the live backend pipeline from `T-050`.
            </p>
          </div>
          <CurrentAvatarBadge nickname={user.nickname} src={user.current_avatar} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-gold" />
            <h2 className="font-display text-3xl text-text-primary">
              Generate new avatar
            </h2>
          </div>

          <form
            className="mt-6 space-y-5"
            onSubmit={(event) => {
              event.preventDefault()

              if (!selectedFaction || !selectedPhoto) {
                return
              }

              setFeedbackMessage(null)
              void generateMutation
                .mutateAsync({
                  faction: selectedFaction,
                  photo: selectedPhoto,
                })
                .then(() => {
                  setFeedbackMessage('Avatar generated. You can now set it as current.')
                  setSelectedPhoto(null)
                })
            }}
          >
            <Select
              label="Faction"
              value={selectedFaction}
              onChange={(event) =>
                setSelectedFaction(event.target.value as FactionSlug | '')
              }
              options={factionOptions}
            />

            {/* Animated faction color swatch — interpolates on faction change */}
            {selectedFaction ? (() => {
              const factionColor = referenceQuery.data?.factions.find(
                (f) => f.slug === selectedFaction,
              )?.color ?? '#d4af37'
              return (
                <motion.div
                  className="flex items-center gap-3 rounded-2xl border border-border-subtle px-4 py-2"
                  animate={{ borderColor: factionColor }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <motion.span
                    className="h-4 w-4 flex-shrink-0 rounded-full"
                    animate={{ backgroundColor: factionColor }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                  <span className="text-sm text-text-secondary">
                    {referenceQuery.data?.factions.find((f) => f.slug === selectedFaction)?.name ?? selectedFaction}
                  </span>
                </motion.div>
              )
            })() : null}

            <Input
              label="Photo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                setSelectedPhoto(file)
              }}
            />

            <div className="rounded-2xl border border-border-subtle bg-bg-base px-4 py-3 text-sm text-text-secondary">
              Limits: JPEG/PNG/WEBP, max 10 MB. The backend crops to square,
              renders `512x512`, and stores avatar history.
            </div>

            {formError ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {formError}
              </div>
            ) : null}

            {feedbackMessage ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {feedbackMessage}
              </div>
            ) : null}

            <Button
              type="submit"
              iconLeft={<ImagePlus className="h-4 w-4" />}
              disabled={!selectedFaction || !selectedPhoto || generateMutation.isPending}
            >
              {generateMutation.isPending ? 'Generating...' : 'Generate avatar'}
            </Button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <h2 className="font-display text-3xl text-text-primary">
            Avatar history
          </h2>

          {avatarsQuery.data && avatarsQuery.data.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {avatarsQuery.data.map((avatar) => {
                const faction = referenceQuery.data?.factions.find(
                  (item) => item.slug === avatar.faction,
                )

                return (
                  <article
                    key={avatar.id}
                    className="rounded-[1.75rem] border border-border-subtle bg-bg-base p-4"
                  >
                    <img
                      src={avatar.generatedImageUrl}
                      alt={`${avatar.faction} avatar`}
                      className="aspect-square w-full rounded-[1.25rem] border border-border-subtle object-cover"
                    />
                    <div className="mt-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-2xl text-text-primary">
                          {faction?.name ?? avatar.faction}
                        </p>
                        <p className="mt-1 text-sm text-text-secondary">
                          {avatar.isCurrent ? 'Current avatar' : avatar.style}
                        </p>
                      </div>
                      {avatar.isCurrent ? (
                        <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold">
                          Current
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {!avatar.isCurrent ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => void setCurrentMutation.mutateAsync(avatar.id)}
                          disabled={setCurrentMutation.isPending}
                        >
                          Make current
                        </Button>
                      ) : null}
                      <Button
                        variant="danger"
                        size="sm"
                        iconLeft={<Trash2 className="h-4 w-4" />}
                        onClick={() => void deleteMutation.mutateAsync(avatar.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState
                icon={<ImagePlus className="h-5 w-5" />}
                title="No generated avatars yet"
                description="Upload the first photo on the left to create the initial framed avatar."
              />
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function CurrentAvatarBadge({
  nickname,
  src,
}: {
  nickname: string
  src: string | null
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={`${nickname} current avatar`}
        className="h-24 w-24 rounded-[1.75rem] border border-border-subtle object-cover"
      />
    )
  }

  return (
    <div className="inline-flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-border-subtle bg-bg-base font-display text-3xl text-gold">
      {nickname.slice(0, 2).toUpperCase()}
    </div>
  )
}
