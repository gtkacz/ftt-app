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
											@click="loadData" class="mt-4" :loading="loading" icon>
											<v-icon icon="refresh" />
										</v-btn>
										<v-btn v-if="isStaff" color="primary" @click="startLottery" v-confirm :loading="loading">
											Start Now
										</v-btn>
									</p>
								</v-col>
							</v-row>
							<v-divider class="my-4" v-if="!isLotteryHappened" />
							<v-row>
								<v-col v-for="team in sortedTeams" :key="team.id" cols="12" md="6" lg="4">
									<v-card :variant="isDark ? 'elevated' : 'tonal'" color="primary" class="pa-4"
										v-ripple>
										<v-card-title>
											<div class="d-flex align-center justify-start gap-2">
												<span class="text-high-emphasis font-weight-black">{{ team.name
												}}</span>
												<v-icon icon="attribution" color="info" size="small" variant="tonal"
													v-if="team.owner_username === authStore.user?.username" />
											</div>
										</v-card-title>
										<v-card-subtitle>
											@{{ team.owner_username }}
										</v-card-subtitle>
										<v-card-text>
											Draft Seed:
											<h2>{{ lotteryData && lotteryData[team.id] ? '#' +
												lotteryData[team.id][0].overall_pick : 'N/A' }}</h2>
										</v-card-text>
									</v-card>
								</v-col>
							</v-row>
						</v-container>
					</v-tabs-window-item>
					<v-tabs-window-item value="draft">
						<v-container v-if="isLotteryHappened">
							<v-row align="center" justify="center" v-if="!isDraftStarted">
								<v-col cols="auto">
									<p class="d-flex align-center justify-center flex-column">
										<span>The draft will start in</span>
										<countdown :value="moment(draftData.starts_at).unix()" timestamp
											@expired="startDraft" />
										<v-btn v-if="isStaff" color="primary" @click="startDraft" v-confirm class="mt-4"
											:loading="loading">
											Start Now
										</v-btn>
									</p>
								</v-col>
							</v-row>
							<v-row>
								<!-- Navigation buttons for draft -->
								<v-container class="my-4" v-if="isDraftStarted">
									<v-row>
										<v-col cols="12" class="d-flex justify-center flex-column align-center">
											<h5 class="text-h5">{{ nextUnmadePick.team.name }} is on the clock (#{{
												nextUnmadePick.pick.overall_pick }})</h5>
											<countdown :value="nextUnmadePick.pick.time_to_pick" :show-progress="false"
												#label="{ formattedTime }">
												<h5 class="text-h5 text-center">{{ formattedTime }}</h5>
											</countdown>
										</v-col>
									</v-row>
									<v-row>
										<v-col cols="12" class="d-flex justify-center gap-2">
											<v-btn color="primary" variant="tonal" prepend-icon="skip_next"
												@click="goToNextPick" :disabled="!nextUnmadePick">
												Go to Next Pick
											</v-btn>
											<v-btn color="secondary" variant="tonal" prepend-icon="resume"
												@click="goToMyNextPick" :disabled="!myNextUnmadePick">
												Go to My Next Pick
											</v-btn>
										</v-col>
									</v-row>
									<v-row justify="center" align="center">
										<v-btn size="small" variant="tonal" v-tooltip="'Refresh'" color="primary"
											@click="loadData" :loading="loading" icon>
											<v-icon icon="refresh" />
										</v-btn>
									</v-row>
								</v-container>
								<div v-for="(round, index) in draftRounds" :key="round.roundNumber">
									<v-row align="center" class="my-4">
										<v-col>
											<labeled-divider v-if="index < draftRounds.length - 1"
												:label="`Round ${round.roundNumber}`">
												<h2 class="text-h5 text-center text-secondary">Round {{
													round.roundNumber }}</h2>
											</labeled-divider>
										</v-col>
									</v-row>
									<v-row>
										<v-col v-for="pick in round.picks" :key="pick.pick.id" cols="12" md="6" lg="4">
											<v-card :variant="isDark ? 'elevated' : 'tonal'" color="primary"
												class="pa-4" v-ripple :id="`pick-${pick.pick.overall_pick}`">
												<v-card-title>
													<div class="d-flex align-center justify-start gap-2">
														<span class="text-high-emphasis font-weight-black">{{
															pick.team.name }}</span>
														<v-icon icon="attribution" color="info" size="small"
															variant="tonal"
															v-if="pick.team.owner_username === authStore.user?.username" />
													</div>
												</v-card-title>
												<v-card-subtitle>
													@{{ pick.team.owner_username }}
												</v-card-subtitle>
												<v-card-text>
													Pick
													<h2>#{{ pick.pick.overall_pick }}</h2>
													<countdown :value="pick.pick.time_to_pick" :show-progress="false"
														v-if="!pick.pick.is_pick_made" #label="{ formattedTime }"
														:frozen="!isDraftStarted || !pick.pick.is_current">
														<span>{{ formattedTime }}</span>
													</countdown>
													<player-draft-dialog :player="pick.pick.contract.player"
														:team="pick.team"
														:draftable-players="draftData?.draftable_players"
														:pick="pick.pick"
														:disabled="!isDraftStarted || !pick.pick.is_current" />
												</v-card-text>
												<v-card-actions
													v-if="getTeamFuturePicks(pick.team.id, round.roundNumber).length > 0">
													<p>
														<span>Next Picks:</span>
														<v-chip-group column>
															<v-chip
																v-for="futurePick in getTeamFuturePicks(pick.team.id, round.roundNumber)"
																:key="futurePick.id" size="small"
																v-tooltip="`Round ${futurePick.pick__round_number} - Pick #${futurePick.pick_number}`"
																@click="navigateToPick(futurePick.overall_pick)">
																#{{ futurePick.overall_pick }}
															</v-chip>
														</v-chip-group>
													</p>
												</v-card-actions>
											</v-card>
										</v-col>
									</v-row>
								</div>
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
import PlayerDraftDialog from '@/components/core/PlayerDraftDialog.vue';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import moment from 'moment';
import momentTz from 'moment-timezone';
import { computed, nextTick, onMounted, ref } from 'vue';

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

