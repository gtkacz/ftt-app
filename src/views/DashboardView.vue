<template>
  <v-progress-circular v-if="loading" indeterminate color="primary" />
  <v-container v-else fluid class="dashboard-container">
    <!-- Team Header -->
    <v-row>
      <v-col cols="12">
        <v-card class="team-header pa-4" elevation="4">
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar size="80" class="me-4">
                <v-img :src="simulatedTeamData.avatar || defaultAvatar" alt="Team Avatar"></v-img>
              </v-avatar>
              <div>
                <h1 class="text-h3 font-weight-bold text-white">{{ simulatedTeamData.name }}</h1>
                <p class="text-h6 text-grey-lighten-2">@{{ simulatedTeamData.owner_username }}</p>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Add Player Simulation -->
    <v-row class="my-4">
      <v-col cols="12">
        <v-card elevation="3" class="pa-3">
          <v-card-title>
            <v-icon class="me-2">person_add</v-icon>
            Add Player Simulation
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6" md="3">
                <v-autocomplete rounded :items="availableFreeAgents"
                  :item-title="(item) => item.header ? item.header : `${item.first_name} ${item.last_name} (${item.primary_position}) - $${item.contract?.salary}M`"
                  :item-value="(item) => item.header || item.divider ? null : item" label="Select Player"
                  variant="outlined" clearable clear-on-select autocomplete="off"
                  @update:model-value="(player) => player && addSimulatedPlayer(player)">
                  <template v-slot:item="{ props, item }">
                    <v-list-subheader v-if="item.raw.header" :key="item.raw.header">
                      {{ item.raw.header }}
                    </v-list-subheader>
                    <v-divider v-else-if="item.raw.divider" :key="'divider'"></v-divider>
                    <v-list-item v-else v-bind="props">
                      <template v-slot:prepend>
                        <v-chip :color="getPositionColor(item.raw.primary_position)" size="small">
                          {{ item.raw.primary_position }}
                        </v-chip>
                      </template>
                      <template v-slot:append>
                        <span class="text-caption">${{ item.raw.contract?.salary }}M</span>
                      </template>
                    </v-list-item>
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col cols="12" md="6">
                <div v-if="simulatedPlayers.length > 0">
                  <v-card-text class="pa-0 mb-2">Simulated Additions:</v-card-text>
                  <div class="d-flex flex-wrap align-center gap-2">
                    <v-chip v-for="player in simulatedPlayers" :key="player.id" closable
                      :color="getPositionColor(player.primary_position)" variant="tonal"
                      @click:close="removeSimulatedPlayer(player.id)">
                      <v-avatar size="24" class="mr-3">
                        <v-img :src="player.photo || '/placeholder-player.png'"
                          :alt="`${player.first_name} ${player.last_name}`" cover>
                          <template #error>
                            <v-icon size="24">account</v-icon>
                          </template>
                        </v-img>
                      </v-avatar>
                      {{ player.first_name[0] }}. {{ player.last_name }} (${{ player.contract?.salary }}M)
                    </v-chip>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Overview Cards -->
    <v-row class="my-4">
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="3" class="stat-card pa-3" max-height="150">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <v-card-subtitle class="pa-0">Total Players</v-card-subtitle>
                <v-card-title class="pa-0 text-h4">{{ simulatedTeamData.total_players }}</v-card-title>
                <div class="d-flex gap-1 flex-wrap">
                  <v-chip variant="tonal" size="small" color="info">
                    {{ simulatedTeamData.available_players }} slots available
                  </v-chip>
                  <v-chip v-if="leagueStats" variant="tonal" size="small" color="secondary">
                    League Avg: {{ leagueStats.averages.totalPlayers.toFixed(1) }} | #{{ teamRankings.totalPlayers }} of
                    {{
                      leagueStats.teams.length }}
                  </v-chip>
                </div>
              </div>
              <v-icon color="primary" size="40">group</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card elevation="3" class="stat-card pa-3" max-height="150">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <v-card-subtitle class="pa-0">Total Salary</v-card-subtitle>
                <v-card-title class="pa-0 text-h4">${{ simulatedTeamData.total_salary }}M</v-card-title>
                <div class="d-flex gap-1 flex-wrap">
                  <v-chip :color="simulatedTeamData.available_salary > 0 ? 'success' : 'error'" variant="tonal"
                    size="small">
                    ${{ simulatedTeamData.available_salary }}M available
                  </v-chip>
                  <v-chip v-if="leagueStats" variant="tonal" size="small" color="secondary">
                    League Avg: {{ leagueStats.averages?.totalSalary.toFixed(1) }} | #{{ teamRankings?.totalSalary }} of
                    {{
                      leagueStats.teams.length }}
                  </v-chip>
                </div>
              </div>
              <v-icon color="green" size="40">attach_money</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card elevation="3" class="stat-card pa-3" max-height="150">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <v-card-subtitle class="pa-0">Total Fantasy Points</v-card-subtitle>
                <v-card-title class="pa-0 text-h4">{{ currentStats.totalFantasyPoints.toFixed(1) }}</v-card-title>
                <div class="d-flex gap-1 flex-wrap">
                  <v-chip color="info" variant="tonal" size="small">
                    {{ currentStats.avgFantasyPoints.toFixed(1) }} avg
                  </v-chip>
                  <v-chip v-if="leagueStats" variant="tonal" size="small" color="secondary">
                    League Avg: {{ leagueStats.averages?.avgFantasyPoints.toFixed(1) }} | #{{
                      teamRankings?.avgFantasyPoints
                    }} of {{ leagueStats.teams.length }}
                  </v-chip>
                </div>
              </div>
              <v-icon color="purple" size="40">trophy</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card elevation="3" class="stat-card pa-3" max-height="150">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <v-card-subtitle class="pa-0">Team Efficiency (FPTS per $M)</v-card-subtitle>
                <v-card-title class="pa-0 text-h4">{{ efficiencyStats.fptsPerMillion.toFixed(1) }}</v-card-title>
                <div class="d-flex gap-1 flex-wrap">
                  <v-chip v-if="leagueStats" variant="tonal" size="small" color="secondary">
                    League Avg: {{ leagueStats.averages?.fptsPerMillion.toFixed(1) }} | #{{ teamRankings?.fptsPerMillion
                    }}
                    of {{ leagueStats.teams.length }}
                  </v-chip>
                </div>
              </div>
              <v-icon color="orange" size="40">chart_data</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Lineup Projections -->
    <v-row class="my-4">
      <v-col cols="12">
        <v-card elevation="3" class="pa-3">
          <v-card-title>
            <v-icon class="me-2">groups</v-icon>
            Lineup Projections
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col v-for="(lineup, index) in lineupProjections" :key="index" cols="12" md="4">
                <v-card variant="outlined" class="h-100">
                  <v-card-title class="text-h6 pb-2">
                    {{ lineup.name }}
                    <v-spacer></v-spacer>
                    <v-chip color="primary" variant="tonal" size="small">
                      {{ lineup.totalFpts.toFixed(1) }} Total FPTS
                    </v-chip>
                    <v-chip v-if="leagueStats && index === 0" variant="tonal" size="small" color="secondary"
                      class="ml-2">
                      Best Lineup Avg: {{ leagueStats.averages?.bestLineupFpts.toFixed(1) }} | #{{
                        teamRankings?.bestLineupFpts }} of {{ leagueStats.teams.length }}
                    </v-chip>
                    <v-chip v-if="leagueStats && index === 1" variant="tonal" size="small" color="secondary"
                      class="ml-2">
                      All Lineups Avg: {{ leagueStats.averages?.avgLineupFpts.toFixed(1) }} | #{{
                        teamRankings?.avgLineupFpts }} of {{ leagueStats.teams.length }}
                    </v-chip>
                  </v-card-title>
                  <v-card-text class="pt-0">
                    <v-list density="compact" class="pa-0">
                      <v-list-item v-for="guard in lineup.guards" :key="guard.id" class="px-0 py-1">
                        <v-list-item-title class="text-body-2">
                          <v-chip size="small" class="mr-2" :color="getPositionColor('G')">G</v-chip>{{ guard.first_name
                          }}
                          {{ guard.last_name }}
                          <v-chip v-if="guard.is_ir" class="ml-2" size="small" color="danger">IR</v-chip>
                        </v-list-item-title>
                        <template v-slot:append>
                          <span class="text-caption">{{ guard.fpts.toFixed(1) }}</span>
                        </template>
                      </v-list-item>

                      <v-list-item v-for="forward in lineup.forwards" :key="forward.id" class="px-0 py-1">
                        <v-list-item-title class="text-body-2">
                          <v-chip size="small" class="mr-2" :color="getPositionColor('F')">F</v-chip>{{
                            forward.first_name
                          }} {{ forward.last_name }}
                          <v-chip v-if="forward.is_ir" class="ml-2" size="small" color="danger">IR</v-chip>
                        </v-list-item-title>
                        <template v-slot:append>
                          <span class="text-caption">{{ forward.fpts.toFixed(1) }}</span>
                        </template>
                      </v-list-item>

                      <v-list-item v-if="lineup.center" :key="lineup.center.id" class="px-0 py-1">
                        <v-list-item-title class="text-body-2">
                          <v-chip size="small" class="mr-2" :color="getPositionColor('C')">C</v-chip>{{
                            lineup.center.first_name }} {{ lineup.center.last_name }}
                          <v-chip v-if="lineup.center.is_ir" class="ml-2" size="small" color="danger">IR</v-chip>
                        </v-list-item-title>
                        <template v-slot:append>
                          <span class="text-caption">{{ lineup.center.fpts.toFixed(1) }}</span>
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

    <!-- Players on IR -->
    <v-row>
      <v-col cols="12">
        <v-card class="pa-3" elevation="3" v-if="currentStats.irPlayers">
          <v-card-title>
            <v-icon class="me-2">healing</v-icon>
            Players on IR
          </v-card-title>
          <v-card-text>
            <v-card variant="outlined">
              <v-card-text class="d-flex flex-wrap gap-2">
                <v-chip v-for="player in simulatedTeamData.players.filter(p => p.is_ir)" :key="player.id"
                  :color="getPositionColor(player.primary_position)"><v-avatar size="24" class="mr-3">
                    <v-img :src="player.photo || '/placeholder-player.png'"
                      :alt="`${player.first_name} ${player.last_name}`" cover>
                      <template #error>
                        <v-icon size="24">account</v-icon>
                      </template>
                    </v-img>
                  </v-avatar>{{ player.first_name }} {{ player.last_name
                  }}</v-chip>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Position Breakdown with Cap Percentages -->
      <v-col cols="12" lg="6">
        <v-card elevation="3" class="pa-3">
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
                    <strong>Avg FPTS:</strong><br>
                    {{ position.avgFantasyPoints.toFixed(1) }}
                  </v-col>
                </v-row>

                <v-progress-linear :model-value="(position.count / simulatedTeamData.total_players) * 100"
                  :color="position.color" height="6" class="mt-2 rounded">
                </v-progress-linear>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-divider />
            <!-- Show how many players have more than one position -->
            <v-card-text class="text-subtitle-2 text-center">
              <span v-if="teamData.players.some(player => !!player.secondary_position)">
                {{teamData.players.filter(player => !!player.secondary_position).length}} players have multiple
                positions
              </span>
              <span v-else>No players with multiple positions</span>
            </v-card-text>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Top Contributors -->
      <v-col cols="12" lg="6">
        <v-card elevation="3" class="pa-3">
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
        <v-card elevation="3" class="pa-3">
          <v-card-title>
            <v-icon class="me-2">contract</v-icon>
            Contract Status
          </v-card-title>
          <v-card-text>
            <v-row class="mb-3">
              <v-col cols="6">
                <v-card variant="outlined" class="pa-3">
                  <v-card-text class="text-center">
                    <div class="text-h4 text-success">{{ contractStats.rosterReturning.toFixed(1) }}%</div>
                    <div class="text-caption">Roster Returning</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6">
                <v-card variant="outlined" class="pa-3">
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
              <v-progress-linear :model-value="(contractStats.expiring2025 / simulatedTeamData.total_players) * 100"
                color="error" height="4">
              </v-progress-linear>
            </div>

            <div class="mb-3">
              <div class="d-flex justify-space-between mb-2">
                <span>Expiring {{ currentYear + 1 }}:</span>
                <v-chip color="warning" variant="tonal" size="small">{{ contractStats.expiring2026 }} players</v-chip>
              </div>
              <v-progress-linear :model-value="(contractStats.expiring2026 / simulatedTeamData.total_players) * 100"
                color="warning" height="4">
              </v-progress-linear>
            </div>

            <div class="mb-3">
              <div class="d-flex justify-space-between mb-2">
                <span>Long-term (3+ years):</span>
                <v-chip color="success" variant="tonal" size="small">{{ contractStats.longTerm }} players</v-chip>
              </div>
              <v-progress-linear :model-value="(contractStats.longTerm / simulatedTeamData.total_players) * 100"
                color="success" height="4">
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
        <v-card elevation="3" class="pa-3">
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
                      <v-list-item-title>
                        {{ player.first_name }} {{ player.last_name }}
                        <v-chip v-if="player.contract.is_rfa" color="info" variant="tonal" size="x-small" class="ml-2">
                          RFA
                        </v-chip>
                        <v-chip v-if="player.contract.is_to" color="purple" variant="tonal" size="x-small" class="ml-2">
                          TO
                        </v-chip>
                      </v-list-item-title>
                      <v-list-item-subtitle>${{ player.contract?.salary }}M</v-list-item-subtitle>
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
                      <v-list-item-title>
                        {{ player.first_name }} {{ player.last_name }}
                        <v-chip v-if="player.contract.is_rfa" color="info" variant="tonal" size="x-small" class="ml-2">
                          RFA
                        </v-chip>
                        <v-chip v-if="player.contract.is_to" color="purple" variant="tonal" size="x-small" class="ml-2">
                          TO
                        </v-chip>
                      </v-list-item-title>
                      <v-list-item-subtitle>${{ player.contract?.salary }}M</v-list-item-subtitle>
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
        <v-card elevation="3" class="pa-3">
          <v-card-title>
            <v-icon class="me-2">event_upcoming</v-icon>
            Future Projections
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col v-for="season in futureSeasons" :key="season.year" cols="12" sm="6" md="4">
                <v-card variant="outlined" class="h-100 pa-3">
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
        <v-card elevation="3" class="pa-3">
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

              <v-card variant="outlined" class="pa-3">
                <v-card-text class="py-2">
                  <v-chip-group base-color="info" column>
                    <v-chip v-for="pick in draftPicks[year]" :key="`${year}-${pick.round_number}`" variant="tonal"
                      size="small">
                      {{ pick.original_team_name }} | Round {{ pick.round_number }}
                    </v-chip>
                  </v-chip-group>
                </v-card-text>
              </v-card>
            </div>
            <v-alert v-if="Object.keys(draftPicks).length === 0" type="info" variant="tonal">
              No upcoming draft picks
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Advanced Team Metrics -->
      <v-col cols="12" lg="6">
        <v-card elevation="3" class="pa-3">
          <v-card-title>
            <v-icon class="me-2">analytics</v-icon>
            Advanced Metrics
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <v-card variant="outlined" class="pa-3">
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
                <v-card variant="outlined" class="pa-3">
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

