<template>
	<div class="page-view">
		<div class="page-header">
			<h1 class="page-title">League Draft</h1>
			<!-- <p class="page-subtitle">Lorem ipsum dolor sit amet</p> -->
		</div>

		<v-card>
			<!-- If loading show loader -->
			<v-tabs v-model="tab" bg-color="primary" density="comfortable" color="secondary" :disabled="loading"
				mandatory>
				<v-tab value="lottery">Lottery</v-tab>
				<v-tab value="draft">Draft</v-tab>
			</v-tabs>
			<v-progress-linear v-if="loading" indeterminate class="mb-4" color="secondary" />

			<v-card-text v-else>
				<v-tabs-window v-model="tab">
					<v-tabs-window-item value="lottery">
						<v-container>
							<v-row align="center" justify="center" v-if="!isLotteryHappened">
								<v-col cols="auto">
									<p class="d-flex align-center justify-center flex-column gap-2">
										<span>The lottery will start in</span>
										<countdown :value="lotteryStartsAt" timestamp @expired="startLottery" />
										<v-btn size="small" variant="tonal" v-tooltip="'Refresh'" color="primary"
											@click="startLottery" class="mt-4" :loading="loading" icon>
											<v-icon icon="refresh" />
										</v-btn>
										<v-btn v-if="isStaff" color="primary" @click="startLottery" :loading="loading">
											Start Now
										</v-btn>
									</p>
								</v-col>
							</v-row>
							<v-divider class="my-4" v-if="!isLotteryHappened" />
							<v-row>
								<v-col v-for="team in sortedTeams" :key="team.id" cols="12" md="6" lg="4">
									<v-card :variant="isDark ? 'elevated' : 'tonal'" color="primary" class="pa-4" v-ripple>
										<v-card-title>
											<div class="d-flex align-center justify-start gap-2">
												<span class="text-high-emphasis font-weight-black">{{ team.name }}</span>
												<v-icon icon="attribution" color="info" size="small" variant="tonal" v-if="team.owner_username === authStore.user?.username" />
											</div>
										</v-card-title>
										<v-card-subtitle>
												@{{ team.owner_username }}
										</v-card-subtitle>
										<v-card-text>
											Draft Position:
											<h2>{{ lotteryData && lotteryData[team.id] ? '#' +
												lotteryData[team.id][0].overall_pick : 'N/A' }}</h2>
										</v-card-text>
										<v-card-actions v-if="isLotteryHappened && lotteryData[team.id]">
											<p>
												<span>Next Picks:</span>
												<v-chip-group column>
													<v-chip v-for="pick in lotteryData[team.id].slice(1)" :key="pick.id"
														size="small"
														v-tooltip="`Round ${pick.pick__round_number} - Pick #${pick.pick_number}`">
														#{{ pick.overall_pick }}
													</v-chip>
												</v-chip-group>
											</p>
										</v-card-actions>
									</v-card>
								</v-col>
							</v-row>
						</v-container>
					</v-tabs-window-item>
					<v-tabs-window-item value="draft">
						<v-container>
							<v-row align="center" justify="center"
								v-if="moment(draftData.starts_at).isAfter(currentDate)">
								<v-col cols="auto">
									<p class="d-flex align-center justify-center flex-column">
										<span>The draft will start in</span>
										<countdown :value="moment(draftData.starts_at).unix()" timestamp
											@expired="startDraft" />
										<v-btn v-if="isStaff" color="primary" @click="startDraft" class="mt-4"
											:loading="loading">
											Start Now
										</v-btn>
									</p>
								</v-col>
							</v-row>
						</v-container>
					</v-tabs-window-item>
					<v-dialog v-model="startDialog" max-width="320" persistent>
						<v-list class="py-2" color="primary" elevation="12" rounded="lg">
							<v-list-item :title="`Starting ${dialogAction}...`">
								<template v-slot:prepend>
									<app-logo class="mr-4" />
								</template>

								<template v-slot:append>
									<v-progress-circular color="primary" indeterminate="disable-shrink" size="16"
										width="2"></v-progress-circular>
								</template>
							</v-list-item>
						</v-list>
					</v-dialog>
				</v-tabs-window>
			</v-card-text>
		</v-card>
	</div>
