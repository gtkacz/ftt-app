<template>
  <v-card class="commissioner-panel" elevation="2">
    <v-card-title class="panel-header">
      <v-icon icon="gavel" class="mr-2" />
      Commissioner Review
      <v-spacer />
      <v-chip
        :color="statusColor"
        variant="tonal"
        size="small"
      >
        {{ statusText }}
      </v-chip>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-4">
      <!-- Trade Summary -->
      <div class="trade-summary mb-4">
        <div class="text-subtitle-1 font-weight-medium mb-2">Trade Summary</div>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="text-caption text-medium-emphasis">Trade ID: </span>
            <span class="text-body-2">{{ trade.id }}</span>
          </div>
          <div class="summary-item">
            <span class="text-caption text-medium-emphasis">Proposed by: </span>
            <span class="text-body-2">{{ getProposingTeamName() }}</span>
          </div>
          <div class="summary-item">
            <span class="text-caption text-medium-emphasis">Teams Involved: </span>
            <span class="text-body-2">{{ trade.teams.length }}</span>
          </div>
          <div class="summary-item">
            <span class="text-caption text-medium-emphasis">Proposed: </span>
            <span class="text-body-2">{{ formatDate(trade.proposed_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Team Responses -->
      <div class="team-responses mb-4">
        <div class="text-subtitle-1 font-weight-medium mb-2">Team Responses</div>
        <v-list density="compact" class="pa-0">
          <v-list-item
            v-for="offer in trade.offers"
            :key="offer.id"
            class="response-item"
          >
            <template #prepend>
              <v-icon
                :icon="getResponseIcon(offer.status)"
                :color="getResponseColor(offer.status)"
                size="small"
              />
            </template>

            <v-list-item-title>
              {{ getTeamName(offer.team) }}
            </v-list-item-title>

            <v-list-item-subtitle>
              <v-chip
                :color="getResponseColor(offer.status)"
                variant="tonal"
                size="x-small"
              >
                {{ offer.status.toUpperCase() }}
              </v-chip>
              <span v-if="offer.responded_at" class="ml-2 text-caption">
                {{ formatDate(offer.responded_at) }}
              </span>
            </v-list-item-subtitle>

            <template v-if="offer.message" #append>
              <v-tooltip location="top">
                <template #activator="{ props: tooltipProps }">
                  <v-icon v-bind="tooltipProps" icon="comment" size="small" />
                </template>
                {{ offer.message }}
              </v-tooltip>
            </template>
          </v-list-item>
        </v-list>
      </div>

      <!-- Admin Override Notice (only shown for admins when not all teams accepted) -->
      <v-alert
        v-if="isSuperuser && !allTeamsAccepted && canTakeActionAsSuperuser"
        type="warning"
        density="compact"
        class="mb-4"
      >
        <div class="d-flex align-center">
          <v-icon icon="admin_panel_settings" class="mr-2" />
          <div>
            <div class="text-subtitle-2 font-weight-medium">Admin Override Available</div>
            <div class="text-caption">You can approve this trade without all team acceptances using admin privileges.</div>
          </div>
        </div>
      </v-alert>

      <!-- Validation Results -->
      <div v-if="validation" class="validation-results mb-4">
        <div class="text-subtitle-1 font-weight-medium mb-2">Validation Results</div>
        <v-alert
          :type="validation.valid ? 'success' : 'error'"
          density="compact"
          class="mb-2"
        >
          {{ validation.valid ? 'Trade is valid' : 'Trade has errors' }}
        </v-alert>

        <div v-if="validation.errors.length > 0" class="mb-2">
          <div class="text-subtitle-2 text-error mb-1">Errors:</div>
          <v-chip
            v-for="(error, index) in validation.errors"
            :key="`error-${index}`"
            color="error"
            variant="outlined"
            size="small"
            class="ma-1"
          >
            {{ error }}
          </v-chip>
        </div>

        <div v-if="validation.warnings.length > 0">
          <div class="text-subtitle-2 text-warning mb-1">Warnings:</div>
          <v-chip
            v-for="(warning, index) in validation.warnings"
            :key="`warning-${index}`"
            color="warning"
            variant="outlined"
            size="small"
            class="ma-1"
          >
            {{ warning }}
          </v-chip>
        </div>
      </div>

      <!-- Team Impacts Summary -->
      <div v-if="validation" class="team-impacts mb-4">
        <div class="text-subtitle-1 font-weight-medium mb-2">Team Impacts</div>
        <v-expansion-panels variant="accordion">
          <v-expansion-panel
            v-for="teamId in getTeamIds()"
            :key="teamId"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center justify-space-between w-100">
                <span>{{ getTeamName(teamId) }}</span>
                <v-chip
                  v-if="!isImpactValid(teamId)"
                  color="error"
                  variant="tonal"
                  size="x-small"
                  class="mr-4"
                >
                  Cap Violation
                </v-chip>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="impact-details">
                <div class="impact-row">
                  <span>Current Salary:</span>
                  <span>${formatMoney(getTeamImpact(teamId)?.current_salary)}</span>
                </div>
                <div class="impact-row">
                  <span>New Salary:</span>
                  <span>${formatMoney(getTeamImpact(teamId)?.new_salary)}</span>
                </div>
                <div class="impact-row">
                  <span>Net Change:</span>
                  <span :class="getSalaryChangeClass(teamId)">
                    {{ formatNetChange(getTeamImpact(teamId)?.net_salary) }}
                  </span>
                </div>
                <v-divider class="my-2" />
                <div class="impact-row">
                  <span>Current Roster:</span>
                  <span>{{ getTeamImpact(teamId)?.current_player_count }} players</span>
                </div>
                <div class="impact-row">
                  <span>New Roster:</span>
                  <span>{{ getTeamImpact(teamId)?.new_player_count }} players</span>
                </div>
                <div class="impact-row">
                  <span>Net Change:</span>
                  <span :class="getRosterChangeClass(teamId)">
                    {{ formatNetChange(getTeamImpact(teamId)?.net_players) }} players
                  </span>
                </div>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>

      <!-- Veto Form (only shown when vetoing) -->
      <div v-if="showVetoForm" class="veto-form mb-4">
        <v-textarea
          v-model="vetoReason"
          label="Veto Reason (Required)"
          variant="outlined"
          rows="3"
          placeholder="Explain why this trade is being vetoed..."
          :rules="[v => !!v || 'Veto reason is required']"
        />
      </div>
    </v-card-text>

    <v-divider />

    <v-card-actions class="pa-4">
      <v-btn
        v-if="!showVetoForm"
        variant="outlined"
        color="error"
        @click="showVetoForm = true"
        :disabled="isProcessing || !canTakeAction"
      >
        <v-icon icon="gavel" class="mr-2" />
        Veto Trade
      </v-btn>

      <v-btn
        v-if="showVetoForm"
        variant="text"
        @click="cancelVeto"
      >
        Cancel
      </v-btn>

      <v-spacer />

      <v-btn
        v-if="showVetoForm"
        color="error"
        variant="flat"
        :loading="isProcessing"
        :disabled="!vetoReason"
        @click="confirmVeto"
      >
        <v-icon icon="block" class="mr-2" />
        Confirm Veto
      </v-btn>

      <v-btn
        v-else
        color="success"
        variant="flat"
        :loading="isProcessing"
        :disabled="!canApprove"
        @click="confirmApprove"
      >
        <v-icon icon="check_circle" class="mr-2" />
        Approve Trade
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { format, parseISO } from 'date-fns';
import type { Trade, Team, TradeValidationResponse, TeamImpact } from '@/types/trade';

interface Props {
  trade: Trade;
  teams: Team[];
  validation: TradeValidationResponse | null;
  isSuperuser?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSuperuser: false,
});

const emit = defineEmits<{
  approve: [];
  veto: [reason: string];
}>();

const showVetoForm = ref(false);
const vetoReason = ref('');
const isProcessing = ref(false);

const statusColor = computed(() => {
  switch (props.trade.status) {
    case 'waiting_approval':
      return 'warning';
    case 'approved':
      return 'success';
    case 'vetoed':
      return 'error';
    default:
      return 'grey';
  }
});

const statusText = computed(() => {
  switch (props.trade.status) {
    case 'waiting_approval':
      return 'Awaiting Approval';
    case 'approved':
      return 'Approved';
    case 'vetoed':
      return 'Vetoed';
    default:
      return props.trade.status.toUpperCase();
  }
});

const allTeamsAccepted = computed(() => {
  if (!props.trade.offers || props.trade.offers.length === 0) return false;
  return props.trade.offers.every(offer => offer.status === 'accepted');
});

const canTakeAction = computed(() => {
  return props.trade.status === 'waiting_approval' || props.trade.status === 'proposed';
});

const canTakeActionAsSuperuser = computed(() => {
  return props.trade.status === 'proposed' || props.trade.status === 'waiting_approval';
});

const canApprove = computed(() => {
  if (!props.validation?.valid) return false;

  if (props.isSuperuser) {
    return canTakeActionAsSuperuser.value;
  }

  return canTakeAction.value && allTeamsAccepted.value;
});

function getTeamName(teamIdOrTeam: Team | number): string {
  if (typeof teamIdOrTeam === 'number') {
    const team = props.teams.find(t => t.id === teamIdOrTeam);
    return team?.name || `Team ${teamIdOrTeam}`;
  }
  return teamIdOrTeam.name;
}

function getProposingTeamName(): string {
  return getTeamName(props.trade.proposing_team);
}

function getTeamIds(): number[] {
  return props.trade.teams.map(t => typeof t === 'number' ? t : t.id);
}

function getTeamImpact(teamId: number): TeamImpact | undefined {
  return props.validation?.team_impacts[teamId];
}

function isImpactValid(teamId: number): boolean {
  const impact = getTeamImpact(teamId);
  if (!impact) return true;
  return impact.under_salary_cap && impact.under_player_cap;
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  try {
    return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
  } catch {
    return dateString;
  }
}

function formatMoney(amount: number | undefined): string {
  if (amount === undefined) return '0';
  return (amount / 1000000).toFixed(2) + 'M';
}

function formatNetChange(amount: number | undefined): string {
  if (amount === undefined) return '0';
  const sign = amount >= 0 ? '+' : '';
  return sign + (amount / 1000000).toFixed(2) + 'M';
}

function getSalaryChangeClass(teamId: number): string {
  const impact = getTeamImpact(teamId);
  if (!impact) return '';
  return impact.net_salary > 0 ? 'text-error' : 'text-success';
}

function getRosterChangeClass(teamId: number): string {
  const impact = getTeamImpact(teamId);
  if (!impact) return '';
  return impact.net_players > 0 ? 'text-success' : 'text-error';
}

function getResponseIcon(status: string): string {
  const iconMap: Record<string, string> = {
    pending: 'schedule',
    accepted: 'check_circle',
    rejected: 'cancel',
    countered: 'sync_alt',
  };
  return iconMap[status] || 'help';
}

function getResponseColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'warning',
    accepted: 'success',
    rejected: 'error',
    countered: 'info',
  };
  return colorMap[status] || 'grey';
}