const loading = ref(true);
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
const MIN_PLAYERS = 13
const MAX_PLAYERS = 15

const teamData = ref<TeamData>({
  id: 0,
  name: '',
  owner_username: '',
  total_salary: 0,
  total_players: 0,
  available_salary: SALARY_CAP,
  available_players: MAX_PLAYERS,
  can_bid: false,
  avatar: null,
  players: [],
  current_picks: []
})

const freeAgents = ref<Player[]>([])
const simulatedPlayers = ref<Player[]>([])
const leagueTeams = ref<TeamData[]>([])

const availableFreeAgents = computed(() => {
  const addedPlayerIds = simulatedPlayers.value.map(p => Math.abs(p.id))
  const available = freeAgents.value.filter(agent => !addedPlayerIds.includes(agent.id))

  const freeAgentsOnly = available.filter(player => !player.contract || player.contract?.team === 0)
  const otherTeamPlayers = available.filter(player => player.contract && player.contract?.team !== 0)

  const result = []

  if (freeAgentsOnly.length > 0) {
    result.push({ header: 'Free Agents' })
    result.push(...freeAgentsOnly)
  }

  if (otherTeamPlayers.length > 0) {
    if (result.length > 0) result.push({ divider: true })
    result.push({ header: "Other Team's Players" })
    result.push(...otherTeamPlayers)
  }

  return result
})

