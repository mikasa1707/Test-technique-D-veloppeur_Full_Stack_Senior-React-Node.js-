import axios, { type AxiosError } from "axios"

export const api = axios.create({
  baseURL: "http://localhost:4000",
})

api.interceptors.request.use((config) => {

  const token = localStorage.getItem("token")

  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,

  (error: AxiosError) => {

    if (error.response?.status === 401) {

      console.warn("Token expiré → déconnexion")

      localStorage.removeItem("token")
      localStorage.removeItem("user")

      window.location.href = "/login"
    }

    return Promise.reject(error)
  }
)