import { useMemo, useState } from 'react'
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
      return [{ label: 'Загружаем фракции...', value: '' }]
    }

    return [
      { label: 'Выберите фракцию', value: '' },
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
            Загружаем мастерскую аватаров...
          </p>
        </section>
      </main>
    )
  }

  if (referenceQuery.isError || avatarsQuery.isError || !referenceQuery.data || !user) {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-5 w-5" />}
        title="Мастерская аватаров недоступна"
        description="Фронт не смог загрузить профиль или данные аватаров, нужные для генерации."
      />
    )
  }

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-border-subtle bg-[radial-gradient(circle_at_top_left,_rgba(91,45,138,0.18),_transparent_34%),linear-gradient(135deg,_rgba(23,23,31,1),_rgba(14,14,18,0.98))] p-6 shadow-panel">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-gold/80">
          Мастерская аватаров
        </p>
        <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-4xl text-text-primary md:text-5xl">
              Генерируйте аватары с рамкой фракции
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">
              Загрузите фото, выберите фракцию и соберите новый аватар через
              живой backend pipeline из `T-050`.
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
              Создать новый аватар
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
                  setFeedbackMessage('Аватар создан. Теперь его можно сделать текущим.')
                  setSelectedPhoto(null)
                })
            }}
          >
            <Select
              label="Фракция"
              value={selectedFaction}
              onChange={(event) =>
                setSelectedFaction(event.target.value as FactionSlug | '')
              }
              options={factionOptions}
            />

            <Input
              label="Фото"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                setSelectedPhoto(file)
              }}
            />

            <div className="rounded-2xl border border-border-subtle bg-bg-base px-4 py-3 text-sm text-text-secondary">
              Ограничения: JPEG/PNG/WEBP, до 10 МБ. Бэкенд обрезает фото в
              квадрат, рендерит `512x512` и хранит историю аватаров.
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
              {generateMutation.isPending ? 'Генерируем...' : 'Создать аватар'}
            </Button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <h2 className="font-display text-3xl text-text-primary">
            История аватаров
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
                          {avatar.isCurrent ? 'Текущий аватар' : avatar.style}
                        </p>
                      </div>
                      {avatar.isCurrent ? (
                        <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold">
                          Текущий
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
                          Сделать текущим
                        </Button>
                      ) : null}
                      <Button
                        variant="danger"
                        size="sm"
                        iconLeft={<Trash2 className="h-4 w-4" />}
                        onClick={() => void deleteMutation.mutateAsync(avatar.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Удалить
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
                title="Пока нет созданных аватаров"
                description="Загрузите первое фото слева, чтобы собрать стартовый аватар в рамке."
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
        alt={`Текущий аватар игрока ${nickname}`}
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
