<template>
	<div class="page-view">
		<div class="page-header draft-header">
			<p class="eyebrow">{{ t('leagueDraftView.header.eyebrow') }}</p>
			<h1 class="page-title">{{ t('leagueDraftView.header.title') }}</h1>
			<p class="page-subtitle">{{ t('leagueDraftView.header.subtitle') }}</p>
		</div>

		<v-card class="draft-workspace" variant="flat">
			<!-- If loading show loader -->
			<v-tabs v-model="tab" class="draft-tabs" density="comfortable" color="secondary" :disabled="loading"
				mandatory grow>
				<v-tab value="lottery">{{ t('leagueDraftView.tabs.lottery') }}</v-tab>
				<v-tab value="draft">{{ t('leagueDraftView.tabs.draft') }}</v-tab>
			</v-tabs>
			<v-progress-linear v-if="loading" indeterminate class="mb-4" color="secondary" />

			<v-card-text v-else class="draft-workspace__body">
				<v-tabs-window v-model="tab">
					<v-tabs-window-item value="lottery">
						<v-sheet class="draft-surface">
							<v-row align="center" justify="center" v-if="!isLotteryHappened" class="draft-state">
								<v-col cols="auto">
									<p class="d-flex align-center justify-center flex-column ga-2">
										<span>{{ t('leagueDraftView.lottery.startingIn') }}</span>
										<countdown :value="lotteryStartsAt" timestamp @expired="startLottery" />
										<v-btn size="small" variant="tonal" color="info" :aria-label="t('leagueDraftView.actions.refreshAriaLabel')"
											:title="t('leagueDraftView.actions.refreshTitle')" @click="fetchAllData" class="mt-4 draft-icon-action" :loading="loading" icon>
											<v-icon icon="refresh" />
										</v-btn>
										<v-btn v-if="isStaff" color="primary" @click="startLottery" v-confirm
											:loading="loading">
											{{ t('leagueDraftView.actions.startNow') }}
										</v-btn>
									</p>
								</v-col>
							</v-row>
							<v-divider class="my-4" v-if="!isLotteryHappened" />
							<v-row align="center" justify="center">
								<v-col v-for="team in sortedTeams" :key="team.id" cols="12" md="6" lg="4">
									<v-card :variant="isDark ? 'elevated' : 'tonal'" color="primary"
										class="pa-4 draft-team-card">
										<template #title>
											<div class="d-flex align-center justify-start ga-2">
												<span class="font-weight-black">{{ team.name
												}}</span>
												<v-icon icon="attribution" color="info" size="small" variant="tonal"
													v-if="team.owner_username === authStore.user?.username" />
											</div>
										</template>
										<template #subtitle>
											@{{ team.owner_username }}
										</template>
										<template #text>
											{{ t('leagueDraftView.lottery.draftSeed') }}
											<h2>{{ lotteryData && lotteryData[team.id] ? '#' +
												lotteryData[team.id][0].overall_pick : t('leagueDraftView.lottery.notAvailable') }}</h2>
										</template>
									</v-card>
								</v-col>
							</v-row>
						</v-sheet>
					</v-tabs-window-item>
					<v-tabs-window-item value="draft">
						<v-sheet v-if="isLotteryHappened" class="draft-surface">
							<v-container fluid v-if="!isDraftStarted">
								<v-row align="center" justify="center" class="w-100 flex-column">
									<span>{{ t('leagueDraftView.draft.startingIn') }}</span>
									<countdown :value="dayjs(draftData.starts_at).unix()" timestamp
										@expired="startDraft" />
									<v-btn v-if="isStaff" color="primary" @click="startDraft" v-confirm class="mt-4"
										:loading="loading">
										{{ t('leagueDraftView.actions.startNow') }}
									</v-btn>
								</v-row>
							</v-container>
							<v-container fluid>
								<!-- Navigation buttons for draft -->
								<v-container fluid class="draft-control ga-8 d-flex flex-column align-center justify-center"
									v-if="isDraftStarted && !draftData?.is_completed">
									<div>
										<div class="d-flex justify-center flex-column align-center text-center">
											<h5 class="text-h5">{{ nextUnmadePick?.team?.name ===
												authStore.user?.team?.name
												? t('leagueDraftView.draft.onTheClockYou', { pick: nextUnmadePick?.pick.overall_pick })
												: t('leagueDraftView.draft.onTheClockTeam', { team: nextUnmadePick?.team?.name, pick: nextUnmadePick?.pick.overall_pick }) }}</h5>
											<countdown :value="nextUnmadePick?.pick.time_to_pick" :show-progress="false"
												#label="{ formattedTime }" @expired="fetchAllData">
												<h5 class="text-h5 text-center">{{ formattedTime }}</h5>
											</countdown>
											<span class="text-caption"
												v-if="nextUnmadePick?.team?.name !== authStore.user?.team?.name && myNextUnmadePick">{{
													t('leagueDraftView.draft.picksUntilYou', { count: myNextUnmadePick?.pick.overall_pick - nextUnmadePick?.pick.overall_pick })
												}}</span>
										</div>
									</div>
									<DraftQueue v-if="authStore.user?.team?.id"
										:draftable-players-raw="getDraftablePlayers" :team-id="authStore.user?.team?.id"
										:draft-id="draftData?.id" />
									<div class="draft-actions d-flex flex-column flex-lg-row ga-2 justify-center align-center">
										<v-btn color="info" variant="tonal" prepend-icon="skip_next"
											@click="goToNextPick" :disabled="!nextUnmadePick" class="pick-btn" rounded>
											{{ t('leagueDraftView.actions.goToNextPick') }}
										</v-btn>
										<v-btn color="secondary" variant="tonal" prepend-icon="resume"
											@click="goToMyNextPick" :disabled="!myNextUnmadePick" class="pick-btn"
											rounded>
											{{ t('leagueDraftView.actions.goToMyNextPick') }}
										</v-btn>
										<!-- <v-btn color="warning" variant="tonal" prepend-icon="compress"
											@click="collapsePastRounds"
											:disabled="!hasPastRoundsToCollapse || loadingMoreRounds" class="pick-btn" rounded
											title="Collapse past rounds">
											Collapse Past Rounds
										</v-btn> -->
									</div>
									<div justify="center" align="center">
										<v-btn size="small" variant="tonal" color="info" :aria-label="t('leagueDraftView.actions.refreshAriaLabel')"
											:title="t('leagueDraftView.actions.refreshTitle')" @click="fetchAllData" class="draft-icon-action" :loading="loading" icon>
											<v-icon icon="refresh" />
										</v-btn>
									</div>
								</v-container>
								<v-container v-if="draftData?.is_completed" class="draft-complete text-center">
									<h3 class="text-h3">{{ draftData?.is_league_draft
										? t('leagueDraftView.draft.completeLeague', { year: currentDate.year() })
										: t('leagueDraftView.draft.completeGeneric', { year: currentDate.year() }) }}</h3>
									<p class="text-caption">{{ t('leagueDraftView.draft.completeCaption') }}</p>
								</v-container>
								<!-- Collapsed rounds section - shows divider for collapsed rounds with load button -->
								<v-container v-for="(round, index) in visibleRounds" :key="round.roundNumber"
									class="draft-round">
									<v-row align="center" class="my-4 w-100">
										<v-col class="text-center">
											<v-btn size="small" variant="tonal" color="info"
												@click="loadCollapsedRounds" :loading="loadingMoreRounds"
												:disabled="loadingMoreRounds" class="round-btn mb-4"
												v-if="collapsedRoundsCount > 0 && index === 0"
												:title="t('leagueDraftView.rounds.loadPastRoundsTitle', { count: collapsedRoundsCount }, collapsedRoundsCount)"
												rounded>
												{{ t('leagueDraftView.rounds.loadPastRounds') }}
											</v-btn>
											<labeled-divider>
												<h2 class="text-h5 text-center draft-round-title">{{ t('leagueDraftView.rounds.title', { round: round.roundNumber }) }}</h2>
											</labeled-divider>
										</v-col>
									</v-row>

									<v-row>
										<v-col v-for="pick in round.picks" :key="pick?.pick.id" cols="12" md="6" lg="4">
											<v-card :variant="isDark ? 'elevated' : 'tonal'"
												:color="getPickCardColor(pick?.pick)" class="pa-4 draft-pick-card"
												:id="`pick-${pick?.pick.overall_pick}`" rounded>
												<template #title>
													<div class="d-flex align-center justify-start ga-2">
														<span class="font-weight-black">{{
															pick?.team?.name }}</span>
														<v-icon icon="attribution" size="small" variant="tonal"
															v-if="pick.team.owner_username === authStore.user?.username" />
																<v-icon size="small" icon="smart_toy"
																	v-if="pick?.pick.is_auto_pick" :title="t('leagueDraftView.draft.autoPicked')" />
													</div>
												</template>
												<template #append>
													<player-draft-dialog :player="pick?.pick?.player" :team="pick.team"
														:draftable-players="getDraftablePlayers" :pick="pick?.pick"
														:disabled="!isDraftStarted || (!pick?.pick.is_pick_made && !pick?.pick.is_current)"
														@player-selected="fetchAllData" />
												</template>
												<template #subtitle>
													@{{ pick?.team?.owner_username }}
												</template>
												<template #text>
													{{ t('leagueDraftView.draft.pickLabel') }}
													<h2>#{{ pick?.pick.overall_pick }}</h2>
													<countdown :value="pick?.pick.time_to_pick" :show-progress="false"
														v-if="!pick?.pick.is_pick_made" #label="{ formattedTime }"
														:frozen="!isDraftStarted || !pick?.pick.is_current">
														<span>{{ formattedTime }}</span>
													</countdown>
													<span v-else class="d-flex align-center ga-1 text-weight-bold">{{
														pick?.pick.player.first_name[0] }}. {{
															pick?.pick.player.last_name }}</span>
												</template>
												<template #actions
													v-if="getTeamFuturePicks(pick.team.id, round.roundNumber).length > 0">
													<p>
														<span>{{ t('leagueDraftView.draft.nextPicksLabel') }}</span>
														<v-chip-group column>
															<v-chip
																v-for="futurePick in getTeamFuturePicks(pick.team.id, round.roundNumber)"
																		:key="futurePick.id" size="small" class="future-pick-chip"
																		:title="t('leagueDraftView.draft.futurePickTitle', { round: futurePick.pick__round_number, pick: futurePick.pick_number })"
																@click="navigateToPick(futurePick.overall_pick)">
																#{{ futurePick.overall_pick }}
															</v-chip>
														</v-chip-group>
													</p>
												</template>
											</v-card>
										</v-col>
									</v-row>
								</v-container>

								<!-- Load more rounds section - shows divider for next round with load buttons -->
								<v-container v-if="hasMoreRoundsToLoad" class="my-6 w-100">
									<v-row align="center">
										<v-col>
											<labeled-divider>
														<div class="round-actions d-flex ga-2">
													<v-btn rounded size="small" variant="tonal" color="info"
														@click="loadNextRound" :loading="loadingMoreRounds"
														:disabled="loadingMoreRounds"
														:title="t('leagueDraftView.rounds.loadNextRoundTitle', { round: nextRoundNumber })" class="round-btn">
														{{ t('leagueDraftView.rounds.loadNextRound') }}
													</v-btn>
													<v-btn rounded size="small" variant="tonal" color="info"
														@click="loadAllRounds" :loading="loadingMoreRounds"
														:disabled="loadingMoreRounds" :title="t('leagueDraftView.rounds.loadAllRoundsTitle')"
														class="round-btn">
														{{ t('leagueDraftView.rounds.loadAllRounds') }}
													</v-btn>
												</div>
											</labeled-divider>
										</v-col>
									</v-row>

									<!-- Show loading indicator when loading more rounds -->
									<v-row v-if="loadingMoreRounds" justify="center" class="my-4 w-100">
										<v-col cols="auto">
											<v-progress-circular indeterminate color="primary" size="32" />
										</v-col>
									</v-row>
								</v-container>
							</v-container>
						</v-sheet>
					</v-tabs-window-item>
					<v-dialog v-model="startDialog" max-width="320" persistent>
						<v-list class="py-2" color="primary" elevation="12" rounded="lg">
							<v-list-item :title="t('leagueDraftView.dialog.startingTitle', { action: dialogActionLabel })">
								<template #prepend>
									<app-logo class="mr-4" />
								</template>

								<template #append>
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
import { useThemeStore } from '@/stores/theme';
import dayjs from '@/utils/dayjs';
import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const DraftQueue = defineAsyncComponent(() => import('@/components/core/DraftQueue.vue'))
const PlayerDraftDialog = defineAsyncComponent(() => import('@/components/core/PlayerDraftDialog.vue'))

