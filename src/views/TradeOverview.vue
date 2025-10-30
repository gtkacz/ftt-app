<template>
  <v-container fluid class="trade-overview pa-4">
    <v-row>
      <v-col cols="12">
        <div class="page-header mb-4">
          <h1 class="text-h4 font-weight-bold">Trade Management</h1>
          <div class="text-subtitle-1 text-medium-emphasis">
            Commissioner dashboard for reviewing and managing all trades
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <!-- Pending Approval Section -->
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="section-header d-flex align-center">
            <v-icon icon="pending" class="mr-2" color="warning" />
            Pending Approval
            <v-spacer />
            <v-chip color="warning" variant="tonal" size="small">
              {{ pendingApprovalTrades.length }} Trades
            </v-chip>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-0">
            <div v-if="pendingApprovalTrades.length === 0" class="empty-state">
              <v-icon icon="check_circle" size="64" class="text-medium-emphasis mb-2" />
              <div class="text-subtitle-1 text-medium-emphasis">No trades awaiting approval</div>
            </div>

            <v-list v-else class="pa-0">
              <v-list-item
                v-for="trade in pendingApprovalTrades"
                :key="trade.id"
                class="trade-list-item"
                @click="viewTrade(trade.id)"
              >
                <template #prepend>
                  <v-avatar color="warning" variant="tonal">
                    <v-icon icon="swap_horiz" />
                  </v-avatar>
                </template>

                <v-list-item-title>
                  Trade #{{ trade.id }}
                  <v-chip size="x-small" variant="tonal" class="ml-2">
                    {{ getTeamCount(trade) }} Teams
                  </v-chip>
                </v-list-item-title>

                <v-list-item-subtitle>
                  Proposed by {{ getProposingTeamName(trade) }}
                  •
                  {{ formatRelativeTime(trade.proposed_at) }}
                </v-list-item-subtitle>

                <template #append>
                  <div class="d-flex flex-column align-end">
                    <v-chip
                      v-if="hasAllAcceptances(trade)"
                      color="success"
                      variant="tonal"
                      size="small"
                    >
                      All Accepted
                    </v-chip>
                    <div class="text-caption text-medium-emphasis mt-1">
                      {{ getAssetSummary(trade) }}
                    </div>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Active Proposals Section -->
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="section-header d-flex align-center">
            <v-icon icon="send" class="mr-2" color="primary" />
            Active Proposals
            <v-spacer />
            <v-chip color="primary" variant="tonal" size="small">
              {{ activeProposalTrades.length }} Trades
            </v-chip>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-0">
            <div v-if="activeProposalTrades.length === 0" class="empty-state">
              <v-icon icon="inbox" size="64" class="text-medium-emphasis mb-2" />
              <div class="text-subtitle-1 text-medium-emphasis">No active trade proposals</div>
            </div>

            <v-list v-else class="pa-0">
              <v-list-item
                v-for="trade in activeProposalTrades"
                :key="trade.id"
                class="trade-list-item"
                @click="viewTrade(trade.id)"
              >
                <template #prepend>
                  <v-avatar color="primary" variant="tonal">
                    <v-icon icon="hourglass_empty" />
                  </v-avatar>
                </template>

                <v-list-item-title>
                  Trade #{{ trade.id }}
                  <v-chip size="x-small" variant="tonal" class="ml-2">
                    {{ getTeamCount(trade) }} Teams
                  </v-chip>
                </v-list-item-title>

                <v-list-item-subtitle>
                  Proposed by {{ getProposingTeamName(trade) }}
                  •
                  {{ formatRelativeTime(trade.proposed_at) }}
                </v-list-item-subtitle>

                <template #append>
                  <div class="d-flex flex-column align-end">
                    <div class="response-summary">
                      <v-chip
                        v-if="getAcceptedCount(trade) > 0"
                        color="success"
                        variant="tonal"
                        size="x-small"
                        class="mr-1"
                      >
                        {{ getAcceptedCount(trade) }} Accepted
                      </v-chip>
                      <v-chip
                        v-if="getPendingCount(trade) > 0"
                        color="warning"
                        variant="tonal"
                        size="x-small"
                      >
                        {{ getPendingCount(trade) }} Pending
                      </v-chip>
                    </div>
                    <div class="text-caption text-medium-emphasis mt-1">
                      {{ getAssetSummary(trade) }}
                    </div>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Recent History Section -->
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="section-header d-flex align-center">
            <v-icon icon="history" class="mr-2" />
            Recent History
            <v-spacer />
            <v-btn variant="text" size="small" @click="loadHistory">
              <v-icon icon="refresh" class="mr-1" />
              Refresh
            </v-btn>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-0">
            <div v-if="historyTrades.length === 0" class="empty-state">
              <v-icon icon="history" size="64" class="text-medium-emphasis mb-2" />
              <div class="text-subtitle-1 text-medium-emphasis">No trade history</div>
            </div>

            <v-list v-else class="pa-0">
              <v-list-item
                v-for="trade in historyTrades"
                :key="trade.id"
                class="trade-list-item"
                @click="viewTrade(trade.id)"
              >
                <template #prepend>
                  <v-avatar
                    :color="getHistoryColor(trade.status)"
                    variant="tonal"
                  >
                    <v-icon :icon="getHistoryIcon(trade.status)" />
                  </v-avatar>
                </template>

                <v-list-item-title>
                  Trade #{{ trade.id }}
                  <v-chip
                    :color="getHistoryColor(trade.status)"
                    variant="tonal"
                    size="x-small"
                    class="ml-2"
                  >
                    {{ trade.status.toUpperCase() }}
                  </v-chip>
                </v-list-item-title>

                <v-list-item-subtitle>
                  {{ getProposingTeamName(trade) }}
                  •
                  {{ formatRelativeTime(trade.completed_at || trade.approved_at || trade.created_at) }}
                </v-list-item-subtitle>

                <template #append>
                  <div class="d-flex flex-column align-end">
                    <div class="text-caption text-medium-emphasis">
                      {{ getTeamCount(trade) }} Teams
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ getAssetSummary(trade) }}
                    </div>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading Overlay -->
    <v-overlay v-model="tradeStore.isLoadingTrades" persistent class="align-center justify-center">
      <v-progress-circular indeterminate size="64" />
    </v-overlay>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTradeStore } from '@/stores/trade';
