export interface Notification {
  id: number
  message: string
  is_read: boolean
  priority: number
  level: 'info' | 'warning' | 'error'
  created_at: string
  updated_at: string
  user: number
  redirect_to?: string
}