const { t } = useI18n()
const authStore = useAuthStore()
const isStaff = computed(() => {
	return authStore.user?.is_superuser
})
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

const loading = ref(true)
const startDialog = ref(false)
const dialogAction = ref('draft')
const dialogActionLabel = computed(() => dialogAction.value === 'lottery' ? t('leagueDraftView.dialog.actionLottery') : t('leagueDraftView.dialog.actionDraft'))
const draftData = ref(null)
const teamsData = ref(null)
const lotteryData = ref(null)
const currentDate = dayjs()
const lotteryStartsAt = dayjs.tz('2025-07-18 12:00:00', 'America/Sao_Paulo').unix()

// New reactive refs for round loading functionality
const showRoundsUpTo = ref(1)
const showRoundsFrom = ref(0)
const loadingMoreRounds = ref(false)
const hasSetInitialRoundsFrom = ref(false)

const isLotteryHappened = computed(() => {
	return lotteryData.value && Object.keys(lotteryData.value).length > 0
})
const tab = ref(isLotteryHappened.value ? 'draft' : 'lottery')

const isDraftStarted = computed(() => {
	return isLotteryHappened.value && draftData.value && dayjs(draftData.value.starts_at).isSameOrBefore(currentDate)
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
			picks: picks.sort((a, b) => a?.pick.pick_number - b?.pick.pick_number)
		}))
		.sort((a, b) => a.roundNumber - b.roundNumber)
})

