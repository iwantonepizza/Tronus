export function formatPlayerRange(min: number, max: number) {
  return min === max ? String(min) : `${min}-${max}`
}