const allPlayers = computed(() => [
  ...teamData.value.players,
  ...simulatedPlayers.value
])

const simulatedTeamData = computed(() => ({
  ...teamData.value,
  players: allPlayers.value,
  total_players: allPlayers.value.length,
  total_salary: allPlayers.value.reduce((sum, p) => sum + p.contract?.salary, 0),
  available_salary: SALARY_CAP - allPlayers.value.reduce((sum, p) => sum + p.contract?.salary, 0),
  available_players: MAX_PLAYERS - allPlayers.value.length
}))

const defaultAvatar = "https://raw.githubusercontent.com/gtkacz/ftt-app/refs/heads/main/src/assets/logo.png"
const currentYear = new Date().getFullYear()

// Helper functions
const getFantasyPoints = (metadata: string | object): number => {
  try {
    let parsed = metadata
    if (typeof metadata === 'string') {
      parsed = JSON.parse(metadata)
    }
    return Number(parsed.fpts) || 0
  } catch (e) {
    console.error('Error parsing fantasy points:', metadata)
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
    loading.value = true
    const response = await api.get(`/teams/${teamId}/`)
    return response.data as TeamData
  } catch (error) {
    console.error('Error fetching team data:', error)
    throw error
  } finally {
    loading.value = false
  }
}

const fetchLeagueData = async (): Promise<TeamData[]> => {
  try {
    const response = await api.get('/teams/')
    return response.data.results as TeamData[]
  } catch (error) {
    console.error('Error fetching league data:', error)
    return []
  }
}

