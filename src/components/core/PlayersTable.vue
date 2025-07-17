<template>
	<v-container fluid>
		<v-card class="pa-4 player-table">
			<!-- Header with search -->
			<v-card-title class="d-flex align-center pb-4">
				<v-icon start icon="group" />
				<span class="text-h5 font-weight-medium">Player Directory</span>
				<v-spacer></v-spacer>
				<v-text-field rounded v-model="search" prepend-inner-icon="search" label="Search players..." single-line
					hide-details clearable density="compact" variant="outlined" class="search-field"
					style="max-width: 400px"></v-text-field>
			</v-card-title>

			<!-- Loading state -->
			<v-progress-linear v-if="loading" indeterminate class="mb-4"></v-progress-linear>

			<!-- Filters -->
			<v-expand-transition>
				<v-card-text v-if="!loading" class="pa-0">
					<v-row class="mb-4">
						<v-col cols="12" sm="6" md="3">
							<v-select rounded v-model="filters.team" :items="teams" label="Team" clearable
								density="compact" variant="outlined" prepend-inner-icon="recent_actors" multiple chips
								closable-chips></v-select>
						</v-col>
						<v-col cols="12" sm="6" md="3">
							<v-select rounded v-model="filters.position" :items="positions" label="Position" clearable
								density="compact" variant="outlined" prepend-inner-icon="sports_basketball" multiple
								chips closable-chips></v-select>
						</v-col>
						<v-col cols="12" sm="6" md="3">
							<v-select rounded v-model="filters.status" :items="statuses" label="Status" clearable
								density="compact" variant="outlined" prepend-inner-icon="info" multiple chips
								closable-chips></v-select>
						</v-col>
						<v-col cols="12" sm="6" md="3">
							<v-btn @click="clearFilters" variant="text" prepend-icon="filter_alt_off"
								:disabled="!hasActiveFilters">
								Clear Filters
							</v-btn>
						</v-col>
					</v-row>
				</v-card-text>
			</v-expand-transition>

			<!-- Data table -->
			<v-data-table v-if="!loading" :headers="headers" :items="filteredPlayers" :search="search"
				:sort-by="[{ key: 'last_name', order: 'asc' }]" fixed-header density="comfortable" class="elevation-1"
				hide-no-data hover multi-sort sort-asc-icon="arrow_drop_up" sort-desc-icon="arrow_drop_down"
				:items-per-page="itemsPerPage" @click:row="(event, { item }) => viewPlayer(item)">
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
								{{ item.first_name }} {{ item.last_name }}
							</div>
							<div v-if="item.real_team" class="text-caption text-grey d-flex align-center gap-1">
								<img src="https://cdn.nba.com/teams/uploads/sites/1610612752/2022/10/NYK2223-PRIMARY-LOGO.svg" style="width: 16px; height: 16px">
								{{ item.real_team }}
							</div>
						</div>
					</div>
				</template>

				<!-- Position -->
				<template v-slot:item.primary_position="{ item }">
					<div class="position-display">
						<v-chip v-if="item.primary_position" size="small" variant="tonal">
							{{ item.primary_position }}
						</v-chip>
						<v-chip v-if="item.secondary_position" size="small" variant="tonal">
							{{ item.secondary_position }}
						</v-chip>
						<span v-if="!item.primary_position && !item.secondary_position" class="text-grey">—</span>
					</div>
				</template>

				<!-- Team -->
				<template v-slot:item.team="{ item }">
					<span v-if="item.team">{{ item.team }}</span>
					<span v-else class="text-grey">Free Agent</span>
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
					<div class="d-flex align-center justify-end pa-2">
						<v-select rounded v-model="itemsPerPage" :items="[10, 25, 50, 100, -1]"
							:item-title="item => item === -1 ? 'All' : item" label="Items per page" density="compact"
							variant="outlined" hide-details class="items-per-page-select"></v-select>
					</div>
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

// State
const players = ref([])
const loading = ref(true)
const error = ref(null)
const search = ref('')
const itemsPerPage = ref(25)
const filters = ref({
	team: [],
	position: [],
	status: []
})

// Table headers
const headers = [
	{
		title: 'Player',
		key: 'player',
		value: 'last_name',
		sortable: true,
		width: '300px'
	},
	{
		title: 'Position',
		key: 'primary_position',
		align: 'center',
		width: '120px'
	},
	{
		title: 'Team',
		key: 'team',
		width: '150px'
	},
	{
		title: 'Salary',
		key: 'salary',
		align: 'end',
		width: '120px'
	},
	{
		title: 'Status',
		key: 'status',
		align: 'center',
		width: '120px'
	}
]

// Computed filter options
const teams = computed(() => {
	const uniqueTeams = [...new Set(players.value.map(p => p.team).filter(Boolean))]
	const sortedTeams = uniqueTeams.sort()
	// Add Free Agent option at the beginning
	return [{ title: 'Free Agent', value: 'FREE_AGENT' }, ...sortedTeams]
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

// Computed filtered players
const filteredPlayers = computed(() => {
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
					case 'rfa': return p.is_rfa
					case 'to': return p.is_to
					case 'ir': return p.is_ir
					default: return false
				}
			})
		})
	}

	return result
})

const hasActiveFilters = computed(() => {
	return filters.value.team.length > 0 ||
		filters.value.position.length > 0 ||
		filters.value.status.length > 0
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
		position: [],
		status: []
	}
}

const viewPlayer = (player) => {
	// Implement navigation to player detail page
	console.log('View player:', player)
	// Example: router.push(`/players/${player.id}`)
}

// Lifecycle
onMounted(() => {
	fetchAllPlayers()
})
</script>

<style scoped lang="scss">
.gap-1 {
	gap: 4px;
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
</style>