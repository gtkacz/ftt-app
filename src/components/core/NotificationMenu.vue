<template>
	<div>
		<!-- Notification Button with Badge -->
		<v-btn icon variant="text" ref="menuActivator">
			<v-badge :content="unreadCount" :model-value="unreadCount > 0" color="error" overlap>
				<v-icon>notifications</v-icon>
			</v-badge>
		</v-btn>

		<!-- Notifications Menu -->
		<v-menu v-model="menuOpen" :activator="menuActivator" location="bottom end" offset="8"
			:close-on-content-click="false" width="400">
			<v-card class="notification-menu">
				<v-card-title class="d-flex align-center justify-space-between pa-4">
					<span class="text-h6">Notifications</span>
					<v-btn v-if="unreadCount > 0" variant="tonal" prepend-icon="check" size="small" color="primary" @click="markAllAsRead"
						:loading="markingAllRead">
						Mark all read
					</v-btn>
				</v-card-title>

				<v-divider></v-divider>

				<div class="notification-list">
					<v-list v-if="notifications.length > 0" density="comfortable" class="pa-0">
						<v-list-item v-for="notification in sortedNotifications" :key="notification.id" class="pa-4" :class="[
							'notification-item',
							{ 'notification-unread': !notification.is_read }
						]" @click="markAsRead(notification)">
							<template #prepend>
								<v-icon :color="getNotificationColor(notification.level)">
									{{ getNotificationIcon(notification.level) }}
								</v-icon>
							</template>

							<v-list-item-title class="text-wrap text-body-2">
								{{ notification.message }}
							</v-list-item-title>

							<v-list-item-subtitle class="text-caption">
								{{ formatDate(notification.created_at) }}
							</v-list-item-subtitle>

							<template #append>
								<div v-if="!notification.is_read" class="unread-indicator"></div>
							</template>
						</v-list-item>
					</v-list>

					<div v-else class="text-center pa-6 text-body-2 text-medium-emphasis">
						No notifications
					</div>
				</div>
			</v-card>
		</v-menu>

		<!-- Live Notification Snackbar -->
		<v-snackbar v-model="snackbarOpen" :timeout="5000" location="top" color="primary" variant="elevated">
			<div class="d-flex align-center">
				<v-icon :color="liveNotification ? getNotificationColor(liveNotification.level) : 'white'" class="mr-3">
					{{ liveNotification ? getNotificationIcon(liveNotification.level) : 'notifications' }}
				</v-icon>
				<span class="text-body-2">
					{{ liveNotification?.message }}
				</span>
			</div>

			<template #actions>
				<v-btn icon="close" size="small" @click="snackbarOpen = false"></v-btn>
			</template>
		</v-snackbar>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/api/axios'

interface Notification {
	id: number
	message: string
	is_read: boolean
	priority: number
	level: 'info' | 'warning' | 'error'
	created_at: string
	updated_at: string
	user: number
}

// Reactive state
const notifications = ref<Notification[]>([])
const menuOpen = ref(false)
const menuActivator = ref<HTMLElement>()
const snackbarOpen = ref(false)
const liveNotification = ref<Notification | null>(null)
const markingAllRead = ref(false)
let pollInterval: NodeJS.Timeout | null = null
let previousNotificationIds = new Set<number>()

// Computed properties
const unreadCount = computed(() =>
	notifications.value.filter(n => !n.is_read).length
)

const sortedNotifications = computed(() => {
	return [...notifications.value].sort((a, b) => {
		// First sort by read status (unread first)
		if (a.is_read !== b.is_read) {
			return a.is_read ? 1 : -1
		}

		// If both are unread, sort by priority (higher first)
		if (!a.is_read && !b.is_read && a.priority !== b.priority) {
			return b.priority - a.priority
		}

		// Finally sort by created_at (most recent first)
		return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
	})
})

// Mock API functions (replace with actual endpoints)
const fetchNotifications = async (): Promise<Notification[]> => {
	const response = await api.get('/notifications/')
	return response.data.results
}

