<template>
	<v-container fluid class="pa-0">
		<v-card class="pa-4 bg-surface-variant" elevation="10">
			<!-- Loading state -->
			<v-progress-linear v-if="loading" indeterminate class="mb-4"></v-progress-linear>

			<!-- Filters and Column Settings -->
			<v-expand-transition>
				<v-card-text v-if="!loading" class="pa-0">
					<v-row class="mb-4" align="center">
						<!-- Search bar - 75% width -->
						<v-col cols="9">
							<v-text-field rounded v-model="search" prepend-inner-icon="search" label="Search users..."
								single-line hide-details clearable density="compact" variant="outlined"
								class="search-field"></v-text-field>
						</v-col>

						<!-- Icon buttons - 25% width -->
						<v-col cols="3" class="d-flex justify-end ga-2">
							<!-- Filter button with menu -->
							<v-menu v-model="filterMenu" :close-on-content-click="false" location="bottom">
								<template #activator="{ props }" v-tooltip="'Filter users'">
									<v-btn v-bind="props" icon variant="outlined" size="small"
										:color="hasActiveFilters ? 'primary' : undefined">
										<v-badge :content="activeFilterCount" :model-value="hasActiveFilters"
											color="error">
											<v-icon icon="filter_list" />
										</v-badge>
									</v-btn>
								</template>
								<v-card min-width="600" density="comfortable" class="pa-4">
									<template #title class="text-h6">Filters</template>
									<template #append><v-btn variant="text" icon @click="filterMenu = false"
											size="small"><v-icon icon="close" /></v-btn></template>
									<v-divider />
									<v-card-text>
										<v-row>
											<v-col cols="12" class="py-2">
												<v-select rounded v-model="filters.team" :items="teams" label="Team"
													clearable density="compact" variant="outlined"
													prepend-inner-icon="recent_actors" multiple chips
													closable-chips></v-select>
											</v-col>
											<v-col cols="12" class="py-2">
												<v-select rounded v-model="filters.status" :items="statuses"
													label="Status" clearable density="compact" variant="outlined"
													prepend-inner-icon="info" multiple chips closable-chips></v-select>
											</v-col>
											<v-col cols="12" class="py-2">
												<v-select rounded v-model="filters.role" :items="roles" label="Role"
													clearable density="compact" variant="outlined"
													prepend-inner-icon="badge" multiple chips closable-chips></v-select>
											</v-col>
											<v-col cols="12">
												<v-divider class="my-3" />
												<div class="text-subtitle-2 mb-2">Date Filters</div>
											</v-col>
											<v-col cols="12" class="py-2">
												<div class="text-body-2 mb-2">Date Joined</div>
												<v-row v-if="!useRelativeDates">
													<v-col cols="6">
														<v-text-field v-model="filters.dateJoinedStart" label="From"
															type="date" density="compact" variant="outlined"
															clearable></v-text-field>
													</v-col>
													<v-col cols="6">
														<v-text-field v-model="filters.dateJoinedEnd" label="To"
															type="date" density="compact" variant="outlined"
															clearable></v-text-field>
													</v-col>
												</v-row>
												<div v-else>
													<v-range-slider v-model="filters.dateJoinedRange" :max="365"
														:min="0" :step="1" hide-details class="mt-4"
														thumb-label="always">
														<template #thumb-label="{ modelValue }">
															{{ modelValue }}d
														</template>
													</v-range-slider>
													<div class="text-caption text-center mt-2">
														{{ dateJoinedRangeText }}
													</div>
												</div>
											</v-col>
											<v-col cols="12" class="py-2">
												<div class="text-body-2 mb-2">Last Login</div>
												<v-row v-if="!useRelativeDates">
													<v-col cols="6">
														<v-text-field v-model="filters.lastLoginStart" label="From"
															type="date" density="compact" variant="outlined"
															clearable></v-text-field>
													</v-col>
													<v-col cols="6">
														<v-text-field v-model="filters.lastLoginEnd" label="To"
															type="date" density="compact" variant="outlined"
															clearable></v-text-field>
													</v-col>
												</v-row>
												<div v-else>
													<v-range-slider v-model="filters.lastLoginRange" :max="365" :min="0"
														:step="1" hide-details class="mt-4" thumb-label="always">
														<template #thumb-label="{ modelValue }">
															{{ modelValue }}d
														</template>
													</v-range-slider>
													<div class="text-caption text-center mt-2">
														{{ lastLoginRangeText }}
													</div>
												</div>
											</v-col>
										</v-row>
									</v-card-text>
									<v-card-actions>
										<v-spacer></v-spacer>
										<v-btn @click="clearFilters" icon variant="outlined" size="small"
											:disabled="!hasActiveFilters" v-tooltip="'Clear all filters'">
											<v-icon icon="filter_alt_off" />
										</v-btn>
									</v-card-actions>
								</v-card>
							</v-menu>

							<!-- Manage columns button -->
							<v-menu v-model="columnMenu" max-width="500" transition="fade-transition"
								:close-on-content-click="false" location="bottom">
								<template #activator="{ props }" v-tooltip="'Manage columns'">
									<v-btn v-bind="props" icon variant="outlined" size="small">
										<v-icon icon="view_column" />
									</v-btn>
								</template>
								<v-card min-width="500" density="comfortable" class="pa-4">
									<v-card-title>Manage Columns</v-card-title>
									<v-divider />
									<v-card-text>
										<v-list>
											<v-list-item v-for="(header, index) in allHeaders" :key="header.key"
												:prepend-icon="index === 0 ? 'drag_indicator' : 'drag_handle'">
												<template #prepend>
													<v-icon v-if="header.key !== 'user'" @mousedown="startDrag(index)"
														style="cursor: move;">drag_handle</v-icon>
													<v-icon v-else>lock</v-icon>
												</template>
												<v-list-item-title>{{ header.title }}</v-list-item-title>
												<template #append>
													<v-checkbox v-model="header.visible"
														:disabled="header.key === 'user'" hide-details
														density="compact"></v-checkbox>
												</template>
											</v-list-item>
										</v-list>
									</v-card-text>
									<v-card-actions>
										<v-spacer></v-spacer>
										<v-btn icon variant="outlined" @click="saveColumnSettings" color="success"
											size="small"><v-icon icon="check" /></v-btn>
									</v-card-actions>
								</v-card>
							</v-menu>

							<!-- Settings -->
							<v-menu v-model="settingsMenu" max-width="500" transition="fade-transition"
								:close-on-content-click="false" location="bottom">
								<template #activator="{ props }" v-tooltip="'Settings'">
									<v-btn v-bind="props" icon variant="outlined" size="small">
										<v-icon icon="settings" />
									</v-btn>
								</template>
								<v-card min-width="500" density="comfortable" class="pa-4">
									<v-card-title>Display Settings</v-card-title>
									<v-divider />
									<v-card-text>
										<v-list>
											<v-list-item>
												<v-list-item-title>Use relative dates</v-list-item-title>
												<template #append>
													<v-checkbox v-model="useRelativeDates" hide-details
														density="compact" />
												</template>
											</v-list-item>
											<v-list-item>
												<v-list-item-title>Show bulk action checkboxes</v-list-item-title>
												<template #append>
													<v-checkbox v-model="showCheckboxes" hide-details
														density="compact" />
												</template>
											</v-list-item>
										</v-list>
									</v-card-text>
								</v-card>
							</v-menu>
						</v-col>
					</v-row>
				</v-card-text>
			</v-expand-transition>

			<!-- Data table -->
			<v-data-table v-if="!loading" v-model="selected" :headers="tableHeaders" :items="filteredUsers"
				:search="search" :custom-filter="customSearch" :sort-by="[{ key: 'last_name', order: 'asc' }]"
				fixed-header fixed-footer height="calc(100vh - 200px)" :loading="loading"
				:no-data-text="'No users found'" :no-results-text="'No matching users'" density="comfortable"
				class="elevation-1 pa-4 bg-surface-variant" hide-no-data hover sort-asc-icon="arrow_drop_up"
				sort-desc-icon="arrow_drop_down" :items-per-page="itemsPerPage" :page="page"
				:show-select="showCheckboxes" item-value="id" @click:row="(event, { item }) => viewUser(item)">

				<!-- User photo and name -->
				<template #item.user="{ item }">
					<div class="d-flex align-center py-2" v-if="item.is_active">
						<v-avatar size="40" class="mr-3">
							<v-icon size="40" variant="outlined" :filled="false" icon="account_circle" />
						</v-avatar>
						<div>
							<div class="font-weight-medium d-flex align-center ga-1">
								{{ item.last_name }}, {{ item.first_name }}
								<v-icon icon="crown" v-if="item.is_superuser" color="warning" size="16"
									v-tooltip="'Administrator'" />
								<v-icon icon="trip" v-if="item.is_staff" color="warning" size="16"
									v-tooltip="'Commissioner'" />
							</div>
							<div class="text-caption text-grey">
								@{{ item.username }}
							</div>
							<div v-if="item.team" class="text-caption text-grey d-flex align-center ga-1">
								<v-icon size="20">groups</v-icon>
								{{ item.team.name }}
							</div>
						</div>
					</div>
					<div class="d-flex align-center py-2" v-else>
						<v-avatar size="40" class="mr-3">
							<v-icon size="40" icon="account_circle_off" variant="outlined" :filled="false" />
						</v-avatar>
						<div>
							<div
								class="font-weight-medium text-grey-darken-1 text-decoration-line-through d-flex align-center ga-1">
								{{ item.last_name }}, {{ item.first_name }}
								<v-icon icon="crown" v-if="item.is_superuser" color="warning" size="16"
									v-tooltip="'Administrator'" />
								<v-icon icon="trip" v-if="item.is_staff" color="warning" size="16"
									v-tooltip="'Commissioner'" />
							</div>
							<div class="text-caption text-grey-darken-1 text-decoration-line-through">
								@{{ item.username }}
							</div>
							<div v-if="item.team"
								class="text-caption text-grey-darken-1 text-decoration-line-through d-flex align-center ga-1">
								<v-icon size="20">groups</v-icon>
								{{ item.team.name }}
							</div>
						</div>
					</div>
				</template>

				<!-- Email -->
				<template #item.email="{ item }">
					<a v-if="item.is_active" :href="`mailto:${item.email}`" @click.stop class="text-decoration-none">
						{{ item.email }}
					</a>
					<span v-else class="text-grey-darken-1 text-decoration-line-through">{{ item.email }}</span>
				</template>

				<!-- Team -->
				<template #item.team_name="{ item }">
					<span v-if="item.team">{{ item.team.name }}</span>
					<span v-else class="text-grey-darken-1">No Team</span>
				</template>

				<!-- Status badges -->
				<template #item.status="{ item }">
					<v-chip-group column>
						<v-chip v-if="item.is_active" color="success" size="x-small" v-tooltip="'Active'">
							Active
						</v-chip>
						<v-chip v-else color="error" size="x-small" v-tooltip="'Inactive'">
							Inactive
						</v-chip>
						<v-chip v-if="item.is_approved" color="primary" size="x-small" v-tooltip="'Approved'">
							Approved
						</v-chip>
						<v-chip v-else color="warning" size="x-small" v-tooltip="'Not Approved'">
							Not Approved
						</v-chip>
						<v-chip v-if="item.is_staff" color="warning" size="x-small" v-tooltip="'Commissioner'">
							Commissioner
						</v-chip>
					</v-chip-group>
				</template>

				<!-- Join Date -->
				<template #item.date_joined="{ item }">
					<span>
						{{ formatDate(item.date_joined) }}
					</span>
				</template>

				<!-- Last Login -->
				<template #item.last_login="{ item }">
					<span v-if="item?.last_login">
						{{ formatDate(item.last_login) }}
					</span>
					<span v-else class="text-grey-darken-1">Never</span>
				</template>

				<!-- Updated At -->
				<template #item.updated_at="{ item }">
					<span v-if="item?.updated_at">
						{{ formatDate(item.updated_at) }}
					</span>
					<span v-else class="text-grey-darken-1">Never</span>
				</template>

				<!-- Pagination footer -->
				<template #bottom>
					<v-divider />
					<v-container fluid class="pa-2 mt-4">
						<v-row justify="space-between" align="center">
							<v-col cols="3">
								<span class="text-caption">
									Showing {{ paginationText }}
								</span>
							</v-col>
							<v-col cols="6" class="d-flex ga-2">
								<v-row class="ga-2" align="center" justify="end">
									<v-select rounded v-model="itemsPerPage" :items="[10, 25, 50, 100, -1]"
										:item-title="item => item === -1 ? 'All' : item" label="Items per page"
										density="compact" variant="outlined" hide-details
										class="items-per-page-select" />
									<v-btn variant="text" @click="page = 1" :disabled="page === 1" :icon="true"
										density="compact">
										<v-icon icon="first_page" />
									</v-btn>
									<v-pagination v-if="pageCount > 1" v-model="page" :length="pageCount"
										:total-visible="5" density="compact" rounded />
									<v-btn variant="text" @click="page = pageCount" :disabled="page === pageCount"
										:icon="true" density="compact">
										<v-icon icon="last_page" />
									</v-btn>
								</v-row>
							</v-col>
						</v-row>
					</v-container>
				</template>
			</v-data-table>

			<!-- Error state -->
			<v-alert v-if="error" type="error" class="mt-4">
				{{ error }}
			</v-alert>
		</v-card>

		<!-- Bulk Actions Snackbar -->
		<v-snackbar v-model="showBulkActions" :timeout="-1" location="bottom" multi-line color="primary" elevation="24"
			class="bulk-action-snackbar">
			<v-container>
				<v-row align="center">
					<v-col cols="auto">
						<span class="text-h6 mr-2">{{ selected.length }} users selected</span>
					</v-col>
					<v-col>
						<div class="d-flex flex-wrap ga-2">
							<v-chip v-if="pendingChanges.toggleActive !== null" closable
								@click:close="pendingChanges.toggleActive = null"
								:color="pendingChanges.toggleActive ? 'success' : 'error'">
								{{ pendingChanges.toggleActive ? 'Activate' : 'Deactivate' }}
							</v-chip>
							<v-chip v-if="pendingChanges.toggleApproved !== null" closable
								@click:close="pendingChanges.toggleApproved = null"
								:color="pendingChanges.toggleApproved ? 'primary' : 'warning'">
								{{ pendingChanges.toggleApproved ? 'Approve' : 'Unapprove' }}
							</v-chip>
							<v-chip v-if="pendingChanges.toggleStaff !== null" closable
								@click:close="pendingChanges.toggleStaff = null" color="warning">
								{{ pendingChanges.toggleStaff ? 'Make Commissioner' : 'Remove Commissioner' }}
							</v-chip>
							<v-chip v-if="pendingChanges.delete" closable @click:close="pendingChanges.delete = false"
								color="error">
								Delete
							</v-chip>
						</div>
					</v-col>
					<v-col cols="auto">
						<v-menu v-model="bulkActionMenu" :close-on-content-click="false" location="top">
							<template #activator="{ props }">
								<v-btn v-bind="props" icon variant="tonal" color="white" class="mr-2">
									<v-icon icon="sweep" />
								</v-btn>
							</template>
							<v-card>
								<v-list>
									<v-list-item @click="toggleBulkAction('toggleActive')">
										<template #prepend>
											<v-icon :icon="getToggleIcon('active')" />
										</template>
										<v-list-item-title>{{ getToggleText('active') }}</v-list-item-title>
									</v-list-item>
									<v-list-item @click="toggleBulkAction('toggleApproved')">
										<template #prepend>
											<v-icon :icon="getToggleIcon('approved')" />
										</template>
										<v-list-item-title>{{ getToggleText('approved') }}</v-list-item-title>
									</v-list-item>
									<v-list-item @click="toggleBulkAction('toggleStaff')">
										<template #prepend>
											<v-icon :icon="getToggleIcon('staff')" />
										</template>
										<v-list-item-title>{{ getToggleText('staff') }}</v-list-item-title>
									</v-list-item>
									<v-divider v-if="isAdmin" />
									<v-list-item v-if="isAdmin" @click="toggleBulkAction('delete')">
										<template #prepend>
											<v-icon icon="delete" color="error" />
										</template>
										<v-list-item-title class="text-error">Delete Users</v-list-item-title>
									</v-list-item>
								</v-list>
							</v-card>
						</v-menu>
						<v-btn icon variant="tonal" color="white" :disabled="!hasPendingChanges"
							@click="confirmDialog = true" class="mr-2">
							<v-icon icon="check" />
						</v-btn>
						<v-btn icon variant="text" color="white" @click="cancelBulkActions">
							<v-icon icon="close" />
						</v-btn>
					</v-col>
				</v-row>
			</v-container>
		</v-snackbar>

		<!-- Confirmation Dialog -->
		<v-dialog v-model="confirmDialog" max-width="500" persistent transition="fade-transition" class="pa-4">
			<v-card class="pa-4" elevation="2">
				<v-card-title>Confirm Bulk Actions</v-card-title>
				<v-card-text>
					<p class="mb-3">You are about to apply the following changes to {{ selected.length }} users:</p>
					<v-list density="compact">
						<v-list-item v-if="pendingChanges.toggleActive !== null">
							<template #prepend>
								<v-icon :icon="pendingChanges.toggleActive ? 'toggle_on' : 'toggle_off'"
									:color="pendingChanges.toggleActive ? 'success' : 'error'" />
							</template>
							<v-list-item-title>
								{{ pendingChanges.toggleActive ? 'Activate' : 'Deactivate' }} users
							</v-list-item-title>
						</v-list-item>
						<v-list-item v-if="pendingChanges.toggleApproved !== null">
							<template #prepend>
								<v-icon :icon="pendingChanges.toggleApproved ? 'check_circle' : 'cancel'"
									:color="pendingChanges.toggleApproved ? 'primary' : 'warning'" />
							</template>
							<v-list-item-title>
								{{ pendingChanges.toggleApproved ? 'Approve' : 'Unapprove' }} users
							</v-list-item-title>
						</v-list-item>
						<v-list-item v-if="pendingChanges.toggleStaff !== null">
							<template #prepend>
								<v-icon icon="badge" color="warning" />
							</template>
							<v-list-item-title>
								{{ pendingChanges.toggleStaff ? 'Make' : 'Remove' }} commissioners
							</v-list-item-title>
						</v-list-item>
						<v-list-item v-if="pendingChanges.delete">
							<template #prepend>
								<v-icon icon="delete_forever" color="error" />
							</template>
							<v-list-item-title class="text-error">
								Delete users permanently
							</v-list-item-title>
						</v-list-item>
					</v-list>
					<p class="mt-3 text-body-2">Are you sure you want to proceed?</p>
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn @click="confirmDialog = false" variant="text">Cancel</v-btn>
					<v-btn @click="executeBulkActions" color="primary" variant="flat" v-confirm>Confirm</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import moment from 'moment'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isAdmin = computed(() => {
	return authStore.user?.is_superuser && authStore.user?.is_staff
})

