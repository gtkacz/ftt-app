<template>
	<v-container fluid class="pa-0">
		<v-card class="players-explorer" variant="flat">
			<!-- Loading state -->
			<v-progress-linear v-if="loading" indeterminate class="mb-4" />

			<!-- Filters and Column Settings -->
			<v-expand-transition>
				<v-container fluid v-if="!loading" class="pa-0">
					<slot name="action-row">
						<v-row class="player-toolbar mb-4" align="center" no-gutters>
							<slot name="search">
								<v-col cols="12" md="9" class="player-toolbar__search">
									<v-text-field v-model="search" prepend-inner-icon="search"
										:label="t('playersTable.toolbar.searchLabel')" single-line hide-details clearable
										variant="outlined" class="search-field" :aria-label="t('playersTable.toolbar.searchAriaLabel')"></v-text-field>
								</v-col>
							</slot>

							<slot name="extra-actions">
								<v-col cols="12" md="3" class="player-toolbar__actions d-flex justify-end ga-2">
									<!-- Filter button with menu -->
									<v-menu rounded v-model="filterMenu" :close-on-content-click="false"
										location="bottom">
									<template #activator="{ props }">
										<v-btn v-bind="props" icon variant="outlined" :aria-label="t('playersTable.filters.ariaLabel')" :title="t('playersTable.filters.ariaLabel')"
											:color="hasActiveFilters ? 'primary' : undefined">
												<v-badge :content="activeFilterCount" :model-value="hasActiveFilters"
													color="error">
													<v-icon icon="filter_alt" />
												</v-badge>
											</v-btn>
										</template>
									<v-card width="500" max-width="calc(100vw - 24px)" density="comfortable"
										class="players-menu-card pa-4">
											<template #title class="text-h6">{{ t('playersTable.filters.title') }}<v-divider
													class="my-4" /></template>
											<template #text>
												<v-row>
													<v-col cols="12" class="py-2">
														<v-select rounded v-model="filters.team" :items="teams"
															:label="t('playersTable.filters.team')" clearable density="compact" variant="outlined"
															prepend-inner-icon="diversity_3" multiple chips
															closable-chips></v-select>
													</v-col>
													<v-col cols="12" class="py-2">
														<v-select rounded v-model="filters.realTeam" :items="realTeams"
															:label="t('playersTable.filters.nbaRoster')" clearable density="compact"
															variant="outlined" prepend-inner-icon="sports_basketball"
															multiple chips closable-chips single-line counter
															color="primary">
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
															:label="t('playersTable.filters.position')" clearable density="compact"
															variant="outlined" prepend-inner-icon="conditions" multiple
															chips closable-chips></v-select>
													</v-col>
													<v-col cols="12" class="py-2">
														<v-select rounded v-model="filters.multiPosition"
															:items="[{ title: t('playersTable.filters.allPlayers'), value: false }, { title: t('playersTable.filters.multiPositionOnly'), value: true }]"
															:label="t('playersTable.filters.positionRequirement')" density="compact"
															variant="outlined" prepend-inner-icon="sports_kabaddi" />
													</v-col>
													<v-col cols="12" class="py-2">
														<v-select rounded v-model="filters.status" :items="statuses"
															:label="t('playersTable.filters.status')" clearable density="compact"
															variant="outlined" prepend-inner-icon="diamond_shine"
															multiple chips closable-chips></v-select>
													</v-col>
													<v-col cols="12" class="py-2">
														<v-text-field rounded readonly variant="outlined"
															density="compact" prepend-inner-icon="payments"
															:label="t('playersTable.filters.salaryRange')"
															:model-value="`$${filters.salaryRange[0]}M - $${filters.salaryRange[1]}M`"
															@click="showSalaryFilter = !showSalaryFilter"
															:append-inner-icon="showSalaryFilter ? 'expand_less' : 'expand_more'"
															style="cursor: pointer;" />
														<v-expand-transition>
															<v-card v-show="showSalaryFilter" variant="outlined"
																class="mt-2 pa-3">
																<div class="d-flex align-center gap-2 mb-2">
																	<v-chip size="x-small" variant="outlined">${{
																		filters.salaryRange[0] }}M</v-chip>
																	<v-spacer></v-spacer>
																	<v-chip size="x-small" variant="outlined">${{
																		filters.salaryRange[1] }}M</v-chip>
																</div>
																<v-range-slider v-model="filters.salaryRange" :min="0"
																	:max="maxSalary" :step="1" color="success"
																	track-color="grey-lighten-3" density="compact" />
															</v-card>
														</v-expand-transition>
													</v-col>
													<v-col cols="12" class="py-2">
														<v-text-field readonly rounded variant="outlined"
															density="compact" prepend-inner-icon="schedule"
															:label="t('playersTable.filters.contractDuration')"
															:model-value="t('playersTable.filters.durationRangeValue', { min: filters.durationRange[0], max: filters.durationRange[1] })"
															@click="showDurationFilter = !showDurationFilter"
															:append-inner-icon="showDurationFilter ? 'expand_less' : 'expand_more'"
															style="cursor: pointer;" />
														<v-expand-transition>
															<v-card v-show="showDurationFilter" variant="outlined"
																class="mt-2 pa-3">
																<div class="d-flex align-center gap-2 mb-2">
																	<v-chip size="x-small" variant="outlined">{{
																		t('playersTable.common.yearsAbbrev', { count: filters.durationRange[0] }, filters.durationRange[0])
																		}}</v-chip>
																	<v-spacer></v-spacer>
																	<v-chip size="x-small" variant="outlined">{{
																		t('playersTable.common.yearsAbbrev', { count: filters.durationRange[1] }, filters.durationRange[1])
																		}}</v-chip>
																</div>
																<v-range-slider v-model="filters.durationRange" :min="0"
																	:max="maxDuration" :step="1" color="primary"
																	track-color="grey-lighten-3" density="compact" />
															</v-card>
														</v-expand-transition>
													</v-col>
												</v-row>
											</template>
											<template #actions>
												<v-spacer></v-spacer>
												<v-btn @click="clearFilters" icon variant="outlined"
											:disabled="!hasActiveFilters" :aria-label="t('playersTable.filters.clearAriaLabel')" :title="t('playersTable.filters.clearAriaLabel')">
													<v-icon icon="filter_alt_off" />
												</v-btn>
											</template>
										</v-card>
									</v-menu>

									<!-- Manage columns button -->
									<v-menu rounded v-model="columnMenu" max-width="500" transition="fade-transition"
										:close-on-content-click="false" location="bottom">
									<template #activator="{ props }">
										<v-btn v-bind="props" icon variant="outlined" :aria-label="t('playersTable.columns.manageAriaLabel')" :title="t('playersTable.columns.manageTitle')">
												<v-icon icon="view_column" />
											</v-btn>
										</template>
									<v-card width="500" max-width="calc(100vw - 24px)" density="comfortable"
										class="players-menu-card pa-4">
											<template #title>{{ t('playersTable.columns.menuTitle') }}<v-divider class="my-4" /></template>
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
													color="success" :aria-label="t('playersTable.columns.saveAriaLabel')"><v-icon icon="check" /></v-btn>
											</template>
										</v-card>
									</v-menu>

									<!-- Settings -->
									<v-menu rounded v-model="settingsMenu" max-width="500" transition="fade-transition"
										:close-on-content-click="false" location="bottom">
									<template #activator="{ props }">
										<v-btn v-bind="props" icon variant="outlined" :aria-label="t('playersTable.settings.ariaLabel')" :title="t('playersTable.settings.buttonTitle')">
												<v-icon icon="settings" />
											</v-btn>
										</template>
									<v-card width="500" max-width="calc(100vw - 24px)" density="comfortable"
										class="players-menu-card pa-4">
											<v-card-title>{{ t('playersTable.settings.cardTitle') }}</v-card-title>
											<v-divider />
											<v-card-text>
												<v-list>
													<v-list-item>
														<v-list-item-title>{{ t('playersTable.settings.showWeight') }}</v-list-item-title>
														<template #append>
															<v-checkbox v-model="showWeight" hide-details
																density="compact" />
														</template>
													</v-list-item>
													<v-list-item>
														<v-list-item-title>{{ t('playersTable.settings.showHeight') }}</v-list-item-title>
														<template #append>
															<v-checkbox v-model="showHeight" hide-details
																density="compact" />
														</template>
													</v-list-item>
													<v-list-item>
														<v-list-item-title>{{ t('playersTable.settings.metricWeight') }}</v-list-item-title>
														<template #append>
															<v-checkbox v-model="convertWeight" hide-details
																density="compact" />
														</template>
													</v-list-item>
													<v-list-item>
														<v-list-item-title>{{ t('playersTable.settings.metricHeight') }}</v-list-item-title>
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
			<v-data-table v-if="!loading" :headers="responsiveHeaders" :items="sortedFilteredPlayers" :search="search"
				:custom-filter="customSearch" :fixed-header="!smAndDown" :fixed-footer="!smAndDown"
				:height="smAndDown ? undefined : 'calc(100dvh - 260px)'" :loading="loading"
				:no-data-text="t('playersTable.emptyState.noData')" :no-results-text="t('playersTable.emptyState.noResults')" density="comfortable"
				class="players-table" hover sort-asc-icon="arrow_drop_up"
				sort-desc-icon="arrow_drop_down" :items-per-page="itemsPerPage" :page="page"
				:row-props="playerRowProps"
				@click:row="(event, { item }) => selectPlayer(item)">

				<!-- Player photo and name -->
				<template #item.player="{ item }">
					<div class="d-flex align-center py-2">
						<v-avatar size="40" class="mr-3">
							<v-img :src="item.photo || '/placeholder-player.png'"
								:alt="`${item.first_name} ${item.last_name}`" cover>
								<template #error>
									<v-icon size="40">account_circle</v-icon>
								</template>
							</v-img>
						</v-avatar>
						<div>
							<div class="font-weight-medium">
								{{ item.last_name }}, {{ item.first_name }}
							</div>
							<div v-if="item.real_team" class="text-caption text-grey d-flex align-center ga-1">
								<nba-team-icon :team="item.real_team.abbreviation" :size="16" />
								{{ item.real_team.abbreviation }}
							</div>
							<div v-else class="text-caption text-grey-darken-1 d-flex align-center ga-1">
								<nba-team-icon team="NBA" :size="12" />
								<span>{{ t('playersTable.playerRow.unsigned', { season: getSeasonFromYear(item.metadata?.TO_YEAR) }) }}</span>
							</div>
							<div class="text-caption text-grey d-flex align-center ga-1"
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
					<div class="d-flex align-center gap-1" v-if="item.primary_position" column>
					<v-chip variant="tonal" :color="getPositionColor(item.primary_position)"
							:title="getPositionTooltip(item.primary_position)">
							{{ item.primary_position }}
						</v-chip>
						<v-chip v-if="item.secondary_position" variant="tonal"
							:color="getPositionColor(item.secondary_position)"
							:title="getPositionTooltip(item.secondary_position)">
							{{ item.secondary_position }}
						</v-chip>
						<span v-if="!item.primary_position && !item.secondary_position" class="text-grey">—</span>
					</div>
				</template>

				<!-- Team -->
				<template #item.team.name="{ item }">
					<span v-if="item.team.name">{{ item.team.name }}</span>
					<span v-else class="text-grey-darken-1">{{ t('playersTable.common.freeAgent') }}</span>
				</template>

				<!-- Contract Info -->
				<template #item.contract_info="{ item }">
					<span v-if="item.contract?.salary || item.contract?.duration" class="font-weight-medium">
						<span v-if="item.contract?.salary">{{ formatCurrency(item.contract.salary) }}</span>
						<span v-if="item.contract?.salary && item.contract?.duration">/</span>
						<span v-if="item.contract?.duration">{{ t('playersTable.common.yearsAbbrev', { count: item.contract.duration }, item.contract.duration) }}</span>
					</span>
					<span v-else class="text-grey">—</span>
				</template>

				<!-- Status badges -->
				<template #item.status="{ item }">
					<div class="d-flex flex-wrap gap-1">
						<v-chip v-if="item.contract?.is_rfa" size="x-small" :title="t('playersTable.statuses.restrictedFreeAgent')" color="warning">
							{{ t('playersTable.statuses.restrictedFreeAgent') }}
						</v-chip>
						<v-chip v-if="item.contract?.is_to" size="x-small" :title="t('playersTable.statuses.teamOption')" color="info">
							{{ t('playersTable.statuses.teamOption') }}
						</v-chip>
						<v-chip v-if="item.is_ir" size="x-small" :title="t('playersTable.statuses.injuredReserve')" color="danger">
							{{ t('playersTable.statuses.injuredReserve') }}
						</v-chip>
					</div>
				</template>

				<!-- Pagination footer -->
				<template #bottom>
					<slot name="pagination-footer">
						<v-divider />
						<div class="pagination-bar">
							<span class="pagination-bar__summary">{{ t('playersTable.pagination.showing', { range: paginationText }) }}</span>
							<div class="pagination-bar__controls">
								<label class="items-per-page-select">
									<span class="visually-hidden">{{ t('playersTable.pagination.itemsPerPage') }}</span>
									<select v-model.number="itemsPerPage" :aria-label="t('playersTable.pagination.itemsPerPage')">
										<option :value="10">10</option>
										<option :value="25">25</option>
										<option :value="50">50</option>
										<option :value="100">100</option>
										<option :value="-1">{{ t('playersTable.pagination.allOption') }}</option>
									</select>
								</label>
								<v-btn variant="text" @click="page = 1" :disabled="page === 1" icon density="compact"
									class="pagination-edge-button" :aria-label="t('playersTable.pagination.firstPage')">
									<v-icon icon="first_page" />
								</v-btn>
								<v-pagination v-if="pageCount > 1" v-model="page" :length="pageCount"
									:total-visible="smAndDown ? 3 : 5" density="compact" rounded />
								<v-btn variant="text" @click="page = pageCount" :disabled="page === pageCount" icon
									density="compact" class="pagination-edge-button" :aria-label="t('playersTable.pagination.lastPage')">
									<v-icon icon="last_page" />
								</v-btn>
							</div>
						</div>
					</slot>
				</template>
			</v-data-table>
		</v-card>
	</v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'
