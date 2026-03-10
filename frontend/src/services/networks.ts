import { api } from "./api"

export type Network = { id: string; name: string; description: string }

export async function listNetworks() {
  const { data } = await api.get<Network[]>("/api/networks")
  return data
}