// Computed properties
const leagueStats = computed(() => {
  loading.value = true
  if (leagueTeams.value.length === 0) return null
  
  const teams = leagueTeams.value.map(team => {
    const activePlayers = team.players.filter(p => !p.is_ir)
    const totalFantasyPoints = activePlayers.reduce((sum, p) => sum + getFantasyPoints(p.metadata), 0)
    const avgAge = activePlayers.reduce((sum, p) => sum + getPlayerAge(p.metadata), 0) / Math.max(activePlayers.length, 1)
    const avgExperience = activePlayers.reduce((sum, p) => sum + getPlayerExperience(p.metadata), 0) / Math.max(activePlayers.length, 1)
    
    // Calculate lineup projections for each team
    const teamLineups = calculateTeamLineups(activePlayers)
    const bestLineupFpts = teamLineups.length > 0 ? Math.max(...teamLineups.map(l => l.totalFpts)) : 0
    const avgLineupFpts = teamLineups.length > 0 ? teamLineups.reduce((sum, l) => sum + l.totalFpts, 0) / teamLineups.length : 0
    loading.value = false

    return {
      ...team,
      totalFantasyPoints,
      avgFantasyPoints: totalFantasyPoints / Math.max(activePlayers.length, 1),
      fptsPerMillion: totalFantasyPoints / Math.max(team.total_salary, 1),
      salaryCapUtilization: (team.total_salary / SALARY_CAP) * 100,
      rosterUtilization: (activePlayers.length / MAX_PLAYERS) * 100,
      avgAge,
      avgExperience,
      bestLineupFpts,
      avgLineupFpts
    }
  })

  const averages = {
    totalPlayers: teams.reduce((sum, t) => sum + t.total_players, 0) / teams.length,
    totalSalary: teams.reduce((sum, t) => sum + t.total_salary, 0) / teams.length,
    availableSalary: teams.reduce((sum, t) => sum + t.available_salary, 0) / teams.length,
    totalFantasyPoints: teams.reduce((sum, t) => sum + t.totalFantasyPoints, 0) / teams.length,
    avgFantasyPoints: teams.reduce((sum, t) => sum + t.avgFantasyPoints, 0) / teams.length,
    fptsPerMillion: teams.reduce((sum, t) => sum + t.fptsPerMillion, 0) / teams.length,
    salaryCapUtilization: teams.reduce((sum, t) => sum + t.salaryCapUtilization, 0) / teams.length,
    rosterUtilization: teams.reduce((sum, t) => sum + t.rosterUtilization, 0) / teams.length,
    avgAge: teams.reduce((sum, t) => sum + t.avgAge, 0) / teams.length,
    avgExperience: teams.reduce((sum, t) => sum + t.avgExperience, 0) / teams.length,
    bestLineupFpts: teams.reduce((sum, t) => sum + t.bestLineupFpts, 0) / teams.length,
    avgLineupFpts: teams.reduce((sum, t) => sum + t.avgLineupFpts, 0) / teams.length
  }

  return { teams, averages }
})