// Show only visible rounds
const visibleRounds = computed(() => {
	return draftRounds.value.slice(showRoundsFrom.value, showRoundsUpTo.value)
})

// Computed property to check if there are more rounds to load
const hasMoreRoundsToLoad = computed(() => {
	return showRoundsUpTo.value < draftRounds.value.length
})

// Computed property for the next round number to display in the load divider
const nextRoundNumber = computed(() => {
	return showRoundsUpTo.value + 1
})

const hasPastRoundsToCollapse = computed(() => {
	return showRoundsFrom.value > 0
})

const collapsedRoundsCount = computed(() => {
	return showRoundsFrom.value
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
	return allPicksSorted.value.find(pickData => pickData?.pick.is_current)
})

const myNextUnmadePick = computed(() => {
	if (!authStore.user) return null
	return allPicksSorted.value.find(pickData =>
		!pickData?.pick.is_pick_made &&
		pickData.team.owner_username === authStore.user.username
	)
})

watch(showRoundsUpTo, (newValue) => {
	if (!hasSetInitialRoundsFrom.value) {
		showRoundsFrom.value = Math.max(0, newValue - 2)
		hasSetInitialRoundsFrom.value = true
	}
}, { immediate: true })

// Watch for changes in nextUnmadePick to auto-adjust visible rounds
watch(nextUnmadePick, (newPick) => {
	if (newPick && draftRounds.value.length > 0) {
		const currentRound = newPick?.pick.pick__round_number
		// Ensure we show at least up to the current round
		if (currentRound > showRoundsUpTo.value) {
			showRoundsUpTo.value = currentRound
		}
	}
}, { immediate: true })