async function confirmApprove() {
  if (!canApprove.value) return;

  if (!confirm('Are you sure you want to approve this trade? This action cannot be undone.')) {
    return;
  }

  isProcessing.value = true;
  try {
    emit('approve');
  } finally {
    isProcessing.value = false;
  }
}

async function confirmVeto() {
  if (!vetoReason.value) return;

  if (!confirm('Are you sure you want to veto this trade? This action cannot be undone.')) {
    return;
  }

  isProcessing.value = true;
  try {
    emit('veto', vetoReason.value);
  } finally {
    isProcessing.value = false;
    showVetoForm.value = false;
    vetoReason.value = '';
  }
}

function cancelVeto() {
  showVetoForm.value = false;
  vetoReason.value = '';
}
</script>

<style scoped lang="scss">
.commissioner-panel {
  .panel-header {
    padding: 16px;
    background: rgba(var(--v-theme-surface-variant), 0.3);
  }

  .trade-summary {
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;

      .summary-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
    }
  }

  .team-responses {
    .response-item {
      border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));

      &:last-child {
        border-bottom: none;
      }
    }
  }

  .team-impacts {
    .impact-details {
      .impact-row {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        font-size: 0.875rem;

        &:not(:last-child) {
          border-bottom: 1px dashed rgba(var(--v-border-color), 0.3);
        }
      }
    }
  }

  .veto-form {
    padding: 16px;
    background: rgba(var(--v-theme-error), 0.05);
    border: 1px solid rgba(var(--v-theme-error), 0.3);
    border-radius: 8px;
  }
}
</style>