import api from '@/api/axios'
import NbaTeamIcon from '@/components/core/NBATeamIcon.vue'

const { smAndDown } = useDisplay()
const { t } = useI18n()

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
const itemsPerPage = ref<number>(smAndDown.value ? 10 : 25)
const page = ref<number>(1)
const settingsMenu = ref<boolean>(false)
const columnMenu = ref<boolean>(false)
const filterMenu = ref<boolean>(false)
const showHeight = ref<boolean>(false)
const showWeight = ref<boolean>(false)
const showSalaryFilter = ref<boolean>(false)
const showDurationFilter = ref<boolean>(false)
const convertWeight = ref<boolean>(true)
const convertHeight = ref<boolean>(false)
const draggedIndex = ref<number | null>(null)
const sortBy = ref<string>('relevancy')
const sortOrder = ref<'asc' | 'desc'>('desc')
const filters = ref<{
	team: any[];
	realTeam: any[];
	position: any[];
	status: any[];
	multiPosition: boolean;
	salaryRange: [number, number];
	durationRange: [number, number];
}>({
	team: [],
	realTeam: [],
	position: [],
	status: [],
	multiPosition: false,
	salaryRange: [0, 100],
	durationRange: [0, 10]
})

// Default header configuration
const defaultHeaders = ref(props.headers && props.headers.length
	? props.headers
	: [
		{ title: t('playersTable.headers.player'), key: 'player', value: 'last_name', sortable: true, width: '50px', visible: true, locked: true },
		{ title: t('playersTable.headers.team'), key: 'team.name', width: '75px', visible: true, sortable: true },
		{ title: 'FP/G', key: 'relevancy', width: '60px', visible: true, sortable: true },
		{ title: t('playersTable.headers.position'), key: 'primary_position', width: '60px', visible: true, sortable: true },
		{ title: t('playersTable.headers.contract'), key: 'contract_info', width: '75px', visible: true, sortable: true },
		{ title: t('playersTable.headers.status'), key: 'status', width: '30px', visible: true, sortable: false },
	])
