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
							<v-text-field rounded v-model="search" prepend-inner-icon="search" label="Search players..."
								single-line hide-details clearable density="compact" variant="outlined"
								class="search-field"></v-text-field>
						</v-col>

						<!-- Icon buttons - 25% width -->
						<v-col cols="3" class="d-flex justify-end gap-2">
							<!-- Filter button with menu -->
							<v-menu v-model="filterMenu" :close-on-content-click="false" location="bottom">
								<template v-slot:activator="{ props }" v-tooltip="'Filter players'">
									<v-btn v-bind="props" icon variant="outlined" size="small"
										:color="hasActiveFilters ? 'primary' : undefined">
										<v-badge :content="activeFilterCount" :model-value="hasActiveFilters"
											color="error">
											<v-icon icon="filter_list" />
										</v-badge>
									</v-btn>
								</template>
								<v-card min-width="500" density="comfortable" class="pa-4">
									<template v-slot:title class="text-h6">Filters</template>
									<template v-slot:append><v-btn variant="text" icon @click="filterMenu = false"
											size="small"><v-icon icon="close" /></v-btn></template>
									<v-divider />
									<v-card-text>
										<v-row>
											<v-col cols="12">
												<v-select rounded v-model="filters.team" :items="teams" label="Team"
													clearable density="compact" variant="outlined"
													prepend-inner-icon="recent_actors" multiple chips
													closable-chips></v-select>
											</v-col>
											<v-col cols="12">
												<v-select rounded v-model="filters.realTeam" :items="realTeams"
													label="NBA Team" clearable density="compact" variant="outlined"
													prepend-inner-icon="sports_basketball" multiple chips
													closable-chips></v-select>
											</v-col>
											<v-col cols="12">
												<v-select rounded v-model="filters.position" :items="positions"
													label="Position" clearable density="compact" variant="outlined"
													prepend-inner-icon="sports_basketball" multiple chips
													closable-chips></v-select>
											</v-col>
											<v-col cols="12">
												<v-select rounded v-model="filters.status" :items="statuses"
													label="Status" clearable density="compact" variant="outlined"
													prepend-inner-icon="info" multiple chips closable-chips></v-select>
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
							<v-menu v-model="columnDialog" max-width="500" transition="fade-transition"
								:close-on-content-click="false" location="bottom">
								<template v-slot:activator="{ props }" v-tooltip="'Filter players'">
									<v-btn v-bind="props" icon variant="outlined" size="small"
										:color="hasActiveFilters ? 'primary' : undefined">
										<v-icon icon="view_column" />
									</v-btn>
								</template>
								<v-card min-width="500" density="comfortable" class="pa-4">
									<v-card-title>Manage Columns</v-card-title>
									<v-divider />
									<v-card-text>
										<v-list>
											<v-list-item v-for="(header, index) in editableHeaders" :key="header.key"
												:prepend-icon="index === 0 ? 'drag_indicator' : 'drag_handle'">
												<template v-slot:prepend>
													<v-icon v-if="header.key !== 'player'" @mousedown="startDrag(index)"
														style="cursor: move;">drag_handle</v-icon>
													<v-icon v-else>lock</v-icon>
												</template>
												<v-list-item-title>{{ header.title }}</v-list-item-title>
												<template v-slot:append>
													<v-checkbox v-model="header.visible"
														:disabled="header.key === 'player'" hide-details
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
						</v-col>
					</v-row>
				</v-card-text>
			</v-expand-transition>

			<!-- Data table -->
			<v-data-table v-if="!loading" :headers="activeHeaders" :items="filteredPlayers" :search="search"
				:custom-filter="customSearch" :sort-by="[{ key: 'last_name', order: 'asc' }]" fixed-header fixed-footer
				height="calc(100vh - 200px)" :loading="loading" :no-data-text="'No players found'"
				:no-results-text="'No matching players'" density="comfortable"
				class="elevation-1 pa-4 bg-surface-variant" hide-no-data hover sort-asc-icon="arrow_drop_up"
				sort-desc-icon="arrow_drop_down" :items-per-page="itemsPerPage" :page="page"
				@click:row="(event, { item }) => viewPlayer(item)">

				<!-- Player photo and name -->
				<template v-slot:item.player="{ item }">
					<div class="d-flex align-center py-2">
						<v-avatar size="40" class="mr-3">
							<v-img :src="item.photo || '/placeholder-player.png'"
								:alt="`${item.first_name} ${item.last_name}`" cover>
								<template v-slot:error>
									<v-icon size="40">account</v-icon>
								</template>
							</v-img>
						</v-avatar>
						<div>
							<div class="font-weight-medium">
								{{ item.last_name }}, {{ item.first_name }}
							</div>
							<div v-if="item.real_team" class="text-caption text-grey d-flex align-center gap-1">
								<nba-team-icon :team="item.real_team.abbreviation" :size="16" />
								{{ item.real_team.abbreviation }}
							</div>
							<div v-else class="text-caption text-grey-darken-1 d-flex align-center gap-1">
								<nba-team-icon team="NBA" :size="12" />
								Unsigned
							</div>
						</div>
					</div>
				</template>

				<!-- Position -->
				<template v-slot:item.primary_position="{ item }">
					<v-chip-group v-if="item.primary_position" column>
						<v-chip v-tooltip="getPositionTooltip(item.primary_position)">
							{{ item.primary_position }}
						</v-chip>
						<v-chip v-if="item.secondary_position" v-tooltip="getPositionTooltip(item.secondary_position)">
							{{ item.secondary_position }}
						</v-chip>
						<span v-if="!item.primary_position && !item.secondary_position" class="text-grey">—</span>
					</v-chip-group>
				</template>

				<!-- Team -->
				<template v-slot:item.team="{ item }">
					<span v-if="item.team">{{ item.team }}</span>
					<span v-else class="text-grey-darken-1">Free Agent</span>
				</template>

				<!-- Salary -->
				<template v-slot:item.salary="{ item }">
					<span v-if="item.salary" class="font-weight-medium">
						{{ formatCurrency(item.salary) }}
					</span>
					<span v-else class="text-grey">—</span>
				</template>

				<!-- Status badges -->
				<template v-slot:item.status="{ item }">
					<div class="d-flex gap-1">
						<v-chip v-if="item.is_rfa" size="x-small" variant="tonal">
							RFA
						</v-chip>
						<v-chip v-if="item.is_to" size="x-small" variant="tonal">
							TO
						</v-chip>
						<v-chip v-if="item.is_ir" size="x-small" variant="tonal">
							IR
						</v-chip>
					</div>
				</template>

				<!-- Pagination footer -->
				<template v-slot:bottom>
					<v-divider />
					<v-container class="pa-2 mt-4">
						<v-row justify="space-between" align="center">
							<v-col cols="3">
								<span class="text-caption">
									Showing {{ paginationText }}
								</span>
							</v-col>
							<v-col cols="6" class="d-flex gap-2">
								<v-row class="gap-2" align="center" justify="end">
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
			<v-alert v-if="error" type="error" variant="tonal" class="mt-4">
				{{ error }}
			</v-alert>
		</v-card>
	</v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import NbaTeamIcon from '@/components/core/NBATeamIcon.vue'