// Methods for loading more rounds
const loadNextRound = async () => {
	if (hasMoreRoundsToLoad.value) {
		loadingMoreRounds.value = true
		showRoundsUpTo.value += 1
		await nextTick()
		loadingMoreRounds.value = false
	}
}

const loadAllRounds = async () => {
	if (hasMoreRoundsToLoad.value) {
		loadingMoreRounds.value = true
		showRoundsFrom.value = 0
		showRoundsUpTo.value = draftRounds.value.length
		await nextTick()
		loadingMoreRounds.value = false
	}
}

const collapsePastRounds = async () => {
	if (showRoundsFrom.value < showRoundsUpTo.value) {
		loadingMoreRounds.value = true

		// Collapse up to the round before the current pick, but keep at least 1 round visible
		if (nextUnmadePick.value) {
			const currentRound = nextUnmadePick.value?.pick.pick__round_number
			showRoundsFrom.value = Math.max(0, Math.min(currentRound - 1, showRoundsUpTo.value - 1))
		} else {
			showRoundsFrom.value = Math.min(showRoundsFrom.value + 1, showRoundsUpTo.value)
		}

		await nextTick()
		loadingMoreRounds.value = false
	}
}

const loadCollapsedRounds = async () => {
	if (hasPastRoundsToCollapse.value) {
		loadingMoreRounds.value = true
		showRoundsFrom.value = 0
		await nextTick()
		loadingMoreRounds.value = false
	}
}

const getTeamFuturePicks = (teamId: number, currentRound: number) => {
	if (!lotteryData.value || !lotteryData.value[teamId]) return []

	return lotteryData.value[teamId].filter(pick => pick.pick__round_number > currentRound)
}

const getDraftablePlayers = computed(() => {
	if (!draftData.value) return []
	return draftData.value.draftable_players.filter(player => !player.team.id)
})

const fetchTeamsData = async () => {
	const response = await api.get("/teams/")
	teamsData.value = response.data.results
}

const fetchDraftData = async () => {
	const response = await api.get(`/drafts/?year=${currentDate.year()}&is_league_draft=true`)
	draftData.value = response.data.results[0]
	if (draftData.value?.is_completed) {
		// loadAllRounds()
		showRoundsFrom.value = 0
	}
}

