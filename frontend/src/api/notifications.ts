import api from './client'

export interface Notification {
  id: number
  user_id: string
  title: string
  type: string
  message: string
  is_read: boolean
  created_at: string
}

export interface NotificationsResponse {
  notifications: Notification[]
  unread: number
}

export async function getNotifications(): Promise<NotificationsResponse> {
  const { data } = await api.get('/notifications')
  return data
}

export async function markRead(ids?: number[]): Promise<void> {
  await api.post('/notifications/read', ids ? { ids } : {})
}