const allHeaders = ref(defaultHeaders.value)
const editableHeaders = ref([...allHeaders.value])

// Computed headers based on visibility (excludes hidden columns)
const activeHeaders = computed(() => {
	return allHeaders.value.filter(h => h.visible && !h.meta && !h.hidden)
})

const compactHeaderKeys = new Set(['player', 'relevancy', 'primary_position', 'contract_info'])
const responsiveHeaders = computed(() => {
	if (!smAndDown.value) return activeHeaders.value
	return activeHeaders.value.filter(header => compactHeaderKeys.has(header.key))
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
	const specialOptions = [{ title: t('playersTable.common.freeAgent'), value: 'FREE_AGENT' }]

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
		{ title: t('playersTable.filters.inNba'), value: 'IN_NBA' },
		{ title: t('playersTable.filters.outOfNba'), value: 'OUT_OF_NBA' }
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
	{ title: t('playersTable.statuses.restrictedFreeAgent'), value: 'rfa' },
	{ title: t('playersTable.statuses.teamOption'), value: 'to' },
	{ title: t('playersTable.statuses.injuredReserve'), value: 'ir' }
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

	// Apply multi-position filter
	if (filters.value.multiPosition) {
		result = result.filter(p => p.secondary_position)
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

	// Apply salary range filter
	if (filters.value.salaryRange[0] > 0 || filters.value.salaryRange[1] < maxSalary.value) {
		result = result.filter(p => {
			const salary = p.contract?.salary || 0
			return salary >= filters.value.salaryRange[0] && salary <= filters.value.salaryRange[1]
		})
	}

	// Apply duration range filter  
	if (filters.value.durationRange[0] > 0 || filters.value.durationRange[1] < maxDuration.value) {
		result = result.filter(p => {
			const duration = p.contract?.duration || 0
			return duration >= filters.value.durationRange[0] && duration <= filters.value.durationRange[1]
		})
	}

	return result
})

// Computed sorted and filtered players
const sortedFilteredPlayers = computed(() => {
	const result = [...filteredPlayers.value]

	if (sortBy.value) {
		result.sort((a, b) => {
			let aVal, bVal

			// Special handling for contract_info sorting
			if (sortBy.value === 'contract_info') {
				aVal = (a.contract?.duration || 0) * (a.contract?.salary || 0)
				bVal = (b.contract?.duration || 0) * (b.contract?.salary || 0)
			} else {
				aVal = a[sortBy.value]
				bVal = b[sortBy.value]
			}

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
		filters.value.status.length > 0 ||
		filters.value.multiPosition ||  // Add this line
		filters.value.salaryRange[0] > 0 ||
		filters.value.salaryRange[1] < maxSalary.value ||
		filters.value.durationRange[0] > 0 ||
		filters.value.durationRange[1] < maxDuration.value
})

const activeFilterCount = computed(() => {
	let count = filters.value.team.length +
		filters.value.realTeam.length +
		filters.value.position.length +
		filters.value.status.length +
		(filters.value.multiPosition ? 1 : 0)  // Add this line

	if (filters.value.salaryRange[0] > 0 || filters.value.salaryRange[1] < maxSalary.value) count++
	if (filters.value.durationRange[0] > 0 || filters.value.durationRange[1] < maxDuration.value) count++

	return count
})

// Pagination computed values
const pageCount = computed(() => {
	if (itemsPerPage.value === -1) return 1
	return Math.ceil(sortedFilteredPlayers.value.length / itemsPerPage.value)
})

const paginationText = computed(() => {
	const total = sortedFilteredPlayers.value.length
	if (total === 0) return t('playersTable.pagination.emptyRange')
	if (itemsPerPage.value === -1) return t('playersTable.pagination.allRange', { total })

	const start = (page.value - 1) * itemsPerPage.value + 1
	const end = Math.min(page.value * itemsPerPage.value, total)
	return t('playersTable.pagination.range', { start, end, total })
})

const maxSalary = computed(() => {
	const salaries = players.value
		.map(p => p.contract?.salary)
		.filter(Boolean)
	return salaries.length > 0 ? Math.max(...salaries) : 100
})

const maxDuration = computed(() => {
	const durations = players.value
		.map(p => p.contract?.duration)
		.filter(Boolean)
	return durations.length > 0 ? Math.max(...durations) : 10
})

// Methods
const selectPlayer = (player: any) => {
	emit('player-selected', player)
}

const playerRowProps = ({ item }: { item: any }) => {
	const player = item.raw ?? item
	return {
		tabindex: 0,
		role: 'button',
		'aria-label': t('playersTable.playerRow.openAriaLabel', { firstName: player.first_name, lastName: player.last_name }),
		onKeydown: (event: KeyboardEvent) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault()
				selectPlayer(player)
			}
		},
	}
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
		status: [],
		multiPosition: false,  // Add this line
		salaryRange: [0, maxSalary.value],
		durationRange: [0, maxDuration.value]
	}
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
		C: t('playersTable.positions.center'),
		G: t('playersTable.positions.guard'),
		F: t('playersTable.positions.forward'),
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
	if (!year) return t('playersTable.playerRow.unknownSeason')
	return `${year}-${String(Number(year) + 1).slice(-2)}`
}

const getPositionColor = (position: string): string => {
	switch (position) {
		case 'G': return 'info'
		case 'F': return 'success'
		case 'C': return 'danger'
		default: return 'grey'
	}
}

// Watchers
watch(() => props.players, newList => {
	if (newList) {
		players.value = newList
		loading.value = false
	}
})

watch(search, () => {
	page.value = 1
})

onMounted(() => {
	if (!props.players) fetchAllPlayers()
	editableHeaders.value = JSON.parse(JSON.stringify(allHeaders.value))
})
</script>

<style scoped lang="scss">
.players-explorer {
	overflow: hidden;
	padding: clamp(12px, 2vw, 20px);
	background: rgb(var(--v-theme-surface));
}

.player-toolbar {
	row-gap: 12px;
}

.player-toolbar__search,
.player-toolbar__actions {
	padding: 0 !important;
}

@media (min-width: $breakpoint-md) {
	.player-toolbar__search {
		padding-right: 6px !important;
	}

	.player-toolbar__actions {
		padding-left: 6px !important;
	}
}

.player-toolbar__actions {
	min-width: 0;
}

.players-menu-card {
	max-height: min(78dvh, 680px);
	overflow-y: auto;
}

.ga-1 {
	gap: 4px;
}

.ga-2 {
	gap: 8px;
}

.items-per-page-select {
	display: inline-flex;
	width: 92px;
	min-width: 92px;

	select {
		width: 100%;
		min-height: 44px;
		padding: 0 30px 0 12px;
		border: 1px solid var(--surface-border-strong);
		border-radius: 10px;
		color: rgb(var(--v-theme-on-surface));
		background: rgb(var(--v-theme-surface));
		font: inherit;
		font-size: 0.86rem;
		cursor: pointer;
	}
}

.players-table {
	border: 1px solid var(--surface-border);
	border-radius: $border-radius-md;
	background: transparent;
}

:deep(.v-data-table tbody tr) {
	cursor: pointer;
}

:deep(.v-data-table tbody tr:focus-visible) {
	outline: 2px solid rgb(var(--v-theme-secondary));
	outline-offset: -2px;
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

.pagination-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 14px 4px 2px;
}

.pagination-bar__summary {
	color: rgb(var(--v-theme-on-surface-variant));
	font-size: 0.76rem;
}

.pagination-bar__controls {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 4px;
	min-width: 0;
}

.pagination-bar__controls :deep(.v-btn--icon) {
	width: 44px;
	height: 44px;
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

@media (max-width: #{$breakpoint-md - 1px}) {
	.player-toolbar__actions {
		justify-content: flex-start !important;
	}

	.players-explorer {
		padding: 12px;
	}

	:deep(.players-table .v-table__wrapper) {
		overflow-x: auto;
	}

	:deep(.players-table th),
	:deep(.players-table td) {
		padding-right: 10px !important;
		padding-left: 10px !important;
	}

	.pagination-bar {
		align-items: flex-start;
		flex-direction: column;
	}

	.pagination-bar__controls {
		justify-content: space-between;
		width: 100%;
	}
}

@media (max-width: 420px) {
	.pagination-edge-button {
		display: none;
	}

	:deep(.v-pagination__item:not(.v-pagination__item--is-active)) {
		display: none;
	}
}
</style>