// State
const players = ref([])
const loading = ref(true)
const error = ref(null)
const search = ref('')
const itemsPerPage = ref(25)
const page = ref(1)
const columnDialog = ref(false)
const filterMenu = ref(false)
const draggedIndex = ref(null)
const filters = ref({
	team: [],
	realTeam: [],
	position: [],
	status: []
})

// Column configuration
const allHeaders = ref([
	{
		title: 'Player',
		key: 'player',
		value: 'last_name',
		sortable: true,
		width: '300px',
		visible: true,
		locked: true
	},
	{
		title: 'Position',
		key: 'primary_position',
		// align: 'center',
		width: '120px',
		visible: true
	},
	{
		title: 'Team',
		key: 'team',
		width: '150px',
		visible: true
	},
	{
		title: 'Salary',
		key: 'salary',
		align: 'end',
		width: '120px',
		visible: true
	},
])

const editableHeaders = ref([])

// Computed headers based on visibility
const activeHeaders = computed(() => {
	return allHeaders.value.filter(h => h.visible)
})

// Custom search function to include first name
const customSearch = (value: any, search: string, item: any) => {
	if (!search) return true
	const searchLower = search.toLowerCase()
	const fullName = `${item.raw.first_name} ${item.raw.last_name}`.toLowerCase()
	return fullName.includes(searchLower)
}

// Computed filter options
const teams = computed(() => {
	const uniqueTeams = [...new Set(players.value.map(p => p.team).filter(Boolean))]
	const sortedTeams = uniqueTeams.sort()
	return [{ title: 'Free Agent', value: 'FREE_AGENT' }, ...sortedTeams]
})

const realTeams = computed(() => {
	const uniqueRealTeams = [...new Set(players.value
		.map(p => p.real_team?.abbreviation)
		.filter(Boolean))]
	return uniqueRealTeams.sort()
})

const positions = computed(() => {
	const allPositions = new Set()
	players.value.forEach(p => {
		if (p.primary_position) allPositions.add(p.primary_position)
		if (p.secondary_position) allPositions.add(p.secondary_position)
	})
	return [...allPositions].sort()
})

const statuses = [
	{ title: 'Restricted Free Agent', value: 'rfa' },
	{ title: 'Team Option', value: 'to' },
	{ title: 'Injured Reserve', value: 'ir' },
	{ title: 'In the NBA', value: 'in_nba' },
	{ title: 'Out of the NBA', value: 'out_of_nba' }
]

