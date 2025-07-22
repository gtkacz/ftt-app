<template>
  <v-progress-circular v-if="loading" indeterminate color="primary" />
  <v-container v-else fluid class="dashboard-container">
    <!-- Team Header -->
    <v-row>
      <v-col cols="12">
        <v-card class="team-header" elevation="4">
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar size="80" class="me-4">
                <v-img :src="teamData.avatar || defaultAvatar" alt="Team Avatar"></v-img>
              </v-avatar>
              <div>
                <h1 class="text-h3 font-weight-bold text-white">{{ teamData.name }}</h1>
                <p class="text-h6 text-grey-lighten-2">{{ teamData.owner_username }}</p>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Overview Cards -->
    <v-row class="my-4">
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="3" class="stat-card">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <v-card-subtitle class="pa-0">Total Players</v-card-subtitle>
                <v-card-title class="pa-0 text-h4">{{ teamData.total_players }}</v-card-title>
                <v-chip color="success" variant="tonal" size="small">
                  {{ teamData.available_players }} slots available
                </v-chip>
              </div>
              <v-icon color="primary" size="40">group</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card elevation="3" class="stat-card">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <v-card-subtitle class="pa-0">Total Salary</v-card-subtitle>
                <v-card-title class="pa-0 text-h4">${{ teamData.total_salary }}M</v-card-title>
                <v-chip :color="teamData.available_salary > 0 ? 'success' : 'error'" variant="tonal" size="small">
                  ${{ teamData.available_salary }}M available
                </v-chip>
              </div>
              <v-icon color="green" size="40">attach_money</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card elevation="3" class="stat-card">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <v-card-subtitle class="pa-0">Total Fantasy Points</v-card-subtitle>
                <v-card-title class="pa-0 text-h4">{{ currentStats.totalFantasyPoints.toFixed(1) }}</v-card-title>
                <v-chip color="info" variant="tonal" size="small">
                  {{ currentStats.avgFantasyPoints.toFixed(1) }} avg
                </v-chip>
              </div>
              <v-icon color="purple" size="40">trophy</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card elevation="3" class="stat-card">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <v-card-subtitle class="pa-0">Team Efficiency</v-card-subtitle>
                <v-card-title class="pa-0 text-h4">{{ efficiencyStats.fptsPerMillion.toFixed(1) }}</v-card-title>
                <v-chip color="orange" variant="tonal" size="small">FPTS per $M</v-chip>
              </div>
              <v-icon color="orange" size="40">chart_data</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Position Breakdown with Cap Percentages -->
      <v-col cols="12" lg="6">
        <v-card elevation="3">
          <v-card-title>
            <v-icon class="me-2">sports_basketball</v-icon>
            Position Breakdown
          </v-card-title>
          <v-card-text>
            <v-row v-for="position in positionStats" :key="position.name" class="mb-4">
              <v-col cols="12">
                <div class="d-flex justify-space-between align-center mb-2">
                  <v-chip :color="position.color" variant="tonal">
                    {{ position.name }} ({{ position.count }})
                  </v-chip>
                  <v-chip color="primary" variant="outlined" size="small">
                    {{ position.capPercentage }}% of cap
                  </v-chip>
                </div>

                <v-row class="text-body-2">
                  <v-col cols="3">
                    <strong>Salary:</strong><br>
                    ${{ position.totalSalary.toFixed(1) }}M
                  </v-col>
                  <v-col cols="3">
                    <strong>Avg Salary:</strong><br>
                    ${{ position.avgSalary.toFixed(1) }}M
                  </v-col>
                  <v-col cols="3">
                    <strong>FPTS:</strong><br>
                    {{ position.totalFantasyPoints.toFixed(1) }}
                  </v-col>
                  <v-col cols="3">
                    <strong>Efficiency:</strong><br>
                    {{ position.efficiency.toFixed(1) }}
                  </v-col>
                </v-row>

                <v-progress-linear :model-value="(position.count / teamData.total_players) * 100"
                  :color="position.color" height="6" class="mt-2 rounded">
                </v-progress-linear>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Top Contributors -->
      <v-col cols="12" lg="6">
        <v-card elevation="3">
          <v-card-title>
            <v-icon class="me-2">star</v-icon>
            Top Contributors
          </v-card-title>
          <v-card-text>
            <v-expansion-panels variant="accordion">
              <v-expansion-panel title="Team Leaders">
                <v-expansion-panel-text>
                  <v-list density="compact">
                    <v-list-item v-for="(player, index) in topContributors.team" :key="player.id">
                      <template v-slot:prepend>
                        <v-avatar size="30">{{ index + 1 }}</v-avatar>
                      </template>
                      <v-list-item-title>{{ player.first_name }} {{ player.last_name }}</v-list-item-title>
                      <v-list-item-subtitle>{{ player.fpts.toFixed(1) }} FPTS</v-list-item-subtitle>
                      <template v-slot:append>
                        <v-chip size="small" :color="getPositionColor(player.primary_position)">
                          {{ player.primary_position }}
                        </v-chip>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel v-for="pos in ['G', 'F', 'C']" :key="pos" :title="`${getPositionName(pos)} Leaders`">
                <v-expansion-panel-text>
                  <v-list density="compact">
                    <v-list-item v-for="(player, index) in topContributors.byPosition[pos]" :key="player.id">
                      <template v-slot:prepend>
                        <v-avatar size="30">{{ index + 1 }}</v-avatar>
                      </template>
                      <v-list-item-title>{{ player.first_name }} {{ player.last_name }}</v-list-item-title>
                      <v-list-item-subtitle>{{ player.fpts.toFixed(1) }} FPTS</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="topContributors.byPosition[pos].length === 0">
                      <v-list-item-title class="text-grey">No {{ getPositionName(pos).toLowerCase() }} on
                        roster</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Contract Analysis -->
    <v-row class="mt-4">
      <v-col cols="12" lg="6">
        <v-card elevation="3">
          <v-card-title>
            <v-icon class="me-2">contract</v-icon>
            Contract Status
          </v-card-title>
          <v-card-text>
            <v-row class="mb-3">
              <v-col cols="6">
                <v-card variant="outlined">
                  <v-card-text class="text-center">
                    <div class="text-h4 text-success">{{ contractStats.rosterReturning.toFixed(1) }}%</div>
                    <div class="text-caption">Roster Returning</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6">
                <v-card variant="outlined">
                  <v-card-text class="text-center">
                    <div class="text-h4 text-error">{{ contractStats.rosterExpiring.toFixed(1) }}%</div>
                    <div class="text-caption">Roster Expiring</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-divider class="my-3"></v-divider>

            <div class="mb-3">
              <div class="d-flex justify-space-between mb-2">
                <span>Expiring {{ currentYear }}:</span>
                <v-chip color="error" variant="tonal" size="small">{{ contractStats.expiring2025 }} players</v-chip>
              </div>
              <v-progress-linear :model-value="(contractStats.expiring2025 / teamData.total_players) * 100"
                color="error" height="4">
              </v-progress-linear>
            </div>

            <div class="mb-3">
              <div class="d-flex justify-space-between mb-2">
                <span>Expiring {{ currentYear + 1 }}:</span>
                <v-chip color="warning" variant="tonal" size="small">{{ contractStats.expiring2026 }} players</v-chip>
              </div>
              <v-progress-linear :model-value="(contractStats.expiring2026 / teamData.total_players) * 100"
                color="warning" height="4">
              </v-progress-linear>
            </div>

            <div class="mb-3">
              <div class="d-flex justify-space-between mb-2">
                <span>Long-term (3+ years):</span>
                <v-chip color="success" variant="tonal" size="small">{{ contractStats.longTerm }} players</v-chip>
              </div>
              <v-progress-linear :model-value="(contractStats.longTerm / teamData.total_players) * 100" color="success"
                height="4">
              </v-progress-linear>
            </div>

            <v-row class="mt-3">
              <v-col cols="6">
                <div class="d-flex justify-space-between">
                  <span>RFA Players:</span>
                  <v-chip color="info" variant="tonal" size="small">{{ contractStats.rfa }}</v-chip>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="d-flex justify-space-between">
                  <span>Team Options:</span>
                  <v-chip color="purple" variant="tonal" size="small">{{ contractStats.teamOptions }}</v-chip>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Expiring Players List -->
      <v-col cols="12" lg="6">
        <v-card elevation="3">
          <v-card-title>
            <v-icon class="me-2">calendar_clock</v-icon>
            Expiring Contracts
          </v-card-title>
          <v-card-text>
            <v-expansion-panels variant="accordion">
              <v-expansion-panel :title="`${currentYear} Expiring (${expiringPlayers.thisYear.length})`">
                <v-expansion-panel-text>
                  <v-list density="compact">
                    <v-list-item v-for="player in expiringPlayers.thisYear" :key="player.id">
                      <v-list-item-title>{{ player.first_name }} {{ player.last_name }}</v-list-item-title>
                      <v-list-item-subtitle>${{ player.contract.salary }}M</v-list-item-subtitle>
                      <template v-slot:append>
                        <v-chip size="small" :color="getPositionColor(player.primary_position)">
                          {{ player.primary_position }}
                        </v-chip>
                      </template>
                    </v-list-item>
                    <v-list-item v-if="expiringPlayers.thisYear.length === 0">
                      <v-list-item-title class="text-grey">No players expiring this year</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel :title="`${currentYear + 1} Expiring (${expiringPlayers.nextYear.length})`">
                <v-expansion-panel-text>
                  <v-list density="compact">
                    <v-list-item v-for="player in expiringPlayers.nextYear" :key="player.id">
                      <v-list-item-title>{{ player.first_name }} {{ player.last_name }}</v-list-item-title>
                      <v-list-item-subtitle>${{ player.contract.salary }}M</v-list-item-subtitle>
                      <template v-slot:append>
                        <v-chip size="small" :color="getPositionColor(player.primary_position)">
                          {{ player.primary_position }}
                        </v-chip>
                      </template>
                    </v-list-item>
                    <v-list-item v-if="expiringPlayers.nextYear.length === 0">
                      <v-list-item-title class="text-grey">No players expiring next year</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Future Projections -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card elevation="3">
          <v-card-title>
            <v-icon class="me-2">event_upcoming</v-icon>
            Future Projections
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col v-for="season in futureSeasons" :key="season.year" cols="12" sm="6" md="4">
                <v-card variant="outlined" class="h-100">
                  <v-card-title class="text-h6">{{ season.year }} Season</v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>Players:</v-list-item-title>
                        <template v-slot:append>
                          <strong>{{ season.players }}</strong>
                        </template>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Salary Committed:</v-list-item-title>
                        <template v-slot:append>
                          <strong>${{ season.salaryCommitted.toFixed(1) }}M</strong>
                        </template>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Available Cap:</v-list-item-title>
                        <template v-slot:append>
                          <strong :class="season.availableCap > 0 ? 'text-success' : 'text-error'">
                            ${{ season.availableCap.toFixed(1) }}M
                          </strong>
                        </template>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>Draft Picks:</v-list-item-title>
                        <template v-slot:append>
                          <strong>{{ season.picks }}</strong>
                        </template>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Draft Capital and Team Metrics -->
    <v-row class="mt-4">
      <v-col cols="12" lg="6">
        <v-card elevation="3">
          <v-card-title>
            <v-icon class="me-2">child_care</v-icon>
            Draft Capital
          </v-card-title>
          <v-card-text>
            <div v-for="year in Object.keys(draftPicks).sort()" :key="year" class="mb-4">
              <div class="d-flex justify-space-between align-center mb-2">
                <v-card-subtitle class="pa-0 text-h6">{{ year }} Draft</v-card-subtitle>
                <v-chip color="primary" variant="tonal">
                  {{ draftPicks[year].length }} picks
                </v-chip>
              </div>

              <v-row>
                <v-col v-for="pick in draftPicks[year]" :key="`${year}-${pick.round_number}`" cols="12">
                  <v-card variant="outlined">
                    <v-card-text class="py-2">
                      <div class="d-flex justify-space-between align-center">
                        <div>
                          <v-chip
                            :color="pick.round_number === 1 ? 'success' : pick.round_number === 2 ? 'warning' : 'info'"
                            variant="tonal" size="small">
                            Round {{ pick.round_number }}{{ pick.protections ? '*' : '' }}
                          </v-chip>
                        </div>
                        <div class="text-body-2">
                          <strong>From:</strong> {{ pick.original_team_name }}
                          <div v-if="pick.protections" class="text-caption text-grey">
                            {{ pick.protections }}
                          </div>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
            <v-alert v-if="Object.keys(draftPicks).length === 0" type="info" variant="tonal">
              No upcoming draft picks
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Advanced Team Metrics -->
      <v-col cols="12" lg="6">
        <v-card elevation="3">
          <v-card-title>
            <v-icon class="me-2">analytics</v-icon>
            Advanced Metrics
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <v-card variant="outlined">
                  <v-card-text class="text-center">
                    <div class="text-h5">{{ efficiencyStats.salaryCapUtilization.toFixed(1) }}%</div>
                    <div class="text-caption">Cap Utilization</div>
                    <v-progress-linear :model-value="efficiencyStats.salaryCapUtilization"
                      :color="efficiencyStats.salaryCapUtilization > 90 ? 'error' : efficiencyStats.salaryCapUtilization > 75 ? 'warning' : 'success'"
                      height="4" class="mt-2">
                    </v-progress-linear>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="6">
                <v-card variant="outlined">
                  <v-card-text class="text-center">
                    <div class="text-h5">{{ efficiencyStats.rosterUtilization.toFixed(1) }}%</div>
                    <div class="text-caption">Roster Utilization</div>
                    <v-progress-linear :model-value="efficiencyStats.rosterUtilization" color="info" height="4"
                      class="mt-2">
                    </v-progress-linear>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12">
                <v-divider class="my-2"></v-divider>
              </v-col>

              <v-col cols="6">
                <v-list-item class="px-0">
                  <v-list-item-title>IR Players:</v-list-item-title>
                  <template v-slot:append>
                    <v-chip color="error" variant="tonal" size="small">{{ currentStats.irPlayers }}</v-chip>
                  </template>
                </v-list-item>
              </v-col>

              <v-col cols="6">
                <v-list-item class="px-0">
                  <v-list-item-title>Avg Age:</v-list-item-title>
                  <template v-slot:append>
                    <v-chip color="info" variant="tonal" size="small">{{ teamMetrics.avgAge.toFixed(1) }} yrs</v-chip>
                  </template>
                </v-list-item>
              </v-col>

              <v-col cols="6">
                <v-list-item class="px-0">
                  <v-list-item-title>Experience:</v-list-item-title>
                  <template v-slot:append>
                    <v-chip color="purple" variant="tonal" size="small">{{ teamMetrics.avgExperience.toFixed(1) }}
                      yrs</v-chip>
                  </template>
                </v-list-item>
              </v-col>

              <v-col cols="6">
                <v-list-item class="px-0">
                  <v-list-item-title>Value Rating:</v-list-item-title>
                  <template v-slot:append>
                    <v-chip :color="getValueRatingColor(teamMetrics.valueRating)" variant="tonal" size="small">
                      {{ teamMetrics.valueRating }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import api from '@/api/axios';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const loading = ref(false);
const route = useRoute();
const teamId = route.params.id as string;

interface Player {
  id: number
  first_name: string
  last_name: string
  primary_position: 'G' | 'F' | 'C'
  secondary_position?: 'G' | 'F' | 'C'
  is_ir: boolean
  metadata: string
  contract: {
    id: number
    player: number
    team: number
    start_year: number
    duration: number
    salary: number
    is_rfa: boolean
    is_to: boolean
  }
}

interface Pick {
  id: number
  original_team_name: string
  current_team_name: string
  draft_year: number
  round_number: number
  protections?: string | null
  is_from_league_draft: boolean
}

interface TeamData {
  id: number
  name: string
  owner_username: string
  total_salary: number
  total_players: number
  available_salary: number
  available_players: number
  can_bid: boolean
  avatar: string | null
  players: Player[]
  current_picks: Pick[]
}

const SALARY_CAP = 130
const MIN_PLAYERS = 12
const MAX_PLAYERS = 15

const teamData = ref<TeamData>({
  id: 2,
  name: "The Meme Team",
  owner_username: "gtkacz",
  total_salary: 80.5,
  total_players: 5,
  available_salary: 49.5,
  available_players: 10,
  can_bid: true,
  avatar: null,
  players: [],
  current_picks: []
})

const defaultAvatar = "https://raw.githubusercontent.com/gtkacz/ftt-app/refs/heads/main/src/assets/logo.png"
const currentYear = new Date().getFullYear()

// Helper functions
const getFantasyPoints = (metadata: string): number => {
  try {
    const parsed = JSON.parse(metadata)
    return Number(parsed.fpts) || 0
  } catch {
    return 0
  }
}

const getPlayerAge = (metadata: string): number => {
  try {
    const parsed = JSON.parse(metadata)
    const draftYear = parsed.DRAFT_YEAR || currentYear - 5
    return currentYear - draftYear + 20 // Approximate age
  } catch {
    return 25
  }
}

const getPlayerExperience = (metadata: string): number => {
  try {
    const parsed = JSON.parse(metadata)
    const fromYear = parseInt(parsed.FROM_YEAR) || currentYear - 3
    return currentYear - fromYear
  } catch {
    return 3
  }
}

const getPositionColor = (position: string): string => {
  switch (position) {
    case 'G': return 'blue'
    case 'F': return 'green'
    case 'C': return 'red'
    default: return 'grey'
  }
}

const getPositionName = (position: string): string => {
  switch (position) {
    case 'G': return 'Guards'
    case 'F': return 'Forwards'
    case 'C': return 'Centers'
    default: return position
  }
}

const getValueRatingColor = (rating: string): string => {
  switch (rating) {
    case 'A': return 'success'
    case 'B': return 'info'
    case 'C': return 'warning'
    case 'D': return 'error'
    default: return 'grey'
  }
}

const fetchTeamData = async (): Promise<TeamData> => {
  try {
    const response = await api.get(`/teams/${teamId}`)
    return response.data as TeamData
  } catch (error) {
    console.error('Error fetching team data:', error)
    throw error
  }
}

// Computed properties
const currentStats = computed(() => {
  const activePlayers = teamData.value.players.filter(p => !p.is_ir)
  const totalFantasyPoints = activePlayers.reduce((sum, p) => sum + getFantasyPoints(p.metadata), 0)

  return {
    totalFantasyPoints,
    avgFantasyPoints: totalFantasyPoints / Math.max(activePlayers.length, 1),
    avgSalary: teamData.value.total_salary / Math.max(activePlayers.length, 1),
    irPlayers: teamData.value.players.filter(p => p.is_ir).length
  }
})

const positionStats = computed(() => {
  const activePlayers = teamData.value.players.filter(p => !p.is_ir)
  const positions = ['G', 'F', 'C']

  return positions.map(pos => {
    const posPlayers = activePlayers.filter(p => p.primary_position === pos)
    const totalSalary = posPlayers.reduce((sum, p) => sum + p.contract.salary, 0)
    const totalFantasyPoints = posPlayers.reduce((sum, p) => sum + getFantasyPoints(p.metadata), 0)

    return {
      name: getPositionName(pos),
      count: posPlayers.length,
      totalSalary,
      avgSalary: totalSalary / Math.max(posPlayers.length, 1),
      totalFantasyPoints,
      efficiency: totalFantasyPoints / Math.max(totalSalary, 1),
      capPercentage: ((totalSalary / teamData.value.total_salary) * 100).toFixed(1),
      color: getPositionColor(pos)
    }
  })
})

const contractStats = computed(() => {
  const activePlayers = teamData.value.players.filter(p => !p.is_ir)

  const expiring2025 = activePlayers.filter(p =>
    p.contract.start_year + p.contract.duration - 1 === currentYear
  ).length

  const expiring2026 = activePlayers.filter(p =>
    p.contract.start_year + p.contract.duration - 1 === currentYear + 1
  ).length

  const longTerm = activePlayers.filter(p =>
    p.contract.start_year + p.contract.duration - 1 >= currentYear + 2
  ).length

  const rosterExpiring = ((expiring2025 / Math.max(activePlayers.length, 1)) * 100)
  const rosterReturning = 100 - rosterExpiring

  return {
    expiring2025,
    expiring2026,
    longTerm,
    rfa: activePlayers.filter(p => p.contract.is_rfa).length,
    teamOptions: activePlayers.filter(p => p.contract.is_to).length,
    rosterExpiring,
    rosterReturning
  }
})

const expiringPlayers = computed(() => {
  const activePlayers = teamData.value.players.filter(p => !p.is_ir)

  return {
    thisYear: activePlayers.filter(p =>
      p.contract.start_year + p.contract.duration - 1 === currentYear
    ),
    nextYear: activePlayers.filter(p =>
      p.contract.start_year + p.contract.duration - 1 === currentYear + 1
    )
  }
})

const topContributors = computed(() => {
  const activePlayers = teamData.value.players.filter(p => !p.is_ir)
  const playersWithFpts = activePlayers.map(p => ({
    ...p,
    fpts: getFantasyPoints(p.metadata)
  })).sort((a, b) => b.fpts - a.fpts)

  const byPosition: Record<string, any[]> = {
    G: [],
    F: [],
    C: []
  }

  playersWithFpts.forEach(player => {
    if (byPosition[player.primary_position]) {
      byPosition[player.primary_position].push(player)
    }
  })

  // Get top 3 for each position
  Object.keys(byPosition).forEach(pos => {
    byPosition[pos] = byPosition[pos].slice(0, 3)
  })

  return {
    team: playersWithFpts.slice(0, 3),
    byPosition
  }
})

const futureSeasons = computed(() => {
  const seasons = []

  for (let year = currentYear + 1; year <= currentYear + 3; year++) {
    const playersUnderContract = teamData.value.players.filter(p =>
      !p.is_ir &&
      p.contract.start_year + p.contract.duration - 1 >= year
    )

    const salaryCommitted = playersUnderContract.reduce((sum, p) => sum + p.contract.salary, 0)
    const picks = teamData.value.current_picks.filter(pick =>
      pick.draft_year === year && !pick.is_from_league_draft
    ).length

    seasons.push({
      year: `${year}-${(year + 1).toString().slice(-2)}`,
      players: playersUnderContract.length,
      salaryCommitted,
      availableCap: SALARY_CAP - salaryCommitted,
      picks
    })
  }

  return seasons
})

const draftPicks = computed(() => {
  const picks: Record<string, Pick[]> = {}
  const filteredPicks = teamData.value.current_picks.filter(pick => !pick.is_from_league_draft)

  filteredPicks.forEach(pick => {
    const year = pick.draft_year.toString()
    if (!picks[year]) picks[year] = []
    picks[year].push(pick)
  })

  return picks
})

const efficiencyStats = computed(() => {
  const activePlayers = teamData.value.players.filter(p => !p.is_ir)
  const totalFantasyPoints = activePlayers.reduce((sum, p) => sum + getFantasyPoints(p.metadata), 0)

  return {
    fptsPerMillion: totalFantasyPoints / Math.max(teamData.value.total_salary, 1),
    salaryCapUtilization: (teamData.value.total_salary / SALARY_CAP) * 100,
    rosterUtilization: (activePlayers.length / MAX_PLAYERS) * 100
  }
})

const teamMetrics = computed(() => {
  const activePlayers = teamData.value.players.filter(p => !p.is_ir)

  const avgAge = activePlayers.reduce((sum, p) => sum + getPlayerAge(p.metadata), 0) / Math.max(activePlayers.length, 1)
  const avgExperience = activePlayers.reduce((sum, p) => sum + getPlayerExperience(p.metadata), 0) / Math.max(activePlayers.length, 1)

  // Simple value rating based on efficiency
  const efficiency = efficiencyStats.value.fptsPerMillion
  let valueRating = 'D'
  if (efficiency >= 4) valueRating = 'A'
  else if (efficiency >= 3) valueRating = 'B'
  else if (efficiency >= 2) valueRating = 'C'

  return {
    avgAge,
    avgExperience,
    valueRating
  }
})

onMounted(async () => {
  try {
    teamData.value = await fetchTeamData()
  } catch (error) {
    console.error('Failed to fetch team data:', error)
  }
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  min-height: 100vh;
}

.team-header {
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);

  .v-card-text {
    color: white;
  }
}

.stat-card {
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: translateY(-2px);
  }
}

.v-expansion-panels {
  .v-expansion-panel {
    margin-bottom: 8px;
  }
}
</style>