const fetchLotteryData = async () => {
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
	tab.value = isLotteryHappened.value ? 'draft' : 'lottery'
	loading.value = false
}

const startLottery = async () => {
	try {
		dialogAction.value = 'lottery'
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
		await fetchAllData()
		startDialog.value = false
	}
}

const startDraft = async () => {
	if (!isStaff.value) return
	dialogAction.value = 'draft'
	startDialog.value = true
	fetchDraftData()
	startDialog.value = false
	return;
}

const navigateToPick = async (overallPick: number) => {
	// Find the pick to determine its round
	const targetPick = allPicksSorted.value.find(pickData =>
		pickData?.pick.overall_pick === overallPick
	)

	if (!targetPick) return

	const targetRound = targetPick?.pick.pick__round_number

	// Check if we need to load more rounds to show this pick
	if (targetRound > showRoundsUpTo.value) {
		loadingMoreRounds.value = true
		showRoundsUpTo.value = targetRound
		await nextTick()
		loadingMoreRounds.value = false
	}
	await nextTick()

	const pickElement = document.getElementById(`pick-${overallPick}`)

	if (pickElement) {
		pickElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
		pickElement.classList.add('animate__animated', 'animate__tada')

		setTimeout(() => {
			pickElement.classList.remove('animate__animated', 'animate__tada')
		}, 2000)
	}
}

const goToNextPick = () => {
	if (nextUnmadePick.value) {
		navigateToPick(nextUnmadePick.value?.pick.overall_pick)
	}
}

const goToMyNextPick = () => {
	if (myNextUnmadePick.value) {
		navigateToPick(myNextUnmadePick.value?.pick.overall_pick)
	}
}

const getPickCardColor = (pick: any) => {
	if (!isDraftStarted.value) return 'primary'
	if (pick.is_pick_made) return 'success'
	if (pick.is_auto_pick) return 'error'
	if (pick.is_current && myNextUnmadePick.value === nextUnmadePick.value) return 'warning'
	if (pick.is_current) return 'info'
	return 'primary'
}

const fetchAllData = async () => {
	loading.value = true
	await Promise.all([
		fetchTeamsData(),
		fetchDraftData(),
	]).then(() => {
		fetchLotteryData()
	})
}

onMounted(() => {
	fetchAllData()
})
</script>

<style lang="scss" scoped>
.draft-header {
	max-width: 760px;
}

.draft-workspace {
	overflow: hidden;
	border: 1px solid var(--surface-border);
	border-radius: $border-radius-xl;
	background: rgb(var(--v-theme-surface));
	box-shadow: $shadow-md;
}

.draft-tabs {
	border-bottom: 1px solid var(--surface-border);
	background: rgba(var(--v-theme-primary), 0.18);

	:deep(.v-tab) {
		min-height: 54px;
		font-weight: 700;
		letter-spacing: 0.02em;
	}
}

.draft-workspace__body {
	padding: clamp(16px, 3vw, 28px);
}

.draft-surface {
	background: transparent;
}

.draft-state,
.draft-control,
.draft-complete {
	margin-bottom: 20px;
	padding: clamp(24px, 5vw, 44px);
	border: 1px solid var(--surface-border);
	border-radius: $border-radius-lg;
	background: rgba(var(--v-theme-on-surface), 0.025);
}

.draft-team-card,
.draft-pick-card {
	border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
	box-shadow: none;
}

.draft-pick-card {
	scroll-margin-top: 96px;
}

.draft-workspace :deep(.v-card-title) {
	white-space: normal;
	overflow-wrap: anywhere;
}

.draft-round {
	padding-right: 0;
	padding-left: 0;
}

.draft-complete .text-h3 {
	font-size: clamp(1.65rem, 5vw, 3rem) !important;
	line-height: 1.12;
}

.pick-btn {
	width: 200px;
	min-height: 44px;
}

.round-btn {
	width: 150px;
	min-height: 44px;
}

.draft-icon-action {
	width: 44px;
	height: 44px;
}

.draft-round-title {
	color: rgb(var(--v-theme-on-surface));
}

.draft-workspace :deep(.future-pick-chip) {
	min-width: 44px;
	min-height: 44px;
}

@media (max-width: $breakpoint-sm) {
	.draft-workspace__body {
		padding: 14px 12px 18px;
	}

	.draft-state,
	.draft-control,
	.draft-complete {
		padding: 22px 16px;
	}

	.draft-actions,
	.round-actions {
		width: 100%;
	}

	.pick-btn,
	.round-btn {
		width: 100%;
	}

	.round-actions {
		flex-direction: column;
	}
}
</style>