// Computed filtered players
const filteredPlayers = computed(() => {
	loading.value = true
	let result = players.value

	// Apply team filters
	if (filters.value.team.length > 0) {
		result = result.filter(p => {
			if (filters.value.team.includes('FREE_AGENT')) {
				return !p.team || filters.value.team.includes(p.team)
			}
			return filters.value.team.includes(p.team)
		})
	}

	// Apply real team filters
	if (filters.value.realTeam.length > 0) {
		result = result.filter(p => {
			return p.real_team && filters.value.realTeam.includes(p.real_team.abbreviation)
		})
	}

	// Apply position filters
	if (filters.value.position.length > 0) {
		result = result.filter(p => {
			return filters.value.position.includes(p.primary_position) ||
				filters.value.position.includes(p.secondary_position)
		})
	}

	// Apply status filters
	if (filters.value.status.length > 0) {
		if (filters.value.status.includes('in_nba') && filters.value.status.includes('out_of_nba')) {
			filters.value.status = filters.value.status.filter(s => s !== 'out_of_nba')
		}

		result = result.filter(p => {
			return filters.value.status.some(status => {
				switch (status) {
					case 'rfa': return p.is_rfa
					case 'to': return p.is_to
					case 'ir': return p.is_ir
					case 'in_nba': return p.real_team
					case 'out_of_nba': return !p.real_team
					default: return false
				}
			})
		})
	}

	loading.value = false
	return result
})

const hasActiveFilters = computed(() => {
	return filters.value.team.length > 0 ||
		filters.value.realTeam.length > 0 ||
		filters.value.position.length > 0 ||
		filters.value.status.length > 0
})

const activeFilterCount = computed(() => {
	return filters.value.team.length +
		filters.value.realTeam.length +
		filters.value.position.length +
		filters.value.status.length
})

// Pagination computed values
const pageCount = computed(() => {
	if (itemsPerPage.value === -1) return 1
	return Math.ceil(filteredPlayers.value.length / itemsPerPage.value)
})

const paginationText = computed(() => {
	const total = filteredPlayers.value.length
	if (total === 0) return '0 of 0 entries'
	if (itemsPerPage.value === -1) return `${total} of ${total} entries`

	const start = (page.value - 1) * itemsPerPage.value + 1
	const end = Math.min(page.value * itemsPerPage.value, total)
	return `${start}-${end} of ${total} entries`
})

// Methods
const fetchAllPlayers = async () => {
	loading.value = true
	error.value = null

	try {
		const response = await api.get('players/?limit=10000')
		players.value = response.data.results
	} catch (err) {
		console.error('Error fetching players:', err)
		error.value = 'Failed to load players. Please try again later.'
	} finally {
		loading.value = false
	}
}

const formatCurrency = (amount) => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount)
}

const clearFilters = () => {
	filters.value = {
		team: [],
		realTeam: [],
		position: [],
		status: []
	}
}

const viewPlayer = (player) => {
	// Implement navigation to player detail page
	console.log('View player:', player)
	// Example: router.push(`/players/${player.id}`)
}

// Column management
const startDrag = (index: number) => {
	if (editableHeaders.value[index].key === 'player') return
	draggedIndex.value = index

	const onMouseMove = (e: MouseEvent) => {
		e.preventDefault()
	}

	const onMouseUp = (e: MouseEvent) => {
		const elements = document.querySelectorAll('.v-list-item')
		let targetIndex = null

		elements.forEach((el, idx) => {
			const rect = el.getBoundingClientRect()
			if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
				targetIndex = idx
			}
		})

		if (targetIndex !== null && targetIndex !== draggedIndex.value && targetIndex > 0) {
			const [removed] = editableHeaders.value.splice(draggedIndex.value, 1)
			editableHeaders.value.splice(targetIndex, 0, removed)
		}

		document.removeEventListener('mousemove', onMouseMove)
		document.removeEventListener('mouseup', onMouseUp)
		draggedIndex.value = null
	}

	document.addEventListener('mousemove', onMouseMove)
	document.addEventListener('mouseup', onMouseUp)
}

const saveColumnSettings = () => {
	allHeaders.value = [...editableHeaders.value]
	columnDialog.value = false
	page.value = 1
}

const getPositionTooltip = (position) => {
	const tooltips = {
		C: 'Center',
		G: 'Guard',
		F: 'Forward',
	}
	return tooltips[position] || position
}

// Watchers
onMounted(() => {
	fetchAllPlayers()
	editableHeaders.value = JSON.parse(JSON.stringify(allHeaders.value))
})
</script>

<style scoped lang="scss">
.gap-1 {
	gap: 4px;
}

.gap-2 {
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

.position-display {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 4px;
}

:deep(.v-pagination) {
	.v-pagination__list {
		margin-bottom: 0;
	}
}
</style>