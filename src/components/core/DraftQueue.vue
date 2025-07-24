<template>
	<div class="centered-menu">
		<v-menu v-model="menuOpen" :close-on-content-click="false" attach transition="fade-transition" max-width="800"
			max-height="600">
			<template #activator="{ props }">
				<v-btn v-bind="props" variant="outlined" prepend-icon="queue"
					:color="queuePlayers.length > 0 ? 'primary' : undefined" rounded>
					<v-badge :content="queuePlayers.length" :model-value="queuePlayers.length > 0" color="success">
						Draft Queue
					</v-badge>
				</v-btn>
			</template>

			<v-card rounded="lg" density="comfortable" v-if="menuOpen" class="responsive-card">
				<!-- Loading state -->
				<v-progress-linear v-if="loading" indeterminate />

				<!-- Queue Management View -->
				<template v-if="!showPlayerTable">
					<v-card-title class="d-flex align-center justify-space-between pa-6" rounded>
						<p class="d-flex align-center ga-1">
							<span>Draft Queue</span>
							<v-icon icon="help" variant="outlined" filled="false" size="x-small"
								v-tooltip="'Players in your draft queue will be autopicked for you if they are available at the time of your next pick'" />
						</p>
						<v-chip v-if="queuePlayers.length > 0" size="small" color="primary">
							{{ queuePlayers.length }} player{{ queuePlayers.length !== 1 ? 's' : '' }}
						</v-chip>
					</v-card-title>

					<v-divider />

					<v-card-text class="pa-0" style="max-height: 400px; overflow-y: auto;">
						<!-- Empty state -->
						<div v-if="queuePlayers.length === 0" class="text-center pa-8">
							<v-icon size="64" color="grey-lighten-1" class="mb-4">queue</v-icon>
							<div class="text-h6 text-grey-darken-1 mb-2">No players in queue</div>
							<div class="text-body-2 text-grey">Add players to your draft queue to get started</div>
						</div>

						<!-- Control buttons -->
						<div class="pa-4 border-t d-flex align-center justify-space-between">
							<v-btn @click="showPlayerTable = true" prepend-icon="add" variant="outlined" rounded>
								Add Player
							</v-btn>
							<!-- Toggle queue on and off -->
							<v-checkbox class="ml-4" label="Enable Autopick" ripple
								:disabled="queuePlayers.length === 0" color="primary" v-model="queueEnabled" @update:model-value="toggleQueue" :loading="queueToggleLoading" density="compact" hide-details />
						</div>

						<!-- Queue list -->
						<v-list v-if="queuePlayers.length > 0" density="comfortable">
							<draggable v-model="queuePlayers" tag="div" item-key="id" :animation="200"
								ghost-class="ghost" chosen-class="chosen" drag-class="drag" handle=".drag-handle"
								@start="isDragging = true" @end="isDragging = false">
								<template #item="{ element: player, index }">
									<v-list-item :key="player.id" class="queue-item"
										:class="{ 'dragging': isDragging }">
										<template #prepend>
											<div class="d-flex align-center ga-2">
												<v-icon class="drag-handle" style="cursor: move;">drag_handle</v-icon>
												<v-chip size="x-small" variant="outlined">{{ index + 1 }}</v-chip>
											</div>
										</template>

										<div class="d-flex align-center">
											<v-avatar size="32" class="mr-3">
												<v-img :src="player.photo || '/placeholder-player.png'"
													:alt="`${player.first_name} ${player.last_name}`" cover>
													<template #error>
														<v-icon size="32">account</v-icon>
													</template>
												</v-img>
											</v-avatar>
											<div>
												<div class="font-weight-medium">
													{{ player.last_name }}, {{ player.first_name }}
												</div>
												<div class="text-caption text-grey d-flex align-center ga-1">
													<span v-if="player.primary_position">{{ player.primary_position
													}}</span>
													<span v-if="player.team?.name">• {{ player.team.name }}</span>
												</div>
											</div>
										</div>

										<template #append>
											<v-btn icon size="small" variant="text" color="error"
												@click="removeFromQueue(index)" v-tooltip="'Remove from queue'">
												<v-icon size="18">close</v-icon>
											</v-btn>
										</template>
									</v-list-item>
								</template>
							</draggable>
						</v-list>
					</v-card-text>

					<v-divider />

					<v-card-actions class="justify-space-between pa-4">
						<v-btn @click="discardChanges" icon variant="text" color="grey" class="action-btn"
							:disabled="!hasChanges" v-tooltip="'Discard Changes'">
							<v-icon>undo</v-icon>
						</v-btn>
						<div class="d-flex ga-2">
							<v-btn @click="clearQueue" icon color="error" class="action-btn"
								:disabled="queuePlayers.length === 0" v-tooltip="'Clear Queue'" v-confirm>
								<v-icon>delete</v-icon>
							</v-btn>
							<v-btn @click="saveQueue" icon color="success" variant="tonal" :loading="saving"
								class="action-btn" :disabled="queuePlayers.length === 0 || !hasChanges"
								v-tooltip="'Save Queue'" v-confirm>
								<v-icon>save</v-icon>
							</v-btn>
						</div>
					</v-card-actions>
				</template>

				<!-- Player Selection Table View -->
				<template v-else>
					<v-card-title class="d-flex align-center justify-space-between">
						<div class="d-flex align-center ga-2">
							<v-btn @click="showPlayerTable = false" icon size="small" variant="text">
								<v-icon>arrow_back</v-icon>
							</v-btn>
							<span>Add Player to Queue</span>
						</div>
						<v-chip v-if="queuePlayers.length > 0" size="small" color="primary">
							{{ queuePlayers.length }} in queue
						</v-chip>
					</v-card-title>

					<v-divider />

					<div class="player-table-container" style="height: 500px; overflow: hidden;">
						<players-table :players="filteredDraftablePlayers" :headers="tableHeaders"
							@player-selected="addToQueue">
							<template #extra-actions>
								<span />
							</template>
						</players-table>
					</div>
				</template>
			</v-card>
		</v-menu>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import draggable from 'vuedraggable'
