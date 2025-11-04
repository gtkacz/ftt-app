<template>
  <v-container fluid class="league-trade-overview">
    <!-- Header -->
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-2">League Trade History</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          All completed trades in the league
        </p>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-row>
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedSeason"
          :items="seasons"
          label="Season"
          density="compact"
          variant="outlined"
          disabled
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedTeam"
          :items="teams"
          item-title="name"
          item-value="id"
          label="Team"
          clearable
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="search"
          label="Search trades"
          prepend-inner-icon="search"
          density="compact"
          variant="outlined"
          clearable
        />
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="loading.trades">
      <v-col>
        <v-progress-linear indeterminate color="primary" />
      </v-col>
    </v-row>

    <!-- Trades Timeline -->
    <v-row v-else>
      <v-col>
        <!-- Empty State -->
        <v-card v-if="filteredTrades.length === 0" variant="outlined">
          <v-card-text class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1">handshake</v-icon>
            <p class="text-h6 mt-4">No completed trades found</p>
            <p class="text-body-2 text-medium-emphasis">
              Completed trades will appear here
            </p>
          </v-card-text>
        </v-card>

        <!-- Trade Cards -->
        <v-timeline v-else side="end" align="start">
          <v-timeline-item
            v-for="trade in filteredTrades"
            :key="trade.id"
            dot-color="success"
            size="small"
          >
            <!-- Date -->
            <template #opposite>
              <div class="text-caption text-medium-emphasis">
                {{ formatDate(trade.completed_at) }}
              </div>
            </template>

            <!-- Trade Card -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" color="success">check_circle</v-icon>
                Trade #{{ trade.id }}
                <v-spacer />
                <v-chip size="small" color="success">Completed</v-chip>
              </v-card-title>

              <v-card-text>
                <!-- Teams Involved -->
                <div class="mb-3">
                  <div class="text-caption text-medium-emphasis mb-1">
                    Teams Involved:
                  </div>
                  <v-chip-group>
                    <v-chip
                      v-for="team in trade.teams_detail"
                      :key="team.id"
                      size="small"
                      variant="outlined"
                    >
                      {{ team.name }}
                    </v-chip>
                  </v-chip-group>
                </div>

                <!-- Trade Summary -->
                <TradeSummaryPanel
                  :teams="trade.teams_detail"
                  :assets="trade.assets"
                  :validation="null"
                />

                <!-- View Details Button -->
                <div class="mt-3">
                  <v-btn
                    :to="{ name: 'trade-detail', params: { id: trade.id } }"
                    variant="outlined"
                    size="small"
                    prepend-icon="visibility"
                  >
                    View Details
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-timeline-item>
        </v-timeline>

        <!-- Load More -->
        <div v-if="hasMore" class="text-center mt-4">
          <v-btn
            @click="loadMore"
            :loading="loading.more"
            variant="outlined"
          >
            Load More
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTradeStore } from '@/stores/trade'
import TradeSummaryPanel from '@/components/trade/TradeSummaryPanel.vue'
import type { Trade, Team } from '@/types'

const tradeStore = useTradeStore()

// State
const selectedSeason = ref<string>('2024-25')
const selectedTeam = ref<number | null>(null)
const search = ref<string>('')
const loading = ref({
  trades: false,
  more: false
})
const hasMore = ref(false)
const page = ref(1)

// TODO: Load from API when available
const seasons = ref(['2024-25', '2023-24', '2022-23'])
const teams = ref<Team[]>([])

// Computed
const filteredTrades = computed(() => {
  let trades = tradeStore.completedTrades

  // Filter by team
  if (selectedTeam.value) {
    trades = trades.filter(t =>
      t.teams.includes(selectedTeam.value!)
    )
  }

  // Filter by search
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    trades = trades.filter(t =>
      t.teams_detail.some(team =>
        team.name.toLowerCase().includes(searchLower)
      ) ||
      t.assets.some(a =>
        a.player_detail?.first_name.toLowerCase().includes(searchLower) ||
        a.player_detail?.last_name.toLowerCase().includes(searchLower)
      )
    )
  }

  return trades
})

// Methods
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const loadMore = async () => {
  loading.value.more = true
  page.value++
  // TODO: Implement pagination when API supports it
  await tradeStore.fetchUserTrades()
  loading.value.more = false
}

// Lifecycle
onMounted(async () => {
  loading.value.trades = true
  try {
    await tradeStore.fetchUserTrades()
    // TODO: Load teams from API when available
    // teams.value = await teamAPI.getTeams()
  } catch (error) {
    console.error('Failed to load league trades:', error)
  } finally {
    loading.value.trades = false
  }
})
</script>

<style scoped>
.league-trade-overview {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