const teamRankings = computed(() => {
  if (!leagueStats.value) return null

  const { teams } = leagueStats.value
  const currentTeam = teams.find(t => t.id === parseInt(teamId))
  if (!currentTeam) return null

  const getRank = (value: number, values: number[], higherIsBetter = true) => {
    const sorted = [...values].sort((a, b) => higherIsBetter ? b - a : a - b)
    return sorted.indexOf(value) + 1
  }

  // Calculate current team lineup stats using same method as league teams
  const currentActivePlayers = simulatedTeamData.value.players.filter(p => !p.is_ir)
  const currentTeamLineups = calculateTeamLineups(currentActivePlayers)
  const bestCurrentLineup = currentTeamLineups.length > 0 ? Math.max(...currentTeamLineups.map(l => l.totalFpts)) : 0
  const avgCurrentLineup = currentTeamLineups.length > 0 ? currentTeamLineups.reduce((sum, l) => sum + l.totalFpts, 0) / currentTeamLineups.length : 0

  return {
    totalPlayers: getRank(currentTeam.total_players, teams.map(t => t.total_players)),
    totalSalary: getRank(currentTeam.total_salary, teams.map(t => t.total_salary)),
    totalFantasyPoints: getRank(currentTeam.totalFantasyPoints, teams.map(t => t.totalFantasyPoints)),
    avgFantasyPoints: getRank(currentTeam.avgFantasyPoints, teams.map(t => t.avgFantasyPoints)),
    fptsPerMillion: getRank(currentTeam.fptsPerMillion, teams.map(t => t.fptsPerMillion)),
    salaryCapUtilization: getRank(currentTeam.salaryCapUtilization, teams.map(t => t.salaryCapUtilization), false),
    avgAge: getRank(currentTeam.avgAge, teams.map(t => t.avgAge), false),
    avgExperience: getRank(currentTeam.avgExperience, teams.map(t => t.avgExperience)),
    bestLineupFpts: getRank(bestCurrentLineup, teams.map(t => t.bestLineupFpts)),
    avgLineupFpts: getRank(avgCurrentLineup, teams.map(t => t.avgLineupFpts))
  }
})