import api from '@/api/axios'
import PlayersTable from '@/components/core/PlayersTable.vue'

// Props
const props = defineProps<{
	draftablePlayersRaw?: Array<any>
	teamId: string | number
	draftId: string | number
}>()

// Emits
const emit = defineEmits<{
	(e: 'queue-updated', queue: any[]): void
	(e: 'queue-saved', queue: any[]): void
}>()

// State
const menuOpen = ref<boolean>(false)
const queueEnabled = ref<boolean>(false)
const queueToggleLoading = ref<boolean>(false)
const showPlayerTable = ref<boolean>(false)
const loading = ref<boolean>(false)
const saving = ref<boolean>(false)
const isDragging = ref<boolean>(false)
const queuePlayers = ref<any[]>([])
const originalQueue = ref<any[]>([])
const error = ref<string | null>(null)
const queueId = ref<string | null>(null)

// Computed
const draftablePlayers = computed(() => props.draftablePlayersRaw || [])

const filteredDraftablePlayers = computed(() => {
	const queueIds = new Set(queuePlayers.value.map(p => p.id))
	return draftablePlayers.value.filter(player => !queueIds.has(player.id))
})

const hasChanges = computed(() => {
	if (queuePlayers.value.length !== originalQueue.value.length) return true
	return queuePlayers.value.some((player, index) => {
		const original = originalQueue.value[index]
		return !original || player.id !== original.id
	})
})

// Table headers for player selection
const tableHeaders = [
	{ title: 'Player', key: 'player', value: 'last_name', sortable: true, width: '200px', visible: true },
	{ title: 'FP/G', key: 'relevancy', align: 'end', width: '100px', visible: true, sortable: true },
	{ title: 'Position', key: 'primary_position', width: '120px', visible: true, sortable: true },
]

// Methods
const fetchExistingQueue = async () => {
	if (!props.teamId) return

	loading.value = true
	error.value = null

	const response = await api.get(`drafts/${props.draftId}/queues/`)
	if (response.data && response.data?.results?.[0]?.queue_items && response.data?.results?.[0]?.team === props.teamId) {
		queuePlayers.value = [...response.data.results[0].queue_items]
		originalQueue.value = [...response.data.results[0].queue_items]
		queueId.value = response.data.results[0].id
		queueEnabled.value = response.data.results[0].autopick_enabled
	}
	else {
		const newQueue = await api.post(`drafts/${props.draftId}/queues/`, { queue_items: [], autopick_enabled: false, team: props.teamId, draft: props.draftId })
		queueId.value = newQueue.data.id
	}
	loading.value = false
}

