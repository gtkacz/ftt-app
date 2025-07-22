<template>
	<v-container fluid class="pa-0">
		<v-card class="pa-4 bg-surface-variant" elevation="10">
			<!-- Loading state -->
			<v-progress-linear v-if="loading" indeterminate class="mb-4" />

			<!-- Filters and Column Settings -->
			<v-expand-transition>
				<v-container fluid v-if="!loading" class="pa-0">
					<slot name="action-row">
						<v-row class="mb-4" align="center" justify="center">
							<!-- Search bar - 75% width -->
							<slot name="search">
								<v-col cols="9">
									<v-text-field rounded v-model="search" prepend-inner-icon="search"
										label="Search players..." single-line hide-details clearable density="compact"
										variant="outlined" class="search-field"></v-text-field>
								</v-col>
							</slot>

							<!-- Icon buttons - 25% width -->
							<slot name="extra-actions">
								<v-spacer />
								<v-col class="d-flex justify-end gap-2">
									<!-- Sort menu -->
									<!-- <v-menu rounded v-model="sortMenu" :close-on-content-click="false" location="bottom">
										<template #activator="{ props }" v-tooltip="'Sort table'">
											<v-btn v-bind="props" icon variant="outlined" size="small">
												<v-icon icon="sort" />
											</v-btn>
										</template>
										<v-card rounded min-width="300" density="comfortable" class="pa-4">
											<template #title class="text-h6">Sort Options</template>
											<template #append><v-btn variant="text" icon @click="sortMenu = false"
													size="small"><v-icon icon="close" /></v-btn></template>
											<v-divider />
											<v-card-text>
												<v-row>
													<v-col cols="12" class="py-2">
														<v-select rounded v-model="sortBy" :items="sortableHeaders"
															item-title="title" item-value="key" label="Sort by"
															density="compact" variant="outlined"
															prepend-inner-icon="sort_by_alpha"></v-select>
													</v-col>
													<v-col cols="12" class="py-2">
														<v-select rounded v-model="sortOrder" :items="sortOrderOptions"
															label="Sort order" density="compact" variant="outlined"
															prepend-inner-icon="sort"></v-select>
													</v-col>
												</v-row>
											</v-card-text>
											<v-card-actions>
												<v-spacer></v-spacer>
												<v-btn @click="resetSort" icon variant="outlined" size="small"
													v-tooltip="'Reset to default sort'">
													<v-icon icon="refresh" />
												</v-btn>
											</v-card-actions>
										</v-card>
									</v-menu> -->

									<!-- Filter button with menu -->
									<v-menu rounded v-model="filterMenu" :close-on-content-click="false" location="bottom">
										<template #activator="{ props }" v-tooltip="'Filter players'">
											<v-btn v-bind="props" icon variant="outlined" size="small"
												:color="hasActiveFilters ? 'primary' : undefined">
												<v-badge :content="activeFilterCount" :model-value="hasActiveFilters"
													color="error">
													<v-icon icon="filter_alt" />
												</v-badge>
											</v-btn>
										</template>
										<v-card rounded min-width="500" density="comfortable" class="pa-4">
											<template #title class="text-h6">Filters<v-divider class="my-4" /></template>
											<template #text>
												<v-row>
													<v-col cols="12" class="py-2">
														<v-select rounded v-model="filters.team" :items="teams"
															label="Team" clearable density="compact" variant="outlined"
															prepend-inner-icon="diversity_3" multiple chips
															closable-chips></v-select>
													</v-col>
													<v-col cols="12" class="py-2">
														<v-select rounded v-model="filters.realTeam" :items="realTeams"
															label="NBA Roster" clearable density="compact"
															variant="outlined" prepend-inner-icon="sports_basketball"
															multiple chips closable-chips single-line counter>
															<template #item="{ item, props }">
																<v-list-item v-bind="props">
																	<template #prepend
																		v-if="!isSpecialNBAFilter(item.value)">
																		<nba-team-icon :team="item.value" :size="20"
																			class="mr-2" />
																	</template>
																</v-list-item>
															</template>
															<template #chip="{ item }">
																<v-chip closable
																	@click:close="removeNBAFilter(item.value)">
																	<template #prepend
																		v-if="!isSpecialNBAFilter(item.value)">
																		<nba-team-icon :team="item.value" :size="16"
																			class="mr-1" />
																	</template>
																</v-chip>
															</template>
														</v-select>
													</v-col>
													<v-col cols="12" class="py-2">
														<v-select rounded v-model="filters.position" :items="positions"
															label="Position" clearable density="compact"
															variant="outlined" prepend-inner-icon="conditions" multiple
															chips closable-chips></v-select>
													</v-col>
													<v-col cols="12" class="py-2">
														<v-select rounded v-model="filters.status" :items="statuses"
															label="Status" clearable density="compact"
															variant="outlined" prepend-inner-icon="diamond_shine"
															multiple chips closable-chips></v-select>
													</v-col>
												</v-row>
											</template>
											<template #actions>
												<v-spacer></v-spacer>
												<v-btn @click="clearFilters" icon variant="outlined" size="small"
													:disabled="!hasActiveFilters" v-tooltip="'Clear all filters'">
													<v-icon icon="filter_alt_off" />
												</v-btn>
											</template>
										</v-card>
									</v-menu>

									<!-- Manage columns button -->
									<v-menu rounded v-model="columnMenu" max-width="500" transition="fade-transition"
										:close-on-content-click="false" location="bottom">
										<template #activator="{ props }" v-tooltip="'Manage columns'">
											<v-btn v-bind="props" icon variant="outlined" size="small">
												<v-icon icon="view_column" />
											</v-btn>
										</template>
										<v-card rounded min-width="500" density="comfortable" class="pa-4">
											<template #title>Manage Columns<v-divider class="my-4" /></template>
											<template #text>
												<v-list>
													<v-list-item v-for="(header, index) in editableHeaders"
														:key="header.key"
														:prepend-icon="index === 0 ? 'drag_indicator' : 'drag_handle'"
														v-if="!(header?.hidden ?? false)">
														<template #prepend>
															<v-icon v-if="header.key !== 'player'"
																@mousedown="startDrag(index)"
																style="cursor: move;">drag_handle</v-icon>
															<v-icon v-else>lock</v-icon>
														</template>
														<v-list-item-title>{{ header.title }}</v-list-item-title>
														<template #append>
															<v-checkbox v-model="header.visible"
																:disabled="header.key === 'player'" hide-details
																density="compact"></v-checkbox>
														</template>
													</v-list-item>
												</v-list>
											</template>
											<template #actions>
												<v-spacer></v-spacer>
												<v-btn icon variant="outlined" @click="saveColumnSettings"
													color="success" size="small"><v-icon icon="check" /></v-btn>
											</template>
										</v-card>
									</v-menu>

									<!-- Settings -->
									<v-menu rounded v-model="settingsMenu" max-width="500" transition="fade-transition"
										:close-on-content-click="false" location="bottom">
										<template #activator="{ props }" v-tooltip="'Display settings'">
											<v-btn v-bind="props" icon variant="outlined" size="small">
												<v-icon icon="settings" />
											</v-btn>
										</template>
										<v-card rounded min-width="500" density="comfortable" class="pa-4">
											<v-card-title>Display Settings</v-card-title>
											<v-divider />
											<v-card-text>
												<v-list>
													<v-list-item>
														<v-list-item-title>Show players' weight</v-list-item-title>
														<template #append>
															<v-checkbox v-model="showWeight" hide-details
																density="compact" />
														</template>
													</v-list-item>
													<v-list-item>
														<v-list-item-title>Show players' height</v-list-item-title>
														<template #append>
															<v-checkbox v-model="showHeight" hide-details
																density="compact" />
														</template>
													</v-list-item>
													<v-list-item>
														<v-list-item-title>Use metric weight units</v-list-item-title>
														<template #append>
															<v-checkbox v-model="convertWeight" hide-details
																density="compact" />
														</template>
													</v-list-item>
													<v-list-item>
														<v-list-item-title>Use metric height units</v-list-item-title>
														<template #append>
															<v-checkbox v-model="convertHeight" hide-details
																density="compact" />
														</template>
													</v-list-item>
												</v-list>
											</v-card-text>
										</v-card>
									</v-menu>
								</v-col>
							</slot>
						</v-row>
					</slot>
				</v-container>
			</v-expand-transition>

			<!-- Data table -->
			<v-data-table v-if="!loading" :headers="activeHeaders" :items="sortedFilteredPlayers" :search="search"
				:custom-filter="customSearch" fixed-header fixed-footer height="calc(100vh - 200px)" :loading="loading"
				:no-data-text="'No players found'" :no-results-text="'No matching players'" density="comfortable"
				class="elevation-1 pa-4 bg-surface-variant" hide-no-data hover sort-asc-icon="arrow_drop_up"
				sort-desc-icon="arrow_drop_down" :items-per-page="itemsPerPage" :page="page"
				@click:row="(event, { item }) => selectPlayer(item)">

				<!-- Player photo and name -->
				<template #item.player="{ item }">
					<div class="d-flex align-center py-2">
						<v-avatar size="40" class="mr-3">
							<v-img :src="item.photo || '/placeholder-player.png'"
								:alt="`${item.first_name} ${item.last_name}`" cover>
								<template #error>
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
								<span>Unsigned ({{ getSeasonFromYear(item.metadata?.TO_YEAR) }})</span>
							</div>
							<div class="text-caption text-grey d-flex align-center gap-1"
								v-if="(showHeight || showWeight) && (item.metadata?.HEIGHT || item.metadata?.WEIGHT)">
								<span v-if="showHeight && item.metadata?.HEIGHT">{{ parseHeight(item.metadata?.HEIGHT)
								}}</span>
								<span v-if="showWeight && item.metadata?.WEIGHT">{{ parseWeight(item.metadata?.WEIGHT)
								}}</span>
							</div>
						</div>
					</div>
				</template>

				<!-- Position -->
				<template #item.primary_position="{ item }">
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
				<template #item.team.name="{ item }">
					<span v-if="item.team.name">{{ item.team.name }}</span>
					<span v-else class="text-grey-darken-1">Free Agent</span>
				</template>

				<!-- Salary -->
				<template #item.contract.salary="{ item }">
					<span v-if="item.contract.salary" class="font-weight-medium">
						{{ formatCurrency(item.contract.salary) }}
					</span>
					<span v-else class="text-grey">—</span>
				</template>

				<!-- Contract -->
				<template #item.contract?.duration="{ item }">
					<span v-if="item.contract?.duration" class="font-weight-medium">
						{{ item.contract?.duration }}
						<word item="year" :count="item.contract?.duration" />
					</span>
					<span v-else class="text-grey">—</span>
				</template>

				<!-- Status badges -->
				<template #item.status="{ item }">
					<v-chip-group column>
						<v-chip v-if="item.is_rfa" size="x-small" v-tooltip="'Restricted Free Agent'">
							RFA
						</v-chip>
						<v-chip v-if="item.is_to" size="x-small" v-tooltip="'Team Option'">
							TO
						</v-chip>
						<v-chip v-if="item.is_ir" size="x-small" v-tooltip="'Injured Reserve'">
							IR
						</v-chip>
					</v-chip-group>
				</template>

				<!-- Pagination footer -->
				<template #bottom>
					<slot name="pagination-footer">
						<v-divider />
						<v-container fluid class="pa-2 mt-4">
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
					</slot>
				</template>
			</v-data-table>
		</v-card>
	</v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/api/axios'
