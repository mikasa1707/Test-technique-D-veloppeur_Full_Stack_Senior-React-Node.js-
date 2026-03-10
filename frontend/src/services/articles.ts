import type { AxiosRequestConfig } from "axios"
import { api } from "./api"
import type { Article, Paginated, ArticleStatus } from "../types/article"

export type ArticlesQuery = {
  page?: number
  limit?: number
  q?: string
  status?: ArticleStatus
  network?: string
  featured?: boolean
  categoryIds?: string[] // multi
}

type Params = NonNullable<AxiosRequestConfig["params"]>

export async function listArticles(query: ArticlesQuery) {
  const params: Params = {
    page: query.page ?? 1,
    limit: query.limit ?? 20,
  }

  if (query.q) params.q = query.q
  if (query.status) params.status = query.status
  if (query.network) params.network = query.network
  if (query.featured) params.featured = true // ou "true" si ton backend l'exige
  if (query.categoryIds?.length) params.category = query.categoryIds.join(",")

  const { data } = await api.get<Paginated<Article>>("/api/articles", { params })
  return data
}

export async function deleteArticle(id: string) {
  await api.delete(`/api/articles/${id}`)
}

export async function updateArticle(id: string, payload: Partial<Article>) {
  const { data } = await api.put<Article>(`/api/articles/${id}`, payload)
  return data
}

export async function getArticle(id: string) {
  const { data } = await api.get<Article>(`/api/articles/${id}`)
  return data
}

export async function createArticle(payload: Partial<Article>) {
  const { data } = await api.post<Article>("/api/articles", payload)
  return data
}