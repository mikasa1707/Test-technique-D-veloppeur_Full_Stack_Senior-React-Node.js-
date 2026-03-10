import { api } from "./api"

export type Notification = {
  id: string
  articleId: string
  to: string
  subject: string
  status: "sent" | "failed"
  createdAt: string
}

export async function listNotifications() {
  const { data } = await api.get<Notification[]>("/api/notifications")
  return data
}