// State
const users = ref([])
const selected = ref([])
const loading = ref(true)
const error = ref(null)
const search = ref('')
const itemsPerPage = ref(25)
const page = ref(1)
const settingsMenu = ref(false)
const columnMenu = ref(false)
const filterMenu = ref(false)
const bulkActionMenu = ref(false)
const confirmDialog = ref(false)
const useRelativeDates = ref(true)
const showCheckboxes = ref(true)
const draggedIndex = ref(null)
const showBulkActions = ref(false)
const pendingChanges = ref({
	toggleActive: null,
	toggleApproved: null,
	toggleStaff: null,
	delete: false
})
const filters = ref({
	team: [],
	status: [],
	role: [],
	dateJoinedStart: null,
	dateJoinedEnd: null,
	dateJoinedRange: [0, 365],
	lastLoginStart: null,
	lastLoginEnd: null,
	lastLoginRange: [0, 365]
})

// Column configuration
const allHeaders = ref([
	{
		title: 'User',
		key: 'user',
		value: 'last_name',
		sortable: true,
		width: '300px',
		visible: true,
		locked: true
	},
	{
		title: 'Email',
		key: 'email',
		sortable: true,
		visible: true
	},
	{
		title: 'Team',
		key: 'team_name',
		value: item => item.team?.name || '',
		sortable: true,
		visible: true
	},
	{
		title: 'Status',
		key: 'status',
		sortable: false,
		visible: true
	},
	{
		title: 'Date Joined',
		key: 'date_joined',
		sortable: true,
		visible: true
	},
	{
		title: 'Last Login',
		key: 'last_login',
		sortable: true,
		visible: true
	},
	{
		title: 'Updated At',
		key: 'updated_at',
		sortable: true,
		visible: true
	},
])