import NbaTeamIcon from '@/components/core/NBATeamIcon.vue'

// Props
const props = defineProps<{
	headers?: Array<any>
	players?: Array<any>
}>()

// Emits
const emit = defineEmits<{
	(e: 'player-selected', player: any): void
}>()

// State
const players = ref<any[]>(props.players ?? [])
const loading = ref<boolean>(!props.players)
const error = ref<string | null>(null)
const search = ref<string>('')
const itemsPerPage = ref<number>(25)
const page = ref<number>(1)
const settingsMenu = ref<boolean>(false)
const columnMenu = ref<boolean>(false)
const filterMenu = ref<boolean>(false)
const sortMenu = ref<boolean>(false)
const showHeight = ref<boolean>(false)
const showWeight = ref<boolean>(false)
const convertWeight = ref<boolean>(true)
const convertHeight = ref<boolean>(false)
const draggedIndex = ref<number | null>(null)
const sortBy = ref<string>('relevancy')
const sortOrder = ref<'asc' | 'desc'>('desc')
const filters = ref<{ team: any[]; realTeam: any[]; position: any[]; status: any[] }>({ team: [], realTeam: [], position: [], status: [] })

// Default header configuration
const defaultHeaders = ref(props.headers && props.headers.length
	? props.headers
	: [
		{ title: 'Player', key: 'player', value: 'last_name', sortable: true, width: '300px', visible: true, locked: true },
		{ title: 'Position', key: 'primary_position', width: '120px', visible: true, sortable: true },
		{ title: 'Team', key: 'team.name', width: '150px', visible: true, sortable: true },
		{ title: 'Salary', key: 'contract.salary', align: 'end', width: '120px', visible: true, sortable: true },
		{ title: 'Contract Duration', key: 'contract.duration', align: 'end', width: '120px', visible: true, sortable: true },
		{ title: 'Relevancy', key: 'relevancy', align: 'end', width: '120px', visible: false, hidden: true, sortable: true },
		{ title: 'Status', key: 'status', width: '120px', sortable: false },
	])
