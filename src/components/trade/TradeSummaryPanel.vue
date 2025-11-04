<template>
  <v-card class="trade-summary-panel">
    <v-card-title class="d-flex align-center">
      <v-icon start>swap_horiz</v-icon>
      Trade Summary
    </v-card-title>

    <v-divider />

    <v-expansion-panels v-model="openPanels" multiple>
      <v-expansion-panel
        v-for="summary in teamSummaries"
        :key="summary.teamId"
        :value="summary.teamId"
      >
        <v-expansion-panel-title>
          <div class="d-flex align-center w-100">
            <v-avatar v-if="summary.team.logo" size="32" class="mr-3">
              <v-img :src="summary.team.logo" />
            </v-avatar>
            <span class="font-weight-medium">{{ summary.team.name }}</span>
            <v-spacer />
            <div class="d-flex gap-2 mr-4">
              <v-chip
                v-if="summary.netSalary !== 0"
                :color="summary.netSalary < 0 ? 'success' : 'error'"
                size="small"
                variant="flat"
              >
                <v-icon start size="small">
                  {{ summary.netSalary < 0 ? 'arrow_downward' : 'arrow_upward' }}
                </v-icon>
                {{ formatCurrency(Math.abs(summary.netSalary)) }}
              </v-chip>
              <v-chip
                v-if="summary.netPlayers !== 0"
                :color="summary.netPlayers > 0 ? 'primary' : 'warning'"
                size="small"
                variant="flat"
              >
                <v-icon start size="small">
                  {{ summary.netPlayers > 0 ? 'arrow_upward' : 'arrow_downward' }}
                </v-icon>
                {{ Math.abs(summary.netPlayers) }} player{{ Math.abs(summary.netPlayers) !== 1 ? 's' : '' }}
              </v-chip>
            </div>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-row>
            <!-- Receiving Column -->
            <v-col cols="12" md="6">
              <div class="summary-section">
                <h4 class="text-subtitle-2 mb-2 d-flex align-center">
                  <v-icon color="success" size="small" class="mr-1">arrow_downward</v-icon>
                  Receiving
                </h4>
                <v-list density="compact">
                  <v-list-item
                    v-for="asset in summary.receiving"
                    :key="asset.id || `${asset.asset_type}-${asset.player || asset.pick}`"
                    class="px-0"
                  >
                    <template #prepend>
                      <v-icon size="small" :color="asset.asset_type === 'player' ? 'primary' : 'secondary'">
                        {{ asset.asset_type === 'player' ? 'person' : 'star' }}
                      </v-icon>
                    </template>

                    <v-list-item-title v-if="asset.asset_type === 'player' && asset.player_detail">
                      {{ asset.player_detail.full_name }}
                    </v-list-item-title>
                    <v-list-item-title v-else-if="asset.asset_type === 'pick' && asset.pick_detail">
                      {{ asset.pick_detail.year }} Round {{ asset.pick_detail.round }}
                      <PickProtectionBadge
                        v-if="asset.pick_detail.protection_type && asset.pick_detail.protection_type !== 'none'"
                        :protection="asset.pick_detail.protection_type"
                        :value="asset.pick_detail.protection_value"
                        size="x-small"
                      />
                    </v-list-item-title>

                    <v-list-item-subtitle v-if="asset.asset_type === 'player' && asset.player_detail">
                      {{ asset.player_detail.position }} - {{ asset.player_detail.nba_team }}
                    </v-list-item-subtitle>
                    <v-list-item-subtitle v-else-if="asset.asset_type === 'pick'">
                      From {{ getTeamName(asset.giving_team) }}
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item v-if="summary.receiving.length === 0" class="px-0">
                    <v-list-item-title class="text-caption text-medium-emphasis">
                      No assets received
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </div>
            </v-col>

            <!-- Giving Column -->
            <v-col cols="12" md="6">
              <div class="summary-section">
                <h4 class="text-subtitle-2 mb-2 d-flex align-center">
                  <v-icon color="warning" size="small" class="mr-1">arrow_upward</v-icon>
                  Giving
                </h4>
                <v-list density="compact">
                  <v-list-item
                    v-for="asset in summary.giving"
                    :key="asset.id || `${asset.asset_type}-${asset.player || asset.pick}`"
                    class="px-0"
                  >
                    <template #prepend>
                      <v-icon size="small" :color="asset.asset_type === 'player' ? 'primary' : 'secondary'">
                        {{ asset.asset_type === 'player' ? 'person' : 'star' }}
                      </v-icon>
                    </template>

                    <v-list-item-title v-if="asset.asset_type === 'player' && asset.player_detail">
                      {{ asset.player_detail.full_name }}
                    </v-list-item-title>
                    <v-list-item-title v-else-if="asset.asset_type === 'pick' && asset.pick_detail">
                      {{ asset.pick_detail.year }} Round {{ asset.pick_detail.round }}
                      <PickProtectionBadge
                        v-if="asset.pick_detail.protection_type && asset.pick_detail.protection_type !== 'none'"
                        :protection="asset.pick_detail.protection_type"
                        :value="asset.pick_detail.protection_value"
                        size="x-small"
                      />
                    </v-list-item-title>

                    <v-list-item-subtitle v-if="asset.asset_type === 'player' && asset.player_detail">
                      {{ asset.player_detail.position }} - {{ asset.player_detail.nba_team }}
                    </v-list-item-subtitle>
                    <v-list-item-subtitle v-else-if="asset.asset_type === 'pick'">
                      To {{ getTeamName(asset.receiving_team) }}
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item v-if="summary.giving.length === 0" class="px-0">
                    <v-list-item-title class="text-caption text-medium-emphasis">
                      No assets given
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </div>
            </v-col>
          </v-row>

          <!-- Impact Summary (if available) -->
          <v-divider v-if="summary.impact" class="my-3" />
          <v-row v-if="summary.impact" dense>
            <v-col cols="12">
              <div class="text-caption text-medium-emphasis">
                <strong>Impact:</strong>
                Cap {{ summary.impact.net_salary < 0 ? 'relief' : 'increase' }} of {{ formatCurrency(Math.abs(summary.impact.net_salary)) }},
                {{ Math.abs(summary.impact.net_players) }} player{{ Math.abs(summary.impact.net_players) !== 1 ? 's' : '' }}
                {{ summary.impact.net_players > 0 ? 'gained' : 'lost' }}
              </div>
              <div class="text-caption text-medium-emphasis mt-1">
                New cap: {{ formatCurrency(summary.impact.new_salary) }} / {{ formatCurrency(summary.impact.salary_cap) }}
                ({{ ((summary.impact.new_salary / summary.impact.salary_cap) * 100).toFixed(1) }}%)
              </div>
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-card-text v-if="teamSummaries.length === 0" class="text-center text-medium-emphasis">
      <v-icon size="48" color="grey-lighten-1">swap_horiz</v-icon>
      <p class="mt-2">No assets in trade yet</p>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Team, CreateTradeAssetData, TradeAsset, TradeTeamSummary, TeamImpact } from '@/types/trade';