const visibleHeaders = computed(() => {
	return allHeaders.value.filter(h => h.visible)
})

const tableHeaders = computed(() => {
	return visibleHeaders.value
})

const statuses = [
	{ title: 'Active', value: 'is_active' },
	{ title: 'Approved', value: 'is_approved' },
	{ title: 'Not Approved', value: 'not_approved' },
	{ title: 'Inactive', value: 'inactive' }
]

const roles = [
	{ title: 'Admin', value: 'is_superuser' },
	{ title: 'Staff', value: 'is_staff' },
	{ title: 'Regular User', value: 'regular' }
]

// Computed values for teams dropdown
const teams = computed(() => {
	const teamSet = new Set()
	users.value.forEach(user => {
		if (user.team?.name) {
			teamSet.add(user.team.name)
		}
	})
	return Array.from(teamSet).sort()
})

// Date range text
const dateJoinedRangeText = computed(() => {
	const [start, end] = filters.value.dateJoinedRange
	return `Between ${start} and ${end} days ago`
})

const lastLoginRangeText = computed(() => {
	const [start, end] = filters.value.lastLoginRange
	return `Between ${start} and ${end} days ago`
})

// Check if there are pending changes
const hasPendingChanges = computed(() => {
	return pendingChanges.value.toggleActive !== null ||
		pendingChanges.value.toggleApproved !== null ||
		pendingChanges.value.toggleStaff !== null ||
		pendingChanges.value.delete
})

