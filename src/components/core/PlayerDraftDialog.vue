<template>
	<div>
		<!-- Empty avatar for other teams without player -->
		<v-avatar v-if="!player && team.id !== userTeamId" size="40" color="grey-lighten-2">
			<v-icon>account_circle</v-icon>
		</v-avatar>

		<!-- Player avatar for other teams with player -->
		<v-avatar v-else-if="player && team.id !== userTeamId" size="40" class="cursor-pointer"
			@click="showPlayerDialog = true">
			<v-img :src="playerData?.photo || '/placeholder-player.png'" :alt="playerFullName" cover>
				<template v-slot:error>
					<v-icon size="40">account_circle</v-icon>
				</template>
			</v-img>
		</v-avatar>

		<!-- Draft button for user's team -->
		<v-btn v-else-if="!player && team.id === userTeamId" icon variant="outlined" size="small"
			@click="showDraftDialog = true" v-tooltip="'Draft a player'">
			<v-icon>person_add</v-icon>
		</v-btn>

		<!-- Player avatar for user's team with player -->
		<v-avatar v-else size="40" class="cursor-pointer" @click="showPlayerDialog = true">
			<v-img :src="playerData?.photo || '/placeholder-player.png'" :alt="playerFullName" cover>
				<template v-slot:error>
					<v-icon size="40">account_circle</v-icon>
				</template>
			</v-img>
		</v-avatar>

		<!-- Player info dialog -->
		<v-dialog v-model="showPlayerDialog" max-width="500">
			<v-card v-if="playerData">
				<v-card-title class="d-flex align-center">
					<v-avatar size="60" class="mr-3">
						<v-img :src="playerData.photo || '/placeholder-player.png'" :alt="playerFullName" cover>
							<template v-slot:error>
								<v-icon size="60">account_circle</v-icon>
							</template>
						</v-img>
					</v-avatar>
					<div>
						<div class="text-h5">{{ playerFullName }}</div>
						<div class="text-caption text-grey">
							{{ playerData.primary_position }}
							<span v-if="playerData.secondary_position"> / {{ playerData.secondary_position }}</span>
						</div>
					</div>
				</v-card-title>

				<v-card-text>
					<v-list density="comfortable">
						<v-list-item v-if="playerData.team_name">
							<template v-slot:prepend>
								<v-icon>groups</v-icon>
							</template>
							<v-list-item-title>Team</v-list-item-title>
							<v-list-item-subtitle>{{ playerData.team_name }}</v-list-item-subtitle>
						</v-list-item>

						<v-list-item v-if="playerData.salary">
							<template v-slot:prepend>
								<v-icon>attach_money</v-icon>
							</template>
							<v-list-item-title>Salary</v-list-item-title>
							<v-list-item-subtitle>{{ formatCurrency(playerData.salary) }}</v-list-item-subtitle>
						</v-list-item>

						<v-list-item v-if="playerData.contract_duration">
							<template v-slot:prepend>
								<v-icon>event</v-icon>
							</template>
							<v-list-item-title>Contract</v-list-item-title>
							<v-list-item-subtitle>{{ playerData.contract_duration }} year<span
									v-if="playerData.contract_duration > 1">s</span></v-list-item-subtitle>
						</v-list-item>
					</v-list>

					<div v-if="playerData.is_rfa || playerData.is_to || playerData.is_ir" class="mt-3">
						<v-chip-group column>
							<v-chip v-if="playerData.is_rfa" size="small" v-tooltip="'Restricted Free Agent'">
								RFA
							</v-chip>
							<v-chip v-if="playerData.is_to" size="small" v-tooltip="'Team Option'">
								TO
							</v-chip>
							<v-chip v-if="playerData.is_ir" size="small" v-tooltip="'Injured Reserve'">
								IR
							</v-chip>
						</v-chip-group>
					</div>
				</v-card-text>

				<v-card-actions>
					<v-spacer />
					<v-btn variant="text" @click="showPlayerDialog = false">Close</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<!-- Draft players dialog -->
		<v-dialog v-model="showDraftDialog" max-width="1600" scrollable persistent transition="fade-transition">
		{{ pick }}
			<v-card class="pa-4" density="comfortable">
				<v-card-title>
					Draft a Player
					<v-btn variant="text" icon @click="showDraftDialog = false" class="float-right">
						<v-icon>close</v-icon>
					</v-btn>
				</v-card-title>

				<v-card-text>
					<players-table :headers="draftHeaders" :players="draftablePlayers" @player-selected="onPlayerSelected" />
					<v-dialog max-width="500" v-model="showPickDialog">
						<player-card :player="pickData" :pick="pick" can-draft />
					</v-dialog>
				</v-card-text>
			</v-card>
		</v-dialog>
	</div>
</template>

<script setup lang="ts">
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import { computed, ref, watch } from 'vue';
import PlayersTable from './PlayersTable.vue';
import PlayerCard from './PlayerCard.vue';

// Props
const props = defineProps<{
	team: {
		id: number
		[key: string]: any
	}
	draftablePlayers: any[]
	player?: number
	pick?: any
}>()

// State
const authStore = useAuthStore()
const userTeamId = computed(() => authStore.user?.team?.id)
const showPlayerDialog = ref(false)
const showDraftDialog = ref(false)
const showPickDialog = ref(false)
const playerData = ref(null)
const pickData = ref(null)

// Draft table headers
const draftHeaders = [
	{ title: 'Player', key: 'player', value: 'last_name', sortable: true, width: '300px', visible: true, locked: true },
	{ title: 'Position', key: 'primary_position', width: '120px', visible: true, sortable: true },
]

// Computed
const playerFullName = computed(() => {
	if (!playerData.value) return ''
	return `${playerData.value.first_name} ${playerData.value.last_name}`
})

// Methods
const onPlayerSelected = (player: any) => {
	pickData.value = player
	showPickDialog.value = true
}

const fetchPlayerData = async () => {
	if (!props.player) return

	try {
		const response = await api.get(`players/${props.player}/`)
		playerData.value = response.data
	} catch (error) {
		console.error('Error fetching player data:', error)
	}
}

const formatCurrency = (amount: number) => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount * 1000000)
}

// Watchers
watch(() => props.player, () => {
	if (props.player) {
		fetchPlayerData()
	}
}, { immediate: true })
</script>

<style scoped lang="scss">
.cursor-pointer {
	cursor: pointer;
}
</style>