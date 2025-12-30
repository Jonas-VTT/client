import axios from 'axios'

const isDev = import.meta.env.DEV

const api = axios.create({
   baseURL: isDev ? 'http://localhost:3000/api' : '/api',
})

api.interceptors.request.use((config) => {
   const token = localStorage.getItem('token')
   if (token) {
      config.headers.Authorization = `Bearer ${token}`
   }
   return config
})

export default api