// Get selected users
const selectedUsers = computed(() => {
	return users.value.filter(user => selected.value.includes(user.id))
})

// Computed filtered users
const filteredUsers = computed(() => {
	let result = users.value

	// Team filter
	if (filters.value.team.length > 0) {
		result = result.filter(user =>
			user.team && filters.value.team.includes(user.team.name)
		)
	}

	// Status filter
	if (filters.value.status.length > 0) {
		result = result.filter(user => {
			return filters.value.status.some(status => {
				switch (status) {
					case 'is_active': return user.is_active
					case 'is_approved': return user.is_approved
					case 'not_approved': return !user.is_approved
					case 'inactive': return !user.is_active
					default: return false
				}
			})
		})
	}

	// Role filter
	if (filters.value.role.length > 0) {
		result = result.filter(user => {
			return filters.value.role.some(role => {
				switch (role) {
					case 'is_superuser': return user.is_superuser
					case 'is_staff': return user.is_staff
					case 'regular': return !user.is_superuser && !user.is_staff
					default: return false
				}
			})
		})
	}

	// Date filters
	if (useRelativeDates.value) {
		// Date joined range filter
		const [djStart, djEnd] = filters.value.dateJoinedRange
		result = result.filter(user => {
			const daysAgo = moment().diff(moment(user.date_joined), 'days')
			return daysAgo >= djStart && daysAgo <= djEnd
		})

		// Last login range filter
		const [llStart, llEnd] = filters.value.lastLoginRange
		result = result.filter(user => {
			if (!user.last_login) return llEnd === 365 // Include never logged in users if range extends to max
			const daysAgo = moment().diff(moment(user.last_login), 'days')
			return daysAgo >= llStart && daysAgo <= llEnd
		})
	} else {
		// Date joined filters
		if (filters.value.dateJoinedStart) {
			result = result.filter(user =>
				moment(user.date_joined).isSameOrAfter(moment(filters.value.dateJoinedStart))
			)
		}
		if (filters.value.dateJoinedEnd) {
			result = result.filter(user =>
				moment(user.date_joined).isSameOrBefore(moment(filters.value.dateJoinedEnd))
			)
		}

		// Last login filters
		if (filters.value.lastLoginStart) {
			result = result.filter(user =>
				user.last_login && moment(user.last_login).isSameOrAfter(moment(filters.value.lastLoginStart))
			)
		}
		if (filters.value.lastLoginEnd) {
			result = result.filter(user =>
				user.last_login && moment(user.last_login).isSameOrBefore(moment(filters.value.lastLoginEnd))
			)
		}

		// Updated at filters
		if (filters.value.lastLoginStart) {
			result = result.filter(user =>
				user.updated_at && moment(user.updated_at).isSameOrAfter(moment(filters.value.lastLoginStart))
			)
		}
		if (filters.value.lastLoginEnd) {
			result = result.filter(user =>
				user.updated_at && moment(user.updated_at).isSameOrBefore(moment(filters.value.lastLoginEnd))
			)
		}
	}

	return result
})

