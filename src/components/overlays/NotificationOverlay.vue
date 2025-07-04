<template>
  <v-overlay
    v-model="showNotifications"
    class="notification-overlay"
    persistent
    location-strategy="connected"
    origin="top right"
  >
    <v-card
      class="notification-card"
      width="400"
      max-height="500"
    >
      <v-card-title class="notification-header">
        <span>Notifications</span>
        <v-btn
          icon
          variant="text"
          size="small"
          @click="closeNotifications"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="notification-content">
        <div v-if="notifications.length === 0" class="no-notifications">
          <v-icon size="48" color="grey-lighten-1">mdi-bell-off</v-icon>
          <p>No new notifications</p>
        </div>
        
        <div v-else class="notification-list">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.read }"
          >
            <div class="notification-icon">
              <v-icon :color="getIconColor(notification.type)">
                {{ getIcon(notification.type) }}
              </v-icon>
            </div>
            
            <div class="notification-content">
              <h4>{{ notification.title }}</h4>
              <p>{{ notification.message }}</p>
              <small>{{ formatTime(notification.timestamp) }}</small>
            </div>
            
            <v-btn
              v-if="!notification.read"
              icon
              variant="text"
              size="small"
              @click="markAsRead(notification.id)"
            >
              <v-icon>mdi-check</v-icon>
            </v-btn>
          </div>
        </div>
      </v-card-text>
      
      <v-card-actions v-if="notifications.length > 0">
        <v-btn
          variant="text"
          @click="markAllAsRead"
          :disabled="!hasUnreadNotifications"
        >
          Mark all as read
        </v-btn>
        <v-spacer />
        <v-btn
          variant="text"
          @click="clearAll"
        >
          Clear all
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-overlay>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNavigationStore } from '../../stores/navigation'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  read: boolean
}

const navigationStore = useNavigationStore()

const showNotifications = computed({
  get: () => navigationStore.showNotifications,
  set: (value) => {
    if (!value) {
      navigationStore.toggleNotifications()
    }
  }
})

// Mock notifications data
const notifications = ref<Notification[]>([
  {
    id: '1',
    title: 'Draft Starting Soon',
    message: 'Your dynasty draft will begin in 30 minutes.',
    type: 'info',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
  },
  {
    id: '2',
    title: 'Trade Proposal',
    message: 'You have a new trade proposal from John Doe.',
    type: 'success',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
  },
  {
    id: '3',
    title: 'Waiver Claim',
    message: 'Your waiver claim for Player X was successful.',
    type: 'success',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
  },
])

const hasUnreadNotifications = computed(() => 
  notifications.value.some(n => !n.read)
)

const closeNotifications = () => {
  navigationStore.toggleNotifications()
}

const markAsRead = (id: string) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
}

const clearAll = () => {
  notifications.value.splice(0)
}

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return 'mdi-check-circle'
    case 'warning': return 'mdi-alert'
    case 'error': return 'mdi-alert-circle'
    default: return 'mdi-information'
  }
}

const getIconColor = (type: string) => {
  switch (type) {
    case 'success': return 'success'
    case 'warning': return 'warning'
    case 'error': return 'error'
    default: return 'info'
  }
}

const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}
</script>

<style lang="scss" scoped>
.notification-overlay {
  position: fixed;
  top: 64px;
  right: 16px;
  z-index: 2000;
}

.notification-card {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  
  span {
    font-size: 18px;
    font-weight: 600;
  }
}

.notification-content {
  padding: 0;
  max-height: 400px;
  overflow-y: auto;
}

.no-notifications {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: rgb(var(--v-theme-on-surface-variant));
  
  p {
    margin-top: 16px;
    font-size: 16px;
  }
}

.notification-list {
  display: flex;
  flex-direction: column;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.04);
  }
  
  &.unread {
    background-color: rgba(var(--v-theme-secondary), 0.05);
    border-left: 4px solid rgb(var(--v-theme-secondary));
  }
  
  &:last-child {
    border-bottom: none;
  }
}

.notification-icon {
  margin-right: 12px;
  margin-top: 2px;
}

.notification-content {
  flex: 1;
  
  h4 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
    color: rgb(var(--v-theme-on-surface));
  }
  
  p {
    font-size: 13px;
    color: rgb(var(--v-theme-on-surface-variant));
    margin-bottom: 8px;
    line-height: 1.4;
  }
  
  small {
    font-size: 12px;
    color: rgb(var(--v-theme-on-surface-variant));
  }
}
</style>