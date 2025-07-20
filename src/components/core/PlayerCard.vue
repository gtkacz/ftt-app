<template>
	<v-card class="nba-player-card px-2" :class="teamColorClass" elevation="8" max-width="19vw" height="10vh">
		<!-- Header with team info -->
		<div class="card-header">
			<div class="team-info">
				<span class="team-city">{{ player?.real_team?.city }}</span>
				<span class="team-name">{{ player?.real_team?.name || 'NBA' }}</span>
			</div>
			<nba-team-icon :team="player?.real_team?.abbreviation" size="40" />
		</div>

		<!-- Player photo section -->
		<div class="photo-section">
			<v-img :src="player?.photo" :alt="`${player?.first_name} ${player?.last_name}`" class="player-photo"
				height="220" cover>
				<template v-slot:error>
					<div class="photo-placeholder">
						<v-icon size="64" color="white" icon="account" />
					</div>
				</template>
			</v-img>

			<!-- Position badge -->
			<v-chip class="position-chip" size="small" color="primary" variant="elevated">
				{{ formatPosition(player?.primary_position, player?.secondary_position) }}
			</v-chip>
		</div>

		<!-- Player info -->
		<v-card-text class="player-info">
			<h2 class="player-name">
				{{ player?.first_name }} {{ player?.last_name }}
			</h2>

			<!-- Physical stats -->
			<div class="physical-stats">
				<span class="stat-item">
					<strong>{{ playerMetadata?.HEIGHT || 'N/A' }}</strong>
				</span>
				<span class="stat-divider">•</span>
				<span class="stat-item">
					<strong>{{ playerMetadata?.WEIGHT ? `${playerMetadata.WEIGHT} lbs` : 'N/A' }}</strong>
				</span>
			</div>

			<!-- Performance stats -->
			<div class="performance-stats">
				<div class="stat-box">
					<div class="stat-value">{{ playerMetadata?.PTS || '0' }}</div>
					<div class="stat-label">PPG</div>
				</div>
				<div class="stat-box">
					<div class="stat-value">{{ playerMetadata?.REB || '0' }}</div>
					<div class="stat-label">RPG</div>
				</div>
				<div class="stat-box">
					<div class="stat-value">{{ playerMetadata?.AST || '0' }}</div>
					<div class="stat-label">APG</div>
				</div>
			</div>

			<!-- Contract info -->
			<div class="contract-info">
				<v-chip size="small" variant="tonal" class="salary-chip">
					{{ formatCurrency(pick.contract?.salary) }}
				</v-chip>
				<v-chip size="small" variant="tonal" class="salary-chip">
					{{ pick.contract?.duration }}
					<word item="yr" :count="pick.contract?.duration" />
				</v-chip>
			</div>

			<!-- Draft info -->
			<div class="draft-info" v-if="pick?.contract?.start_year">
				<span class="draft-text">
					{{ pick?.contract?.start_year }} Draft • Round {{ pick?.pick__round_number }} • Pick {{
						pick?.pick_number }}
				</span>
			</div>
		</v-card-text>

		<v-card-actions v-if="props.canDraft" class="d-flex justify-center align-center flex-column mb-6 mx-3">
			<v-spacer />
			<v-btn variant="tonal" class="w-100" color="surface" rounded @click="onDraftConfirm" v-confirm>
				Draft Player
			</v-btn>
		</v-card-actions>
	</v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import NbaTeamIcon from './NBATeamIcon.vue'

const emit = defineEmits(['draft'])

interface TeamData {
	id: number
	city: string
	name: string
	abbreviation: string
}

interface PlayerMetadata {
	JERSEY_NUMBER?: string
	HEIGHT?: string
	WEIGHT?: string
	PTS?: number
	REB?: number
	AST?: number
	DRAFT_YEAR?: number
	DRAFT_ROUND?: number
	DRAFT_NUMBER?: number
	COLLEGE?: string
	COUNTRY?: string
}