const currentStats = computed(() => {
  const activePlayers = simulatedTeamData.value.players
  const totalFantasyPoints = activePlayers.reduce((sum, p) => sum + getFantasyPoints(p.metadata), 0)

  return {
    totalFantasyPoints,
    avgFantasyPoints: totalFantasyPoints / Math.max(activePlayers.length, 1),
    avgSalary: simulatedTeamData.value.total_salary / Math.max(activePlayers.length, 1),
    irPlayers: simulatedTeamData.value.players.filter(p => p.is_ir).length
  }
})

const positionStats = computed(() => {
  const activePlayers = simulatedTeamData.value.players
  const positions = ['G', 'F', 'C']

  return positions.map(pos => {
    // Include players where pos matches primary OR secondary position
    const posPlayers = activePlayers.filter(p =>
      p.primary_position === pos || p.secondary_position === pos
    )
    const totalSalary = posPlayers.reduce((sum, p) => sum + p.contract?.salary, 0)
    const totalFantasyPoints = posPlayers.reduce((sum, p) => sum + getFantasyPoints(p.metadata), 0)

    return {
      name: getPositionName(pos),
      count: posPlayers.length,
      totalSalary,
      avgSalary: totalSalary / Math.max(posPlayers.length, 1),
      avgFantasyPoints: totalFantasyPoints / Math.max(posPlayers.length, 1),
      totalFantasyPoints,
      efficiency: totalFantasyPoints / Math.max(totalSalary, 1),
      capPercentage: ((totalSalary / simulatedTeamData.value.total_salary) * 100).toFixed(1),
      color: getPositionColor(pos)
    }
  })
})

