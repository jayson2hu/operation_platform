import axios, { AxiosInstance, AxiosError } from 'axios'

// 创建axios实例
const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:8000/api'

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 统一错误处理
    if (error.response?.status === 401) {
      // 处理认证错误
      console.error('Authentication required')
    }
    return Promise.reject(error)
  }
)

// 重试逻辑
export const retryRequest = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
      return retryRequest(fn, retries - 1, delay * 1.5)
    }
    throw error
  }
}

export default axiosInstance