const allHeaders = ref(defaultHeaders.value)
const editableHeaders = ref([...allHeaders.value])

// Computed headers based on visibility (excludes hidden columns)
const activeHeaders = computed(() => {
	return allHeaders.value.filter(h => h.visible && !h.meta && !h.hidden)
})

// Computed sortable headers (includes hidden columns)
const sortableHeaders = computed(() => {
	return allHeaders.value.filter(h => h.sortable && !h.meta)
})

// Custom search function to include first name
const customSearch = (value: any, search: string, item: any) => {
	// if no search, show everything
	if (!search) return true

	// helper: normalize + strip accents + lowercase
	const normalize = (str: string) =>
		str
			.normalize('NFD')                  // decompose combined letters into letter + accent
			.replace(/[\u0300-\u036f]/g, '')  // remove all accent marks
			.toLowerCase()

	const searchNorm = normalize(search)
	const fullName = `${item.raw.first_name} ${item.raw.last_name}`
	const fullNameNorm = normalize(fullName)

	return fullNameNorm.includes(searchNorm)
}

// Computed filter options
const teams = computed(() => {
	const uniqueTeams = [...new Set(players.value.map(p => p.team?.name).filter(Boolean))]
	const sortedTeams = uniqueTeams.sort()
	const specialOptions = [{ title: 'Free Agent', value: 'FREE_AGENT' }]

	if (sortedTeams.length > 0) {
		return [...specialOptions, ...sortedTeams]
	}
	return specialOptions
})