const contractStats = computed(() => {
  const activePlayers = simulatedTeamData.value.players

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
  const activePlayers = simulatedTeamData.value.players

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
  const activePlayers = simulatedTeamData.value.players
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
    const playersUnderContract = simulatedTeamData.value.players.filter(p =>
      p.contract.start_year + p.contract.duration - 1 >= year
    )

    const salaryCommitted = playersUnderContract.reduce((sum, p) => sum + p.contract?.salary, 0)
    const picks = simulatedTeamData.value.current_picks.filter(pick =>
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
  const filteredPicks = simulatedTeamData.value.current_picks.filter(pick => !pick.is_from_league_draft)

  filteredPicks.forEach(pick => {
    const year = pick.draft_year.toString()
    if (!picks[year]) picks[year] = []
    picks[year].push(pick)
  })

  return picks
})

const efficiencyStats = computed(() => {
  const activePlayers = simulatedTeamData.value.players
  const totalFantasyPoints = activePlayers.reduce((sum, p) => sum + getFantasyPoints(p.metadata), 0)

  return {
    fptsPerMillion: totalFantasyPoints / Math.max(simulatedTeamData.value.total_salary, 1),
    salaryCapUtilization: (simulatedTeamData.value.total_salary / SALARY_CAP) * 100,
    rosterUtilization: (activePlayers.length / MAX_PLAYERS) * 100
  }
})

const teamMetrics = computed(() => {
  const activePlayers = simulatedTeamData.value.players

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

const lineupProjections = computed(() => {
  const activePlayers = simulatedTeamData.value.players.filter(p => !p.is_ir)
  const numLineups = Math.min(3, Math.ceil(activePlayers.length / 5))
  const lineups = []

  // Create player pool with all eligible positions and FPTS
  const playerPool = activePlayers.map(p => {
    const fpts = getFantasyPoints(p.metadata)
    const positions = [p.primary_position]
    if (p.secondary_position) {
      positions.push(p.secondary_position)
    }
    return { ...p, fpts, eligiblePositions: positions }
  }).sort((a, b) => b.fpts - a.fpts) // Sort by FPTS descending

  const usedPlayers = new Set()

  for (let i = 0; i < numLineups; i++) {
    const lineup = {
      name: i === 0 ? 'Starting Lineup' : `${i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}th`} Unit`,
      guards: [],
      forwards: [],
      center: null,
      totalFpts: 0
    }

    const availablePlayers = playerPool.filter(p => !usedPlayers.has(p.id))

    // Determine position assignment order based on scarcity (availability ratio)
    const positionCounts = {
      'G': availablePlayers.filter(p => p.eligiblePositions.includes('G')).length,
      'F': availablePlayers.filter(p => p.eligiblePositions.includes('F')).length,
      'C': availablePlayers.filter(p => p.eligiblePositions.includes('C')).length
    }

    // Create positions sorted by scarcity (fewest available players per needed slot first)
    const positionOrder = [
      { pos: 'C', needed: 1 },
      { pos: 'F', needed: 2 },
      { pos: 'G', needed: 2 }
    ].sort((a, b) => {
      const aRatio = positionCounts[a.pos] / a.needed
      const bRatio = positionCounts[b.pos] / b.needed
      return aRatio - bRatio // Scarcest positions first
    })

    // Build neededPositions array in scarcity order
    const neededPositions = []
    for (const { pos, needed } of positionOrder) {
      for (let j = 0; j < needed; j++) {
        neededPositions.push(pos)
      }
    }

    // Assignment prioritizing completion: fill scarce positions first
    for (const neededPos of neededPositions) {
      const bestPlayer = availablePlayers.find(p =>
        !usedPlayers.has(p.id) && p.eligiblePositions.includes(neededPos)
      )

      if (bestPlayer) {
        usedPlayers.add(bestPlayer.id)

        if (neededPos === 'G' && lineup.guards.length < 2) {
          lineup.guards.push(bestPlayer)
        } else if (neededPos === 'F' && lineup.forwards.length < 2) {
          lineup.forwards.push(bestPlayer)
        } else if (neededPos === 'C' && !lineup.center) {
          lineup.center = bestPlayer
        }
      }
    }

    // Calculate total FPTS
    lineup.totalFpts = [
      ...lineup.guards,
      ...lineup.forwards,
      ...(lineup.center ? [lineup.center] : [])
    ].reduce((sum, p) => sum + p.fpts, 0)

    lineups.push(lineup)
  }

  return lineups
})

const calculateTeamLineups = (players: any[]) => {
  // Simplified version of lineup calculation for league comparison
  const playersWithFpts = players.map(p => ({
    ...p,
    fpts: getFantasyPoints(p.metadata),
    eligiblePositions: [p.primary_position, ...(p.secondary_position ? [p.secondary_position] : [])]
  })).sort((a, b) => b.fpts - a.fpts)

  const lineups = []
  const usedPlayers = new Set()

  for (let i = 0; i < Math.min(3, Math.ceil(players.length / 5)); i++) {
    const availablePlayers = playersWithFpts.filter(p => !usedPlayers.has(p.id))
    let totalFpts = 0
    let playerCount = 0

    // Simple best available lineup construction
    for (const pos of ['C', 'F', 'F', 'G', 'G']) {
      const bestPlayer = availablePlayers.find(p =>
        !usedPlayers.has(p.id) && p.eligiblePositions.includes(pos)
      )
      if (bestPlayer) {
        usedPlayers.add(bestPlayer.id)
        totalFpts += bestPlayer.fpts
        playerCount++
      }
    }

    if (playerCount > 0) {
      lineups.push({ totalFpts, playerCount })
    }
  }

  return lineups
}

const addSimulatedPlayer = (player: Player) => {
  // Create a copy with a temporary negative ID to avoid conflicts
  const simulatedPlayer = {
    ...player,
    id: -Math.abs(player.id) - simulatedPlayers.value.length
  }
  simulatedPlayers.value.push(simulatedPlayer)
}

const removeSimulatedPlayer = (playerId: number) => {
  simulatedPlayers.value = simulatedPlayers.value.filter(p => p.id !== playerId)
}

const fetchFreeAgents = async (): Promise<Player[]> => {
  const response = await api.get('players/?limit=10000')
  let raw_data = structuredClone(response.data.results)

  raw_data.forEach(player => {
    if (player.metadata) {
      try {
        player.metadata = JSON.parse(JSON.stringify(structuredClone(player.metadata)).replaceAll("NaN", "null"))
        if (typeof player.metadata === 'string') {
          player.metadata = JSON.parse(player.metadata.replaceAll("NaN", "null"))
        }
        if (typeof player.metadata === 'string') {
          player.metadata = JSON.parse(player.metadata.replaceAll("NaN", "null"))
        }
      } catch (e) {
        console.error('Failed to parse player metadata:', e)
      }
    }
  })

  const players = raw_data.filter(player => {
    return !player.contract || Object.keys(player.contract).length === 0
      || (player.contract && player.contract.team !== teamId)
  }) as Player[]

  // For players with no contract, set a default contract structure
  players.forEach(player => {
    if (!player.contract || Object.keys(player.contract).length === 0) {
      player.contract = {
        id: -1,
        player: player.id,
        team: 0,
        start_year: currentYear,
        duration: 1,
        salary: 3.5,
        is_rfa: false,
        is_to: false
      }
    }
    player.is_ir = false
  })

  return players;
}

onMounted(async () => {
  loading.value = true
  try {
    const [team, league, agents] = await Promise.all([
      fetchTeamData(),
      fetchLeagueData(),
      fetchFreeAgents()
    ])
    teamData.value = team
    leagueTeams.value = league
    freeAgents.value = agents
  } catch (error) {
    console.error('Error fetching initial data:', error)
    throw error
  } finally {
    loading.value = false
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