const markNotificationAsRead = async (notificationId: number): Promise<void> => {
	// TODO: Replace with actual API endpoint
	// await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' })
	console.log(`Marking notification ${notificationId} as read`)
}

const markAllNotificationsAsRead = async (): Promise<void> => {
	// TODO: Replace with actual API endpoint
	// await fetch('/api/notifications/mark-all-read', { method: 'POST' })
	console.log('Marking all notifications as read')
}

// Methods
const loadNotifications = async () => {
	const newNotifications = await fetchNotifications()

	// Check for new notifications (for live snackbar)
	if (previousNotificationIds.size > 0) {
		const newNotifs = newNotifications.filter(n =>
			!previousNotificationIds.has(n.id) && !n.is_read
		)

		if (newNotifs.length > 0) {
			// Show snackbar for the most recent new notification
			const mostRecent = newNotifs.sort((a, b) =>
				new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
			)[0]

			liveNotification.value = mostRecent
			snackbarOpen.value = true
		}
	}

	notifications.value = newNotifications
	previousNotificationIds = new Set(newNotifications.map(n => n.id))
}

const markAsRead = async (notification: Notification) => {
	if (notification.is_read) return

	await markNotificationAsRead(notification.id)
	notification.is_read = true
}

const markAllAsRead = async () => {
	if (unreadCount.value === 0) return

	markingAllRead.value = true
	await markAllNotificationsAsRead()
	notifications.value.forEach(n => n.is_read = true)
	markingAllRead.value = false
}

const getNotificationColor = (level: string): string => {
	switch (level) {
		case 'info': return 'info'
		case 'warning': return 'warning'
		case 'error': return 'error'
		default: return 'primary'
	}
}

const getNotificationIcon = (level: string): string => {
	switch (level) {
		case 'info': return 'info'
		case 'warning': return 'warning'
		case 'error': return 'dangerous'
		default: return 'notifications'
	}
}

const formatDate = (dateString: string): string => {
	const date = new Date(dateString)
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffMins = Math.floor(diffMs / 60000)
	const diffHours = Math.floor(diffMins / 60)
	const diffDays = Math.floor(diffHours / 24)

	if (diffMins < 1) return 'Just now'
	if (diffMins < 60) return `${diffMins}m ago`
	if (diffHours < 24) return `${diffHours}h ago`
	if (diffDays < 7) return `${diffDays}d ago`

	return date.toLocaleDateString()
}

// Lifecycle
onMounted(() => {
	loadNotifications()
	// Poll every 5 minutes
	pollInterval = setInterval(loadNotifications, 5 * 60 * 1000)
})

onUnmounted(() => {
	if (pollInterval) {
		clearInterval(pollInterval)
	}
})
</script>

<style lang="scss" scoped>
.notification-menu {
	max-height: 500px;
	display: flex;
	flex-direction: column;
}

.notification-list {
	flex: 1;
	overflow-y: auto;
	max-height: 400px;
}

.notification-item {
	border-left: 3px solid transparent;
	transition: all 0.2s ease;

	&:hover {
		background-color: rgba(var(--v-theme-primary), 0.05);
	}

	&.notification-unread {
		background-color: rgba(var(--v-theme-primary), 0.02);
		border-left-color: rgb(var(--v-theme-primary));
	}
}

.unread-indicator {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background-color: rgb(var(--v-theme-primary));
}

// Custom scrollbar for notification list
.notification-list::-webkit-scrollbar {
	width: 4px;
}

.notification-list::-webkit-scrollbar-track {
	background: rgba(var(--v-theme-on-surface), 0.05);
}

.notification-list::-webkit-scrollbar-thumb {
	background: rgba(var(--v-theme-on-surface), 0.2);
	border-radius: 2px;
}

.notification-list::-webkit-scrollbar-thumb:hover {
	background: rgba(var(--v-theme-on-surface), 0.3);
}
</style>