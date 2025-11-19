<template>
  <div class="trade-list">
    <!-- Loading State -->
    <div v-if="loading" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="text-h6 text-medium-emphasis mt-4">Loading trades...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="trades.length === 0" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1">swap_horiz</v-icon>
      <p class="text-h6 text-medium-emphasis mt-4">No trades found</p>
      <p class="text-caption">Trades in this status will appear here</p>
    </div>

    <!-- Trade Cards -->
    <v-row v-else>
      <v-col
        v-for="trade in trades"
        :key="trade.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card
          elevation="2"
          hover
          class="trade-card"
          @click="$emit('trade-click', trade)"
        >
          <!-- Card Header -->
          <v-card-title class="d-flex align-center">
            <v-chip :color="getStatusColor(getTradeStatus(trade))" size="small" variant="flat">
              {{ getStatusDisplay(getTradeStatus(trade)) }}
            </v-chip>
            <v-spacer />
            <span class="text-caption text-medium-emphasis">#{{ trade.id }}</span>
          </v-card-title>

          <!-- Trade Teams -->
          <v-card-subtitle class="pt-2">
            <div class="d-flex flex-wrap align-center gap-1">
              <v-chip
                v-for="team in getTeams(trade)"
                :key="team.id"
                size="small"
                variant="outlined"
              >
                {{ team.name }}
              </v-chip>
            </div>
          </v-card-subtitle>

          <!-- Trade Summary -->
          <v-card-text>
            <div class="trade-summary">
              <div class="summary-row">
                <v-icon size="small" class="mr-2">person</v-icon>
                <span class="text-caption">{{ getPlayerCount(trade) }} player{{ getPlayerCount(trade) !== 1 ? 's' : '' }}</span>
              </div>
              <div class="summary-row">
                <v-icon size="small" class="mr-2">star</v-icon>
                <span class="text-caption">{{ getPickCount(trade) }} pick{{ getPickCount(trade) !== 1 ? 's' : '' }}</span>
              </div>
              <div v-if="trade.created_at" class="summary-row">
                <v-icon size="small" class="mr-2">schedule</v-icon>
                <span class="text-caption">{{ formatDate(trade.created_at) }}</span>
              </div>
            </div>

            <!-- Proposing Team -->
            <div class="mt-2">
              <span class="text-caption text-medium-emphasis">Proposed by: </span>
              <span class="text-caption font-weight-medium">{{ getSenderTeam(trade)?.name || 'Unknown Team' }}</span>
            </div>

            <!-- Notes Preview (if available) -->
            <div v-if="trade.notes" class="mt-2">
              <p class="text-caption text-medium-emphasis text-truncate">
                {{ trade.notes }}
              </p>
            </div>
          </v-card-text>

          <!-- Card Actions -->
          <v-card-actions v-if="showActions(trade)">
            <v-spacer />

            <!-- Draft Actions -->
            <template v-if="trade.status === 'draft'">
              <v-btn
                size="small"
                variant="text"
                color="primary"
                @click.stop="$emit('edit-trade', trade)"
              >
                <v-icon start>edit</v-icon>
                Edit
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                color="error"
                @click.stop="$emit('delete-trade', trade)"
              >
                <v-icon start>delete</v-icon>
                Delete
              </v-btn>
            </template>

            <!-- Waiting Acceptance Actions (for recipients) -->
            <template v-if="getTradeStatus(trade) === 'waiting_acceptance' && !isProposer(trade)">
              <v-btn
                size="small"
                variant="text"
                color="success"
                @click.stop="$emit('respond-trade', { trade, response: 'accept' })"
              >
                <v-icon start>check</v-icon>
                Accept
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                color="warning"
                @click.stop="$emit('respond-trade', { trade, response: 'counter' })"
              >
                <v-icon start>edit</v-icon>
                Counter
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                color="error"
                @click.stop="$emit('respond-trade', { trade, response: 'reject' })"
              >
                <v-icon start>close</v-icon>
                Reject
              </v-btn>
            </template>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { Trade, BackendTradeAssets } from '@/types/trade';
import { getTradeDisplayStatus } from '@/types/trade';

const authStore = useAuthStore();

interface Props {
  trades: Trade[];
  loading?: boolean;
}

interface Emits {
  (e: 'trade-click', trade: Trade): void;
  (e: 'edit-trade', trade: Trade): void;
  (e: 'delete-trade', trade: Trade): void;
  (e: 'respond-trade', payload: { trade: Trade; response: 'accept' | 'reject' | 'counter' }): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

defineEmits<Emits>();

// Get display status for trade
function getTradeStatus(trade: Trade): string {
  return trade.displayStatus || getTradeDisplayStatus(trade) || trade.status || 'unknown';
}

// Get status color
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'grey',
    proposed: 'info',
    waiting_acceptance: 'info',
    waiting_approval: 'warning',
    accepted: 'warning',
    approved: 'success',
    vetoed: 'error',
    rejected: 'error',
    completed: 'success',
    unknown: 'grey',
  };
  return colors[status] || 'grey';
}

// Get status display text
function getStatusDisplay(status: string): string {
  const displays: Record<string, string> = {
    draft: 'Draft',
    proposed: 'Proposed',
    waiting_acceptance: 'Waiting Response',
    waiting_approval: 'Pending Approval',
    accepted: 'Accepted',
    approved: 'Approved',
    vetoed: 'Vetoed',
    rejected: 'Rejected',
    completed: 'Completed',
    unknown: 'Unknown',
  };
  return displays[status] || status;
}

// Get player count (handles both backend and legacy structures)
function getPlayerCount(trade: Trade): number {
  if (Array.isArray(trade.assets)) {
    // Legacy structure
    return trade.assets.filter((a: any) => a.asset_type === 'player').length;
  } else if (trade.assets && typeof trade.assets === 'object') {
    // Backend structure
    const backendAssets = trade.assets as BackendTradeAssets;
    return backendAssets.players?.length || 0;
  }
  return 0;
}

// Get pick count (handles both backend and legacy structures)
function getPickCount(trade: Trade): number {
  if (Array.isArray(trade.assets)) {
    // Legacy structure
    return trade.assets.filter((a: any) => a.asset_type === 'pick').length;
  } else if (trade.assets && typeof trade.assets === 'object') {
    // Backend structure
    const backendAssets = trade.assets as BackendTradeAssets;
    return backendAssets.picks?.length || 0;
  }
  return 0;
}

// Get teams for display (handles both backend and legacy structures)
function getTeams(trade: Trade) {
  return trade.teams_detail || trade.participants || [];
}

// Get sender/proposing team (handles both backend and legacy structures)
function getSenderTeam(trade: Trade) {
  return trade.proposing_team_detail || trade.sender;
}

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Check if user is proposer/sender
function isProposer(trade: Trade): boolean {
  const userTeamId = authStore.user?.team?.id;
  if (!userTeamId) return false;
  // Check both backend (sender) and legacy (proposing_team) structures
  const senderId = trade.sender?.id || trade.proposing_team;
  return senderId === userTeamId;
}

// Show actions for trade
function showActions(trade: Trade): boolean {
  const status = getTradeStatus(trade);
  // Show actions for trades waiting acceptance where user is not the sender
  if (status === 'waiting_acceptance' && !isProposer(trade)) return true;
  return false;
}
</script>

<style scoped>
.trade-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.trade-card:hover {
  transform: translateY(-2px);
}

.trade-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-row {
  display: flex;
  align-items: center;
}

.gap-1 {
  gap: 4px;
}
</style>