const realTeams = computed(() => {
	const uniqueRealTeams = [...new Set(players.value
		.map(p => p.real_team?.abbreviation)
		.filter(Boolean))]
	const sortedTeams = uniqueRealTeams.sort().map(team => ({ title: team, value: team }))
	const specialOptions = [
		{ title: 'In the NBA', value: 'IN_NBA' },
		{ title: 'Out of the NBA', value: 'OUT_OF_NBA' }
	]

	if (sortedTeams.length > 0) {
		return [...specialOptions, ...sortedTeams]
	}
	return specialOptions
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
	{ title: 'Injured Reserve', value: 'ir' }
]

// Helper method to check if a filter value is special
const isSpecialNBAFilter = (value) => {
	return value === 'IN_NBA' || value === 'OUT_OF_NBA'
}

// Computed filtered players
const filteredPlayers = computed(() => {
	let result = players.value

	// Apply team filters
	if (filters.value.team.length > 0) {
		result = result.filter(p => {
			if (filters.value.team.includes('FREE_AGENT')) {
				return !p.team.name || filters.value.team.includes(p.team.name)
			}
			return filters.value.team.includes(p.team.name)
		})
	}

	// Apply real team filters (including In/Out of NBA)
	if (filters.value.realTeam.length > 0) {
		result = result.filter(p => {
			return filters.value.realTeam.some(filter => {
				if (filter === 'IN_NBA') return p.real_team
				if (filter === 'OUT_OF_NBA') return !p.real_team
				return p.real_team && filter === p.real_team.abbreviation
			})
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
		result = result.filter(p => {
			return filters.value.status.some(status => {
				switch (status) {
					case 'rfa': return p.contract.is_rfa
					case 'to': return p.contract.is_to
					case 'ir': return p.is_ir
					default: return false
				}
			})
		})
	}

	return result
})

// Computed sorted and filtered players
const sortedFilteredPlayers = computed(() => {
	const result = [...filteredPlayers.value]

	if (sortBy.value) {
		result.sort((a, b) => {
			let aVal = a[sortBy.value]
			let bVal = b[sortBy.value]

			// Handle null/undefined values
			if (aVal == null && bVal == null) return 0
			if (aVal == null) return sortOrder.value === 'asc' ? 1 : -1
			if (bVal == null) return sortOrder.value === 'asc' ? -1 : 1

			// Handle string vs number comparison
			if (typeof aVal === 'string' && typeof bVal === 'string') {
				aVal = aVal.toLowerCase()
				bVal = bVal.toLowerCase()
			}

			if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
			if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
			return 0
		})
	}

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
	return Math.ceil(sortedFilteredPlayers.value.length / itemsPerPage.value)
})

const paginationText = computed(() => {
	const total = sortedFilteredPlayers.value.length
	if (total === 0) return '0 of 0 entries'
	if (itemsPerPage.value === -1) return `${total} of ${total} entries`

	const start = (page.value - 1) * itemsPerPage.value + 1
	const end = Math.min(page.value * itemsPerPage.value, total)
	return `${start}-${end} of ${total} entries`
})

// Methods
const selectPlayer = (player: any) => {
	emit('player-selected', player)
}

const fetchAllPlayers = async () => {
	loading.value = true
	error.value = null

	const response = await api.get('players/?limit=10000')
	let raw_data = structuredClone(response.data.results)

	raw_data.forEach(player => {
		if (player.metadata) {
			try {
				player.metadata = JSON.parse(JSON.stringify(structuredClone(player.metadata)).replaceAll("NaN", "null"))
				if (typeof player.metadata === 'string') {
					player.metadata = JSON.parse(player.metadata)
				}
			} catch (e) {
				console.error('Failed to parse player metadata:', e)
			}
		}
	})
	players.value = raw_data
	loading.value = false
}

const formatCurrency = (amount) => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount * 1000000)
}

const clearFilters = () => {
	filters.value = {
		team: [],
		realTeam: [],
		position: [],
		status: []
	}
}

const resetSort = () => {
	sortBy.value = 'relevancy'
	sortOrder.value = 'desc'
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
	columnMenu.value = false
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

const parseHeight = (height) => {
	if (!height) return '—'
	if (convertHeight.value) {
		const [feet, inches] = height.split('-').map(Number)
		return `${((feet * 12 + inches) * 0.0254).toFixed(2)} m`
	}
	const [feet, inches] = height.split('-').map(Number)
	return `${feet}′ ${inches}″`
}

const parseWeight = (weight) => {
	if (!weight) return '—'
	if (convertWeight.value) {
		return `${Math.round(weight * 0.453592)} kg`
	}
	return `${weight} lbs`
}

const removeNBAFilter = (value) => {
	filters.value.realTeam = filters.value.realTeam.filter(v => v !== value)
}

const getSeasonFromYear = (year) => {
	if (!year) return 'Unknown'
	return `${year}-${String(Number(year) + 1).slice(-2)}`
}

// Watchers
watch(() => props.players, newList => {
	if (newList) {
		players.value = newList
		loading.value = false
	}
})

onMounted(() => {
	if (!props.players) fetchAllPlayers()
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
</style>