const hasActiveFilters = computed(() => {
	return filters.value.team.length > 0 ||
		filters.value.status.length > 0 ||
		filters.value.role.length > 0 ||
		filters.value.dateJoinedStart ||
		filters.value.dateJoinedEnd ||
		filters.value.lastLoginStart ||
		filters.value.lastLoginEnd ||
		(useRelativeDates.value && (
			filters.value.dateJoinedRange[0] > 0 ||
			filters.value.dateJoinedRange[1] < 365 ||
			filters.value.lastLoginRange[0] > 0 ||
			filters.value.lastLoginRange[1] < 365
		))
})

const activeFilterCount = computed(() => {
	let count = filters.value.team.length +
		filters.value.status.length +
		filters.value.role.length

	if (filters.value.dateJoinedStart || filters.value.dateJoinedEnd) count++
	if (filters.value.lastLoginStart || filters.value.lastLoginEnd) count++

	if (useRelativeDates.value) {
		if (filters.value.dateJoinedRange[0] > 0 || filters.value.dateJoinedRange[1] < 365) count++
		if (filters.value.lastLoginRange[0] > 0 || filters.value.lastLoginRange[1] < 365) count++
	}

	return count
})

// Pagination computed values
const pageCount = computed(() => {
	if (itemsPerPage.value === -1) return 1
	return Math.ceil(filteredUsers.value.length / itemsPerPage.value)
})