const isDraftStarted = computed(() => {
	return false;
	return isLotteryHappened.value && draftData.value && moment(draftData.value.starts_at).isSameOrBefore(currentDate)
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

const draftRounds = computed(() => {
	if (!lotteryData.value || !teamsData.value) return []

	// Flatten all picks
	const allPicks = []
	for (const teamId in lotteryData.value) {
		const team = teamsData.value.find(t => t.id === Number(teamId))
		if (team) {
			lotteryData.value[teamId].forEach(pick => {
				allPicks.push({ pick, team })
			})
		}
	}

	// Group by round number
	const rounds = {}
	allPicks.forEach(({ pick, team }) => {
		const roundNum = pick.pick__round_number
		if (!rounds[roundNum]) {
			rounds[roundNum] = []
		}
		rounds[roundNum].push({ pick, team })
	})

	// Sort each round by pick number and convert to array
	return Object.entries(rounds)
		.map(([roundNumber, picks]) => ({
			roundNumber: Number(roundNumber),
			picks: picks.sort((a, b) => a.pick.pick_number - b.pick.pick_number)
		}))
		.sort((a, b) => a.roundNumber - b.roundNumber)
})

const allPicksSorted = computed(() => {
	const picks = []
	draftRounds.value.forEach(round => {
		round.picks.forEach(pickData => {
			picks.push(pickData)
		})
	})
	return picks
})

const nextUnmadePick = computed(() => {
	return allPicksSorted.value.find(pickData => !pickData.is_current)
})

const myNextUnmadePick = computed(() => {
	if (!authStore.user) return null
	return allPicksSorted.value.find(pickData =>
		!pickData.is_pick_made &&
		pickData.team.owner_username === authStore.user.username
	)
})

const getTeamFuturePicks = (teamId: number, currentRound: number) => {
	if (!lotteryData.value || !lotteryData.value[teamId]) return []

	return lotteryData.value[teamId].filter(pick => pick.pick__round_number > currentRound)
}

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
		const response = await api.get(`/drafts/${draftData.value.id}/picks/`)
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

const navigateToPick = async (overallPick: number) => {
	// Switch to draft tab
	tab.value = 'draft'

	// Wait for DOM to update
	await nextTick()

	// Find and scroll to the pick card
	const pickElement = document.getElementById(`pick-${overallPick}`)
	if (pickElement) {
		pickElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

		// Add a highlight effect
		pickElement.classList.add('highlight-pick')
		setTimeout(() => {
			pickElement.classList.remove('highlight-pick')
		}, 2000)
	}
}

const goToNextPick = () => {
	if (nextUnmadePick.value) {
		navigateToPick(nextUnmadePick.value.pick.overall_pick)
	}
}

const goToMyNextPick = () => {
	if (myNextUnmadePick.value) {
		navigateToPick(myNextUnmadePick.value.pick.overall_pick)
	}
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

<style lang="scss" scoped>
.highlight-pick {
	animation: highlightPulse 2s ease-out;
}

@keyframes highlightPulse {
	0% {
		box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.8);
	}

	50% {
		box-shadow: 0 0 20px 10px rgba(var(--v-theme-primary), 0.4);
	}

	100% {
		box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0);
	}
}
</style>