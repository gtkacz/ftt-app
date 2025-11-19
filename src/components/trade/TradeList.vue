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
          :class="`trade-card--${getTradeStatus(trade)}`"
          @click="$emit('trade-click', trade)"
        >
          <!-- Status Accent Border -->
          <div class="trade-card__accent" :class="`trade-card__accent--${getStatusColor(getTradeStatus(trade))}`"></div>

          <!-- Card Header -->
          <v-card-title class="trade-card__header">
            <div class="d-flex align-center">
              <v-chip 
                :color="getStatusColor(getTradeStatus(trade))" 
                size="small" 
                variant="flat"
                class="trade-card__status-chip"
              >
                <v-icon start size="small">{{ getStatusIcon(getTradeStatus(trade)) }}</v-icon>
                {{ getStatusDisplay(getTradeStatus(trade)) }}
              </v-chip>
            </div>
            <v-spacer />
            <span class="text-caption text-medium-emphasis trade-card__id">#{{ trade.id }}</span>
          </v-card-title>

          <v-divider class="mx-4" />

          <!-- Trade Teams -->
          <v-card-subtitle class="trade-card__teams pt-3 pb-2">
            <div class="d-flex flex-wrap align-center gap-2">
              <div
                v-for="team in getTeams(trade)"
                :key="team.id"
                class="team-chip"
              >
                <v-avatar v-if="team.logo" size="20" class="mr-1">
                  <v-img :src="team.logo" />
                </v-avatar>
                <v-chip
                  size="small"
                  variant="outlined"
                  class="team-chip__content"
                >
                  {{ team.name }}
                </v-chip>
              </div>
            </div>
          </v-card-subtitle>

          <!-- Trade Summary -->
          <v-card-text class="trade-card__content">
            <!-- Asset Preview Badges -->
            <div class="asset-badges mb-3">
              <v-chip
                v-if="getPlayerCount(trade) > 0"
                size="small"
                color="primary"
                variant="flat"
                class="asset-badge"
              >
                <v-icon start size="small">person</v-icon>
                {{ getPlayerCount(trade) }} player{{ getPlayerCount(trade) !== 1 ? 's' : '' }}
              </v-chip>
              <v-chip
                v-if="getPickCount(trade) > 0"
                size="small"
                color="secondary"
                variant="flat"
                class="asset-badge"
              >
                <v-icon start size="small">star</v-icon>
                {{ getPickCount(trade) }} pick{{ getPickCount(trade) !== 1 ? 's' : '' }}
              </v-chip>
            </div>

            <v-divider class="my-3" />

            <!-- Trade Metadata -->
            <div class="trade-metadata">
              <div class="metadata-item">
                <v-icon size="small" color="primary" class="mr-2">schedule</v-icon>
                <span class="text-caption">{{ formatDate(trade.created_at) }}</span>
              </div>
              <div class="metadata-item mt-2">
                <v-icon size="small" color="info" class="mr-2">group</v-icon>
                <span class="text-caption text-medium-emphasis">Proposed by: </span>
                <span class="text-caption font-weight-medium">{{ getSenderTeam(trade)?.name || 'Unknown Team' }}</span>
              </div>
            </div>

            <!-- Notes Preview (if available) -->
            <div v-if="trade.notes" class="mt-3 pt-3 border-t">
              <div class="d-flex align-start">
                <v-icon size="small" color="grey" class="mr-2 mt-1">note</v-icon>
                <p class="text-caption text-medium-emphasis text-truncate flex-grow-1">
                  {{ trade.notes }}
                </p>
              </div>
            </div>
          </v-card-text>

          <!-- Card Actions -->
          <v-card-actions v-if="showActions(trade)" class="trade-card__actions">
            <v-spacer />

            <!-- Draft Actions -->
            <template v-if="trade.status === 'draft'">
              <v-btn
                size="small"
                variant="outlined"
                color="primary"
                class="action-btn"
                @click.stop="$emit('edit-trade', trade)"
              >
                <v-icon start size="small">edit</v-icon>
                Edit
              </v-btn>
              <v-btn
                size="small"
                variant="outlined"
                color="error"
                class="action-btn"
                @click.stop="$emit('delete-trade', trade)"
              >
                <v-icon start size="small">delete</v-icon>
                Delete
              </v-btn>
            </template>

            <!-- Waiting Acceptance Actions (for recipients) -->
            <template v-if="getTradeStatus(trade) === 'waiting_acceptance' && !isProposer(trade)">
              <v-btn
                size="small"
                color="success"
                variant="flat"
                class="action-btn action-btn--success"
                @click.stop="$emit('respond-trade', { trade, response: 'accept' })"
              >
                <v-icon start size="small">check</v-icon>
                Accept
              </v-btn>
              <v-btn
                size="small"
                color="warning"
                variant="outlined"
                class="action-btn"
                @click.stop="$emit('respond-trade', { trade, response: 'counter' })"
              >
                <v-icon start size="small">edit</v-icon>
                Counter
              </v-btn>
              <v-btn
                size="small"
                color="error"
                variant="outlined"
                class="action-btn"
                @click.stop="$emit('respond-trade', { trade, response: 'reject' })"
              >
                <v-icon start size="small">close</v-icon>
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