const paginationText = computed(() => {
	const total = filteredUsers.value.length
	if (total === 0) return '0 of 0 entries'
	if (itemsPerPage.value === -1) return `${total} of ${total} entries`

	const start = (page.value - 1) * itemsPerPage.value + 1
	const end = Math.min(page.value * itemsPerPage.value, total)
	return `${start}-${end} of ${total} entries`
})

// Watch for selection changes
watch(selected, (newSelection) => {
	showBulkActions.value = newSelection.length > 0
})

// Methods
const fetchAllUsers = async () => {
	loading.value = true
	error.value = null

	try {
		const response = await api.get('users/?limit=10000/')
		users.value = response.data.results || response.data
	} catch (err) {
		console.error('Error fetching users:', err)
		error.value = 'Failed to load users. Please try again later.'
	} finally {
		loading.value = false
	}
}

const clearFilters = () => {
	filters.value = {
		team: [],
		status: [],
		role: [],
		dateJoinedStart: null,
		dateJoinedEnd: null,
		dateJoinedRange: [0, 365],
		lastLoginStart: null,
		lastLoginEnd: null,
		lastLoginRange: [0, 365]
	}
}

const viewUser = (user) => {
	// Implement navigation to user detail page
	console.log('View user:', user)
	// Example: router.push(`/users/${user.id}`)
}