interface Player {
	id: number
	photo: string
	real_team?: TeamData
	first_name: string
	last_name: string
	primary_position: string
	secondary_position?: string
	metadata?: string
}

interface Contract {
	id: number
	start_year: number
	duration: number
	salary: number
	is_restrictedfreeagent: boolean
	is_teamoption: boolean
}

interface Pick {
	overall_pick: number
	pick_number: number
	pick__round_number: number
	is_auto_pick: number
	contract: Contract
}

interface Props {
	player: Player
	pick: Pick
	canDraft: boolean
}

const props = withDefaults(defineProps<Props>(), {
	canDraft: false
})

const playerMetadata = computed<PlayerMetadata | null>(() => {
	if (!props.player?.metadata) return null
	try {
		return JSON.parse(props.player?.metadata)
	} catch {
		return null
	}
})

const teamColorClass = computed(() => {
	const teamAbbr = props.player?.real_team?.abbreviation
	return teamAbbr ? `team-${teamAbbr.toLowerCase()}` : 'team-default'
})

const formatPosition = (primary: string, secondary?: string) => {
	if (!secondary) return primary
	return `${primary}/${secondary}`
}

const formatCurrency = (amount) => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount * 1000000)
}

const onDraftConfirm = () => {
	emit('draft', props.player.id)
}
</script>

