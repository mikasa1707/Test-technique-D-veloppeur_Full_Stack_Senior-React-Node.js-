export type ArticleStatus = "draft" | "published" | "archived"

export type Article = {
  id: string
  title: string
  content: string
  excerpt: string
  author: string
  categories: string[]
  network: string
  status: ArticleStatus
  featured: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export type Paginated<T> = {
  items: T[]
  page: number
  limit: number
  total: number
}