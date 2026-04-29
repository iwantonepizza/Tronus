import { useReferenceData } from '@/hooks/useReferenceData'

export function useFactions() {
  const referenceQuery = useReferenceData()

  return {
    ...referenceQuery,
    data: referenceQuery.data?.factions ?? [],
  }
}