import PickProtectionBadge from './PickProtectionBadge.vue';

interface Props {
  teams: Team[];
  assets: (CreateTradeAssetData | TradeAsset)[];
  validation?: { team_impacts?: Record<number, TeamImpact> } | null;
}

const props = withDefaults(defineProps<Props>(), {
  validation: null,
});

// Open all panels by default
const openPanels = ref<number[]>([]);

// Generate team summaries
const teamSummaries = computed((): TradeTeamSummary[] => {
  return props.teams.map((team) => {
    const receiving = props.assets.filter((a) => a.receiving_team === team.id);
    const giving = props.assets.filter((a) => a.giving_team === team.id);

    const impact = props.validation?.team_impacts?.[team.id];

    return {
      teamId: team.id,
      team,
      receiving,
      giving,
      netSalary: impact?.net_salary || 0,
      netPlayers: impact?.net_players || 0,
      impact,
    };
  });
});

// Helper to get team name
function getTeamName(teamId: number): string {
  const team = props.teams.find((t) => t.id === teamId);
  return team?.name || 'Unknown Team';
}

// Format currency
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
}

// Auto-open all panels when summaries are available
computed(() => {
  if (teamSummaries.value.length > 0 && openPanels.value.length === 0) {
    openPanels.value = teamSummaries.value.map((s) => s.teamId);
  }
  return teamSummaries.value;
});
</script>

<style scoped>
.trade-summary-panel {
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.summary-section {
  padding: 8px;
  border-radius: 4px;
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
}

.gap-2 {
  gap: 8px;
}
</style>