import { useAuthStore } from '@/stores/auth';
import { formatDistanceToNow, parseISO } from 'date-fns';
import type { Trade, Team } from '@/types/trade';
import api from '@/api/axios';

const router = useRouter();
const tradeStore = useTradeStore();
const authStore = useAuthStore();
const allTeams = ref<Team[]>([]);

onMounted(async () => {
  if (!authStore.isCommissioner) {
    router.push('/');
    return;
  }
  await loadTeams();
  await loadTrades();
});

async function loadTeams() {
  try {
    const response = await api.get('/teams/');
    allTeams.value = response.data.results || [];
  } catch (error) {
    console.error('Failed to load teams:', error);
  }
}

const pendingApprovalTrades = computed(() => {
  return tradeStore.activeTrades.filter(t => t.status === 'waiting_approval');
});

const activeProposalTrades = computed(() => {
  return tradeStore.activeTrades.filter(t => t.status === 'proposed');
});

const historyTrades = computed(() => {
  return tradeStore.tradeHistory.slice(0, 10);
});

function getTeamCount(trade: Trade): number {
  return trade.teams.length;
}

function getAssetCount(trade: Trade): number {
  return trade.assets?.length || 0;
}

function getTeamName(teamIdOrTeam: Team | number): string {
  if (typeof teamIdOrTeam === 'number') {
    const team = allTeams.value.find(t => t.id === teamIdOrTeam);
    return team?.name || `Team #${teamIdOrTeam}`;
  }
  return teamIdOrTeam.name;
}

function getProposingTeamName(trade: Trade): string {
  return getTeamName(trade.proposing_team);
}

function getAssetSummary(trade: Trade): string {
  if (!trade.assets || trade.assets.length === 0) return 'No assets';

  const playerCount = trade.assets.filter(a => a.asset_type === 'player').length;
  const pickCount = trade.assets.filter(a => a.asset_type === 'pick').length;

  const parts = [];
  if (playerCount > 0) parts.push(`${playerCount} player${playerCount > 1 ? 's' : ''}`);
  if (pickCount > 0) parts.push(`${pickCount} pick${pickCount > 1 ? 's' : ''}`);

  return parts.join(', ');
}

function hasAllAcceptances(trade: Trade): boolean {
  if (!trade.offers) return false;
  return trade.offers.every(offer => offer.status === 'accepted');
}

function getAcceptedCount(trade: Trade): number {
  if (!trade.offers) return 0;
  return trade.offers.filter(offer => offer.status === 'accepted').length;
}

function getPendingCount(trade: Trade): number {
  if (!trade.offers) return 0;
  return trade.offers.filter(offer => offer.status === 'pending').length;
}

function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) return 'Unknown';
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch {
    return dateString;
  }
}

function getHistoryColor(status: string): string {
  const colorMap: Record<string, string> = {
    completed: 'success',
    approved: 'success',
    rejected: 'error',
    vetoed: 'error',
    cancelled: 'grey',
  };
  return colorMap[status] || 'grey';
}

function getHistoryIcon(status: string): string {
  const iconMap: Record<string, string> = {
    completed: 'done_all',
    approved: 'check_circle',
    rejected: 'cancel',
    vetoed: 'gavel',
    cancelled: 'block',
  };
  return iconMap[status] || 'help';
}

async function loadTrades() {
  try {
    await tradeStore.loadTrades();
  } catch (error) {
    console.error('Failed to load trades:', error);
  }
}

async function loadHistory() {
  await loadTrades();
}

function viewTrade(tradeId: number) {
  router.push(`/trades/${tradeId}`);
}
</script>

<style scoped lang="scss">
.trade-overview {
  .page-header {
    padding: 16px 0;
  }

  .section-header {
    padding: 16px;
    background: rgba(var(--v-theme-surface-variant), 0.3);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 24px;
  }

  .trade-list-item {
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background: rgba(var(--v-theme-surface-variant), 0.2);
    }

    &:last-child {
      border-bottom: none;
    }
  }

  .response-summary {
    display: flex;
    gap: 4px;
  }
}
</style>