const toggleQueue = async (enabled: boolean) => {
	if (!queueId.value) return

	queueToggleLoading.value = true
	try {
		await api.patch(`drafts/${props.draftId}/queues/${queueId.value}/`, { autopick_enabled: enabled })
		queueEnabled.value = enabled
	}
	catch (err) {
		error.value = 'Failed to update queue status'
	}
	finally {
		queueToggleLoading.value = false
	}
}

const addToQueue = (player: any) => {
	// Check if player is already in queue
	if (queuePlayers.value.some(p => p.id === player.id)) {
		return
	}

	queuePlayers.value.push(player)
	showPlayerTable.value = false
	emit('queue-updated', [...queuePlayers.value])
}

const removeFromQueue = (index: number) => {
	queuePlayers.value.splice(index, 1)
	emit('queue-updated', [...queuePlayers.value])
}

const clearQueue = () => {
	queuePlayers.value = []
	emit('queue-updated', [])
}

const saveQueue = async () => {
	if (!props.teamId) return

	saving.value = true
	error.value = null

	const payload = {
		player_ids: queuePlayers.value.map(player => player.id),
		autopick_enabled: true,
	}

	await api.post(`drafts/queues/${queueId.value}/reorder/`, payload)

	// Update original queue to reflect saved state
	originalQueue.value = [...queuePlayers.value]

	emit('queue-saved', [...queuePlayers.value])

	saving.value = false
}

const discardChanges = () => {
	queuePlayers.value = [...originalQueue.value]
	showPlayerTable.value = false
	// menuOpen.value = false
	emit('queue-updated', [...queuePlayers.value])
}

// Watchers
watch(() => props.teamId, (newTeamId) => {
	if (newTeamId) {
		fetchExistingQueue()
	}
})

watch(menuOpen, (isOpen) => {
	if (isOpen && !loading.value) {
		fetchExistingQueue()
	}
	if (!isOpen) {
		showPlayerTable.value = false
	}
})

// Lifecycle
onMounted(() => {
	if (props.teamId) {
		fetchExistingQueue()
	}
})
</script>

<style scoped lang="scss">
.queue-item {
	border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);

	&:last-child {
		border-bottom: none;
	}

	&.dragging {
		background-color: rgba(var(--v-theme-surface-variant), 0.8);
	}
}

.drag-handle {
	color: rgba(var(--v-theme-on-surface), 0.6);
	transition: color 0.2s;

	&:hover {
		color: rgba(var(--v-theme-on-surface), 0.87);
	}
}

.border-t {
	border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

// Drag and drop styles
.ghost {
	opacity: 0.5;
	background-color: rgba(var(--v-theme-primary), 0.1);
}

.chosen {
	background-color: rgba(var(--v-theme-primary), 0.05);
}

.drag {
	transform: rotate(2deg);
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

// Center the menu on screen
.centered-menu :deep(.v-overlay__content) {
	position: fixed !important;
	top: 50% !important;
	left: 50% !important;
	transform: translate(-50%, -50%) !important;
	max-height: 90vh;
}

// Responsive card styles
.responsive-card {
	width: 800px;
	max-width: 95vw;
	max-height: 90vh;

	@media (max-width: 960px) {
		width: 90vw;
		max-width: 600px;
	}

	@media (max-width: 600px) {
		width: 95vw !important;
		max-width: none;
		max-height: 95vh !important;
		height: 95vh !important;

		// Adjust internal spacing for mobile
		:deep(.v-card-title) {
			padding: 16px 16px 12px 16px;
			flex-direction: column;
			align-items: flex-start;
			gap: 8px;

			.v-chip {
				align-self: flex-end;
			}
		}

		:deep(.v-card-actions) {
			padding: 12px 16px;
			flex-direction: column;
			gap: 12px;

			.d-flex {
				width: 100%;
				justify-content: center;
			}
		}

		// Adjust player table view for mobile
		.player-table-container {
			height: 400px;
		}
	}

	@media (max-width: 480px) {
		width: 98vw;
		max-height: 80vh;

		:deep(.v-card-text) {
			max-height: 300px;
		}

		.player-table-container {
			height: 350px;
		}
	}
}

// Custom scrollbar for queue list
:deep(.v-card-text) {
	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-track {
		background: rgba(var(--v-theme-on-surface), 0.05);
		border-radius: 3px;
	}

	&::-webkit-scrollbar-thumb {
		background: rgba(var(--v-theme-on-surface), 0.2);
		border-radius: 3px;

		&:hover {
			background: rgba(var(--v-theme-on-surface), 0.3);
		}
	}
}
</style>