const formatDate = (dateString) => {
	if (!dateString) return ''

	const date = moment(dateString)

	if (useRelativeDates.value) {
		return date.fromNow()
	}

	return date.format('YYYY-MM-DD HH:mm:ss')
}

const customSearch = (value, query, item) => {
	if (!query) return true

	const searchLower = query.toLowerCase()
	const searchableFields = [
		item.first_name,
		item.last_name,
		item.username,
		item.email,
		item.team?.name
	]

	return searchableFields.some(field =>
		field && field.toLowerCase().includes(searchLower)
	)
}

const startDrag = (index) => {
	draggedIndex.value = index
}

const saveColumnSettings = () => {
	columnMenu.value = false
	// Optionally save to localStorage or API
}

// Toggle actions
const getToggleIcon = (type) => {
	const counts = {
		active: selectedUsers.value.filter(u => u.is_active).length,
		approved: selectedUsers.value.filter(u => u.is_approved).length,
		staff: selectedUsers.value.filter(u => u.is_staff).length
	}

	const total = selectedUsers.value.length

	// If all selected users have the property, show toggle_off icon
	// If none have it, show toggle_on icon
	// If mixed, show indeterminate icon
	if (type === 'active') {
		if (counts.active === total) return 'toggle_off'
		if (counts.active === 0) return 'toggle_on'
		return 'indeterminate_check_box'
	} else if (type === 'approved') {
		if (counts.approved === total) return 'cancel'
		if (counts.approved === 0) return 'check_circle'
		return 'indeterminate_check_box'
	} else if (type === 'staff') {
		if (counts.staff === total) return 'badge'
		if (counts.staff === 0) return 'badge'
		return 'indeterminate_check_box'
	}
}

