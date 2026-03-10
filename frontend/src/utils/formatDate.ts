export function formatDate(iso: string | null | undefined) {
  if (!iso) return "-"
  const d = new Date(iso)
  return d.toLocaleString()
}