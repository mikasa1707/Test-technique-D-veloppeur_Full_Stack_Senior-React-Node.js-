import { api } from "./api"

export type ImportRow = {
  title: string
  content: string
  excerpt?: string
  author?: string
  category: string
  network: string
}

export type ImportResult = {
  createdCount: number
  createdIds: string[]
  errors: { index: number; message: string }[]
}

export async function importArticles(rows: ImportRow[]) {
  const { data } = await api.post<ImportResult>("/api/import/articles", rows)
  return data
}