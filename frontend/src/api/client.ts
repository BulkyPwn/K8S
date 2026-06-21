import axios from 'axios'
import { message } from 'antd'

const client = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
})

client.interceptors.response.use(
  (resp) => {
    const data = resp.data
    if (data && typeof data === 'object' && 'code' in data) {
      if (data.code !== 0) {
        message.error(data.message || '请求失败')
        return Promise.reject(new Error(data.message))
      }
      return data.data
    }
    return data
  },
  (error) => {
    const msg = error?.response?.data?.message || error.message || '网络错误'
    message.error(msg)
    return Promise.reject(error)
  },
)

export default client
