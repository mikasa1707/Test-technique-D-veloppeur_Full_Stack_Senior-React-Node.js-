import { api } from "./api"
import type { Category } from "../types/category"

export async function listCategories() {
  const { data } = await api.get<Category[]>("/api/categories")
  return data
}

export async function createCategory(payload: Omit<Category, "id">) {
  const { data } = await api.post<Category>("/api/categories", payload)
  return data
}

export async function updateCategory(id: string, payload: Partial<Omit<Category, "id">>) {
  const { data } = await api.put<Category>(`/api/categories/${id}`, payload)
  return data
}

export async function deleteCategory(id: string) {
  await api.delete(`/api/categories/${id}`)
}