// Get status icon
function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    draft: 'edit',
    proposed: 'send',
    waiting_acceptance: 'schedule',
    waiting_approval: 'gavel',
    accepted: 'check_circle',
    approved: 'verified',
    vetoed: 'block',
    rejected: 'cancel',
    completed: 'done_all',
    unknown: 'help',
  };
  return icons[status] || 'help';
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

.trade-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, transparent, rgba(var(--v-theme-primary), 0.3), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}

.trade-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

.trade-card:hover::before {
  opacity: 1;
}

.trade-card__accent {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  transition: width 0.3s;
}

.trade-card:hover .trade-card__accent {
  width: 6px;
}

.trade-card__accent--info {
  background: linear-gradient(180deg, rgb(var(--v-theme-info)), rgb(var(--v-theme-info-lighten-1)));
}

.trade-card__accent--warning {
  background: linear-gradient(180deg, rgb(var(--v-theme-warning)), rgb(var(--v-theme-warning-lighten-1)));
}

.trade-card__accent--success {
  background: linear-gradient(180deg, rgb(var(--v-theme-success)), rgb(var(--v-theme-success-lighten-1)));
}

.trade-card__accent--error {
  background: linear-gradient(180deg, rgb(var(--v-theme-error)), rgb(var(--v-theme-error-lighten-1)));
}

.trade-card__accent--grey {
  background: linear-gradient(180deg, rgb(var(--v-theme-grey)), rgb(var(--v-theme-grey-lighten-1)));
}

.trade-card__header {
  padding: 16px 16px 12px 20px;
  min-height: 56px;
}

.trade-card__status-chip {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.trade-card__id {
  font-family: 'Roboto Mono', monospace;
  font-weight: 500;
}

.trade-card__teams {
  padding: 8px 16px 8px 20px;
}

.team-chip {
  display: flex;
  align-items: center;
}

.team-chip__content {
  font-weight: 500;
}

.trade-card__content {
  padding: 12px 16px 12px 20px;
}

.asset-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.asset-badge {
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.asset-badge:hover {
  transform: scale(1.05);
}

.trade-metadata {
  display: flex;
  flex-direction: column;
}

.metadata-item {
  display: flex;
  align-items: center;
}

.border-t {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.trade-card__actions {
  padding: 8px 16px 12px 20px;
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
}

.action-btn {
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0.3px;
  transition: all 0.2s;
  margin-left: 4px;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.action-btn--success {
  box-shadow: 0 2px 4px rgba(var(--v-theme-success), 0.3);
}

.gap-2 {
  gap: 8px;
}

/* Status-specific styling */
.trade-card--waiting_acceptance {
  border-left: 4px solid rgb(var(--v-theme-info));
}

.trade-card--accepted {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.trade-card--completed {
  border-left: 4px solid rgb(var(--v-theme-success));
}

.trade-card--rejected,
.trade-card--vetoed {
  border-left: 4px solid rgb(var(--v-theme-error));
  opacity: 0.85;
}

.trade-card--draft {
  border-left: 4px solid rgb(var(--v-theme-grey));
}
</style>
