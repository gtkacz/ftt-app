<template>
	<div>
		<!-- Player avatar for other teams with player -->
		<v-avatar v-if="player && ((!isStaff && team.id !== userTeamId) || disabled)" size="40" class="cursor-pointer"
			@click="showPlayerDialog = true">
			<v-img :src="player?.photo" :alt="playerFullName" cover>
				<template #error>
					<v-icon size="40">account_circle</v-icon>
				</template>
			</v-img>
		</v-avatar>

		<!-- Draft button for user's team -->
		<v-btn v-else-if="(team.id === userTeamId || isStaff) && pick?.is_current" icon variant="outlined" size="small"
			@click="showDraftDialog = true" v-tooltip="'Draft a player'">
			<v-icon>person_add</v-icon>
		</v-btn>


		<!-- Player avatar for user's team with player -->
		<v-avatar v-else-if="player && pick?.is_pick_made" size="40" class="cursor-pointer"
			@click="showPlayerDialog = true">
			<v-img :src="player?.photo" :alt="playerFullName" cover>
				<template #error>
					<v-icon size="40">account_circle</v-icon>
				</template>
			</v-img>
		</v-avatar>

		<!-- Empty avatar for other teams without player -->
		<v-avatar v-else size="40" color="grey-lighten-2">
			<v-icon>person</v-icon>
		</v-avatar>

		<!-- Player info dialog -->
		<v-dialog max-width="500" v-model="showPlayerDialog">
			<player-card :player="player" :pick="pick" />
		</v-dialog>

		<!-- Draft players dialog -->
		<v-dialog v-model="showDraftDialog" max-width="1600" scrollable persistent transition="fade-transition">
			<v-card class="pa-4" density="comfortable">
				<v-card-title>
					Draft a Player
					<v-btn variant="text" icon @click="showDraftDialog = false" class="float-right">
						<v-icon>close</v-icon>
					</v-btn>
				</v-card-title>

				<v-card-text>
					<players-table :headers="draftHeaders" :players="draftablePlayers"
						@player-selected="onPlayerSelected" />
					<v-dialog max-width="500" v-model="showPickDialog">
						<player-card :player="pickData" :pick="pick" @draft="onDraftPlayer" can-draft />
					</v-dialog>
				</v-card-text>
			</v-card>
		</v-dialog>
	</div>
</template>

<script setup lang="ts">
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import { computed, ref } from 'vue';
import PlayersTable from '@/components/core/PlayersTable.vue';
import PlayerCard from '@/components/core/PlayerCard.vue';

// Props
const props = withDefaults(defineProps<{
	team: {
		id: number
		[key: string]: any
	}
	draftablePlayers: any[]
	player?: object | null
	pick?: any
	disabled: boolean
}>(), {
	disabled: false
})

const emit = defineEmits<{
	'player-selected': (player: any) => void
}>();

// State
const authStore = useAuthStore()
const userTeamId = computed(() => authStore.user?.team?.id)
const isStaff = computed(() => authStore.user?.is_staff)
const showPlayerDialog = ref(false)
const showDraftDialog = ref(false)
const showPickDialog = ref(false)
const pickData = ref(null)

// Draft table headers
const draftHeaders = [
	{ title: 'Player', key: 'player', value: 'last_name', sortable: true, width: '300px', visible: true, locked: true },
	{ title: 'Position', key: 'primary_position', width: '120px', visible: true, sortable: true },
]

// Computed
const playerFullName = computed(() => {
	if (!props.player) return ''
	return `${props.player.first_name} ${props.player.last_name}`
})

// Methods
const onPlayerSelected = (player: any) => {
	pickData.value = player
	showPickDialog.value = true
}

const onDraftPlayer = (playerId: number) => {
	if (!props.pick) return

	api.post(`drafts/make-pick/${props.pick.id}/`, { player_id: playerId })
		.then(() => {
			showPickDialog.value = false
			showDraftDialog.value = false
			emit('player-selected', playerId)
		});
}
</script>

<style scoped lang="scss">
.cursor-pointer {
	cursor: pointer;
}
</style>