</template>

<script setup lang="ts">
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import moment from 'moment';
import momentTz from 'moment-timezone';
import { computed, onMounted, ref } from 'vue';
import { useThemeStore } from '@/stores/theme';

const authStore = useAuthStore()
const isStaff = computed(() => {
	return authStore.user?.is_superuser
})
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

const loading = ref(true)
const startDialog = ref(false)
const dialogAction = ref('Draft')
const tab = ref('lottery')
const draftData = ref(null)
const teamsData = ref(null)
const lotteryData = ref(null)
const currentDate = moment()
const lotteryStartsAt = momentTz.tz('2025-07-18 12:00:00', 'America/Sao_Paulo').unix()
const isLotteryHappened = computed(() => {
	return lotteryData.value && Object.keys(lotteryData.value).length > 0
})

const sortedTeams = computed(() => {
	if (!teamsData.value) return []

	return [...teamsData.value].sort((a, b) => {
		const aHasPick = lotteryData.value && lotteryData.value[a.id] && lotteryData.value[a.id][0]
		const bHasPick = lotteryData.value && lotteryData.value[b.id] && lotteryData.value[b.id][0]

		// Both have picks - sort by overall_pick (ascending)
		if (aHasPick && bHasPick) {
			return lotteryData.value[a.id][0].overall_pick - lotteryData.value[b.id][0].overall_pick
		}

		// Only a has pick - a comes first
		if (aHasPick && !bHasPick) return -1

		// Only b has pick - b comes first
		if (!aHasPick && bHasPick) return 1

		// Neither has pick - sort alphabetically by team name
		return a.name.localeCompare(b.name)
	})
})

const fetchTeamsData = async () => {
	try {
		const response = await api.get("/teams/")
		teamsData.value = response.data.results
	} catch (error) {
		console.error('Error fetching draft data:', error)
		throw error
	}
}

const fetchDraftData = async () => {
	try {
		const response = await api.get(`/drafts/?year=${currentDate.year()}`)
		draftData.value = response.data.results[0]
	} catch (error) {
		console.error('Error fetching draft data:', error)
		throw error
	}
}

const fetchLotteryData = async () => {
	try {
		const response = await api.get(`/drafts/${draftData.value.id}/lottery/`)
		const rawData = response.data.picks

		const picksByTeam = rawData.reduce<Record<number, any[]>>((acc, pick) => {
			const teamId = pick.pick__current_team;
			if (!acc[teamId]) {
				acc[teamId] = [];
			}
			acc[teamId].push(pick);
			return acc;
		}, {});

		for (const teamId in picksByTeam) {
			picksByTeam[teamId].sort((a, b) => a.pick__round_number - b.pick__round_number);
		}

		lotteryData.value = picksByTeam
	} catch (error) {
		console.error('Error fetching draft data:', error)
		throw error
	} finally {
		loading.value = false
	}
}

const startLottery = async () => {
	try {
		dialogAction.value = 'Lottery'
		startDialog.value = true

		if (isStaff.value) {
			await api.post(`/drafts/${draftData.value.id}/lottery/start/`)
		} else {
			await new Promise(r => setTimeout(r, 5000));
		}
	} catch (error) {
		console.error('Error starting lottery:', error)
		throw error
	} finally {
		await loadData()
		startDialog.value = false
	}
}

const startDraft = async () => {
	if (!isStaff.value) return
	dialogAction.value = 'Draft'
	startDialog.value = true
	await new Promise(r => setTimeout(r, 2000));
	startDialog.value = false
	return;
}

const loadData = async () => {
	loading.value = true
	await Promise.all([
		fetchTeamsData(),
		fetchDraftData(),
	]).then(() => {
		fetchLotteryData()
	})
}

onMounted(() => {
	loadData()
})
</script>

<style lang="scss" scoped></style>