<style lang="scss" scoped>
.nba-player-card {
	position: relative;
	background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
	border-radius: 16px !important;
	overflow: hidden;
	transition: all 0.3s ease;

	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
	}

	// Team-specific color schemes
	// NBA Teams - Official Colors in SCSS Format

	&.team-atl {
		background: linear-gradient(135deg, #E03A3E 0%, #C1D32F 100%);
	}

	&.team-bos {
		background: linear-gradient(135deg, #007A33 0%, #BA9653 100%);
	}

	&.team-bkn {
		background: linear-gradient(135deg, #000000 0%, #FFFFFF 100%);
	}

	&.team-cha {
		background: linear-gradient(135deg, #1D1160 0%, #00788C 100%);
	}

	&.team-chi {
		background: linear-gradient(135deg, #CE1141 0%, #000000 100%);
	}

	&.team-cle {
		background: linear-gradient(135deg, #860038 0%, #041E42 100%);
	}

	&.team-dal {
		background: linear-gradient(135deg, #00538C 0%, #002B5E 100%);
	}

	&.team-den {
		background: linear-gradient(135deg, #0E2240 0%, #FEC524 100%);
	}

	&.team-det {
		background: linear-gradient(135deg, #C8102E 0%, #1D42BA 100%);
	}

	&.team-gsw {
		background: linear-gradient(135deg, #1D428A 0%, #FFC72C 100%);
	}

	&.team-hou {
		background: linear-gradient(135deg, #CE1141 0%, #000000 100%);
	}

	&.team-ind {
		background: linear-gradient(135deg, #002D62 0%, #FDBB30 100%);
	}

	&.team-lac {
		background: linear-gradient(135deg, #C8102E 0%, #1D428A 100%);
	}

	&.team-lal {
		background: linear-gradient(135deg, #552583 0%, #FDB927 100%);
	}

	&.team-mem {
		background: linear-gradient(135deg, #5D76A9 0%, #12173F 100%);
	}

	&.team-mia {
		background: linear-gradient(135deg, #98002E 0%, #F9A01B 100%);
	}

	&.team-mil {
		background: linear-gradient(135deg, #00471B 0%, #EEE1C6 100%);
	}

	&.team-min {
		background: linear-gradient(135deg, #0C2340 0%, #236192 100%);
	}

	&.team-nop {
		background: linear-gradient(135deg, #0C2340 0%, #C8102E 100%);
	}

	&.team-nyk {
		background: linear-gradient(135deg, #006BB6 0%, #F58426 100%);
	}

	&.team-okc {
		background: linear-gradient(135deg, #007AC1 0%, #EF3B24 100%);
	}

	&.team-orl {
		background: linear-gradient(135deg, #0077C0 0%, #C4CED4 100%);
	}

	&.team-phi {
		background: linear-gradient(135deg, #006BB6 0%, #ED174C 100%);
	}

	&.team-phx {
		background: linear-gradient(135deg, #1D1160 0%, #E56020 100%);
	}

	&.team-por {
		background: linear-gradient(135deg, #E03A3E 0%, #000000 100%);
	}

	&.team-sac {
		background: linear-gradient(135deg, #5A2D81 0%, #63727A 100%);
	}

	&.team-sas {
		background: linear-gradient(135deg, #C4CED4 0%, #000000 100%);
	}

	&.team-tor {
		background: linear-gradient(135deg, #CE1141 0%, #000000 100%);
	}

	&.team-uta {
		background: linear-gradient(135deg, #002B5C 0%, #00471B 100%);
	}

	&.team-was {
		background: linear-gradient(135deg, #002B5C 0%, #E31837 100%);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px 8px;
		color: white;

		.team-info {
			display: flex;
			flex-direction: column;

			.team-name {
				font-size: 1.1rem;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 1px;
			}

			.team-city {
				font-size: 0.85rem;
				opacity: 0.9;
				font-weight: 500;
			}
		}

		.jersey-number {
			font-size: 2rem;
			font-weight: 900;
			text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
			background: rgba(255, 255, 255, 0.2);
			padding: 4px 12px;
			border-radius: 8px;
			backdrop-filter: blur(10px);
		}
	}

	.photo-section {
		position: relative;
		margin: 0 20px;
		border-radius: 12px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);

		.player-photo {
			border-radius: 12px;
		}

		.photo-placeholder {
			display: flex;
			align-items: center;
			justify-content: center;
			height: 100%;
			background: rgba(255, 255, 255, 0.1);
		}

		.position-chip {
			position: absolute;
			top: 12px;
			right: 12px;
			font-weight: 700;
			letter-spacing: 0.5px;
		}
	}

	.player-info {
		padding: 20px !important;
		color: white;

		.player-name {
			font-size: 1.5rem;
			font-weight: 800;
			text-align: center;
			margin-bottom: 8px;
			text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		.physical-stats {
			display: flex;
			justify-content: center;
			align-items: center;
			margin-bottom: 16px;
			font-size: 0.9rem;
			opacity: 0.9;

			.stat-divider {
				margin: 0 8px;
				opacity: 0.7;
			}
		}

		.performance-stats {
			display: flex;
			justify-content: space-around;
			margin-bottom: 16px;
			background: rgba(255, 255, 255, 0.1);
			border-radius: 8px;
			padding: 12px;
			backdrop-filter: blur(10px);

			.stat-box {
				text-align: center;

				.stat-value {
					font-size: 1.2rem;
					font-weight: 700;
					line-height: 1;
				}

				.stat-label {
					font-size: 0.75rem;
					opacity: 0.8;
					text-transform: uppercase;
					letter-spacing: 0.5px;
					margin-top: 1px;
				}
			}
		}

		.contract-info {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 12px;

			.salary-chip {
				font-weight: 700;
			}

			.contract-details {
				font-size: 0.85rem;
				opacity: 0.9;
				font-weight: 500;
			}
		}

		.draft-info {
			text-align: center;
			font-size: 0.75rem;
			opacity: 0.8;
			background: rgba(255, 255, 255, 0.1);
			padding: 8px;
			border-radius: 6px;
			backdrop-filter: blur(10px);

			.draft-text {
				text-transform: uppercase;
				letter-spacing: 0.5px;
				font-weight: 500;
			}
		}
	}
}

// Responsive adjustments
@media (max-width: 600px) {
	.nba-player-card {
		max-width: 280px;
		height: 400px;

		.card-header {
			padding: 12px 16px 6px;

			.jersey-number {
				font-size: 1.5rem;
				padding: 2px 8px;
			}
		}

		.photo-section {
			margin: 0 16px;
		}

		.player-info {
			padding: 16px !important;

			.player-name {
				font-size: 1.3rem;
			}
		}
	}
}
</style>