const getToggleText = (type) => {
	const counts = {
		active: selectedUsers.value.filter(u => u.is_active).length,
		approved: selectedUsers.value.filter(u => u.is_approved).length,
		staff: selectedUsers.value.filter(u => u.is_staff).length
	}

	const total = selectedUsers.value.length

	if (type === 'active') {
		if (counts.active === total) return 'Deactivate All'
		if (counts.active === 0) return 'Activate All'
		return `Toggle Active (${counts.active}/${total} active)`
	} else if (type === 'approved') {
		if (counts.approved === total) return 'Unapprove All'
		if (counts.approved === 0) return 'Approve All'
		return `Toggle Approved (${counts.approved}/${total} approved)`
	} else if (type === 'staff') {
		if (counts.staff === total) return 'Remove Commissioner Status'
		if (counts.staff === 0) return 'Make Commissioners'
		return `Toggle Commissioner (${counts.staff}/${total} staff)`
	}
}

const toggleBulkAction = (action) => {
	if (action === 'delete') {
		pendingChanges.value.delete = !pendingChanges.value.delete
		return
	}

	const counts = {
		active: selectedUsers.value.filter(u => u.is_active).length,
		approved: selectedUsers.value.filter(u => u.is_approved).length,
		staff: selectedUsers.value.filter(u => u.is_staff).length
	}

	const total = selectedUsers.value.length

	if (action === 'toggleActive') {
		// If all are active, deactivate. If none are active, activate. If mixed, activate.
		pendingChanges.value.toggleActive = counts.active < total
	} else if (action === 'toggleApproved') {
		pendingChanges.value.toggleApproved = counts.approved < total
	} else if (action === 'toggleStaff') {
		pendingChanges.value.toggleStaff = counts.staff < total
	}

	bulkActionMenu.value = false
}

const cancelBulkActions = () => {
	selected.value = []
	pendingChanges.value = {
		toggleActive: null,
		toggleApproved: null,
		toggleStaff: null,
		delete: false
	}
}

const executeBulkActions = async () => {
	confirmDialog.value = false

	try {
		if (pendingChanges.value.delete) {
			// Execute deletes
			const deletePromises = selected.value.map(userId =>
				api.delete(`users/${userId}/`)
			)
			await Promise.all(deletePromises)
		} else {
			// Build update object for each user
			const updatePromises = selected.value.map(userId => {
				const user = users.value.find(u => u.id === userId)
				const updates = {}

				if (pendingChanges.value.toggleActive !== null) {
					updates.is_active = pendingChanges.value.toggleActive
				}
				if (pendingChanges.value.toggleApproved !== null) {
					updates.is_approved = pendingChanges.value.toggleApproved
				}
				if (pendingChanges.value.toggleStaff !== null) {
					updates.is_staff = pendingChanges.value.toggleStaff
				}

				// Only send request if there are updates
				if (Object.keys(updates).length > 0) {
					return api.patch(`users/${userId}/`, updates)
				}
				return Promise.resolve()
			})

			await Promise.all(updatePromises)
		}

		// Clear selection and pending changes
		cancelBulkActions()

		// Refresh user data
		await fetchAllUsers()
	} catch (err) {
		console.error('Error executing bulk actions:', err)
		error.value = 'Failed to update users. Please try again.'
	}
}

// Watchers
onMounted(() => {
	fetchAllUsers()
})
</script>

<style scoped lang="scss">
.ga-1 {
	gap: 4px;
}

.ga-2 {
	gap: 8px;
}

.items-per-page-select {
	max-width: 150px;
}

:deep(.v-data-table tbody tr) {
	cursor: pointer;
}

:deep(.v-data-table tbody tr:hover) {
	background-color: rgba(var(--v-theme-on-surface), 0.04);
}

:deep(.v-pagination) {
	.v-pagination__list {
		margin-bottom: 0;
	}
}

/* Prevent v-select expansion when chips are selected */
:deep(.v-select) {
	.v-field__input {
		flex-wrap: nowrap;
		overflow: hidden;
	}

	.v-chip {
		flex-shrink: 0;
	}
}

/* Bulk action snackbar styling */
:deep(.bulk-action-snackbar) {
	.v-snackbar__wrapper {
		max-width: 90vw;
		width: auto;
	}

	.v-snackbar__content {
		padding: 0;
	}
}
</style>