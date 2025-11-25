<template>
  <div class="trade-summary-container">
    <v-row>
      <v-col
        v-for="summary in teamSummaries"
        :key="summary.teamId"
        cols="12"
        md="6"
        class="d-flex flex-column"
      >
        <v-card class="flex-grow-1 d-flex flex-column h-100 team-card" elevation="2">
          <!-- Team Header -->
          <v-card-item class="py-3 bg-surface-light">
            <template #prepend>
              <v-avatar v-if="summary.team.logo" size="40" class="mr-2 border">
                <v-img :src="summary.team.logo" cover />
              </v-avatar>
              <v-avatar v-else size="40" color="primary" class="mr-2">
                <span class="text-h6 text-white">{{ summary.team.name.charAt(0) }}</span>
              </v-avatar>
            </template>
            <v-card-title class="text-h6 font-weight-bold">
              {{ summary.team.name }}
            </v-card-title>
            <v-card-subtitle>
              Acquires
            </v-card-subtitle>
          </v-card-item>

          <v-divider />

          <!-- Assets List -->
          <v-list class="flex-grow-1 py-0" lines="two">
            <template v-if="summary.receiving.length > 0">
              <div v-for="(asset, index) in summary.receiving" :key="asset.id || index">
                <v-divider v-if="index > 0" inset />
                
                <!-- Player Asset -->
                <v-list-item v-if="asset.asset_type === 'player' && asset.player_detail" class="py-3">
                  <template #prepend>
                    <v-avatar color="primary-lighten-4" class="mr-3">
                      <v-icon color="primary">person</v-icon>
                    </v-avatar>
                  </template>

                  <v-list-item-title class="font-weight-bold text-body-1">
                    {{ getPlayerName(asset.player_detail) }}
                  </v-list-item-title>

                  <v-list-item-subtitle class="d-flex align-center mt-1">
                    <span class="text-body-2">{{ asset.player_detail.position || 'POS' }}</span>
                    <span class="mx-2">•</span>
                    <span class="text-body-2">{{ asset.player_detail.real_team?.name || asset.player_detail.nba_team || 'NBA Team' }}</span>
                  </v-list-item-subtitle>
                  
                  <!-- Optional: Salary info if available in player_detail or contract -->
                   <template #append>
                     <div v-if="asset.player_detail.contract?.salary" class="text-caption font-weight-medium">
                       {{ formatCurrency(asset.player_detail.contract.salary) }}
                     </div>
                   </template>
                </v-list-item>

                <!-- Pick Asset -->
                <v-list-item v-else-if="asset.asset_type === 'pick' && asset.pick_detail" class="py-3">
                  <template #prepend>
                    <v-avatar color="amber-lighten-4" class="mr-3">
                      <v-icon color="amber-darken-2">star</v-icon>
                    </v-avatar>
                  </template>

                  <v-list-item-title class="font-weight-bold text-body-1">
                    {{ asset.pick_detail.draft_year || asset.pick_detail.year }} Round {{ asset.pick_detail.round_number || asset.pick_detail.round }}
                  </v-list-item-title>

                  <v-list-item-subtitle class="mt-1">
                    <div class="d-flex flex-wrap gap-2 align-center">
                      <span class="text-body-2">From {{ getTeamName(asset.giving_team) }}</span>
                      <PickProtectionBadge
                        v-if="hasProtection(asset.pick_detail)"
                        :protection-type="getPickProtectionType(asset.pick_detail)"
                        :range-start="getPickProtectionRangeStart(asset.pick_detail)"
                        :range-end="getPickProtectionRangeEnd(asset.pick_detail)"
                        :rollover-year="getPickProtectionRolloverYear(asset.pick_detail)"
                      />
                    </div>
                    <div v-if="asset.pick_detail.original_team || asset.pick_detail.original_team_name" class="text-caption text-medium-emphasis mt-1">
                      via {{ getOriginalTeamName(asset.pick_detail) }}
                    </div>
                  </v-list-item-subtitle>
                </v-list-item>
              </div>
            </template>
            
            <v-list-item v-else class="py-8 text-center">
              <v-list-item-title class="text-grey">No assets received</v-list-item-title>
            </v-list-item>
          </v-list>

          <v-divider />

          <!-- Impact Summary Footer -->
          <v-sheet color="grey-lighten-4" class="px-4 py-3">
             <div class="d-flex align-center justify-space-between mb-2">
               <span class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis">Net Impact</span>
             </div>
             
             <div class="d-flex gap-3">
               <!-- Cap Space Impact -->
               <v-chip
                 v-if="summary.netSalary !== 0"
                 :color="summary.netSalary < 0 ? 'success' : 'error'"
                 variant="flat"
                 size="small"
                 class="font-weight-bold"
               >
                 <v-icon start size="small">
                   {{ summary.netSalary < 0 ? 'add_circle' : 'remove_circle' }}
                 </v-icon>
                 {{ summary.netSalary < 0 ? 'Save' : 'Add' }} {{ formatCurrency(Math.abs(summary.netSalary)) }}
               </v-chip>
               <v-chip v-else color="grey" variant="tonal" size="small">
                 No Cap Change
               </v-chip>

               <!-- Roster Spot Impact -->
               <v-chip
                 v-if="summary.netPlayers !== 0"
                 :color="summary.netPlayers < 0 ? 'success' : 'warning'"
                 variant="flat"
                 size="small"
                 class="font-weight-bold"
               >
                  <v-icon start size="small">
                    {{ summary.netPlayers < 0 ? 'person_remove' : 'person_add' }}
                  </v-icon>
                  {{ Math.abs(summary.netPlayers) }} Spot{{ Math.abs(summary.netPlayers) !== 1 ? 's' : '' }} {{ summary.netPlayers < 0 ? 'Open' : 'Filled' }}
               </v-chip>
                <v-chip v-else color="grey" variant="tonal" size="small">
                 No Roster Change
               </v-chip>
             </div>
             
             <!-- Total Cap Preview -->
             <div v-if="summary.impact" class="mt-3 text-caption d-flex justify-space-between align-center text-medium-emphasis">
               <span>Post-Trade Cap:</span>
               <span :class="summary.impact.new_salary > summary.impact.salary_cap ? 'text-error font-weight-bold' : ''">
                 {{ formatCurrency(summary.impact.new_salary) }} / {{ formatCurrency(summary.impact.salary_cap) }}
               </span>
             </div>
          </v-sheet>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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

function getPlayerName(playerDetail: any): string {
  return playerDetail.full_name || playerDetail.name || `${playerDetail.first_name || ''} ${playerDetail.last_name || ''}`.trim() || 'Unknown Player';
}

// Helper to get original team name
function getOriginalTeamName(pickDetail: any): string {
  // 1. Check for explicit original_team_name field (common in serializers)
  if (pickDetail.original_team_name) {
    return pickDetail.original_team_name;
  }
  
  // 2. Check if original_team is an object with a name
  if (pickDetail.original_team && typeof pickDetail.original_team === 'object' && pickDetail.original_team.name) {
    return pickDetail.original_team.name;
  }
  
  // 3. If original_team is an ID, try to find it in the trade participants
  const teamId = typeof pickDetail.original_team === 'object' ? pickDetail.original_team.id : pickDetail.original_team;
  if (teamId) {
    const team = props.teams.find((t) => t.id === teamId);
    if (team) {
      return team.name;
    }
  }
  
  // 4. Fallback if we really can't find the name
  return teamId ? `Team ${teamId}` : 'Unknown Team';
}

// Helper to check protection
function hasProtection(pickDetail: any): boolean {
  const type = getPickProtectionType(pickDetail);
  return type !== 'none' && type !== 'unprotected';
}

// Helper to get pick protection type
function getPickProtectionType(pickDetail: any): string {
  return pickDetail?.protection || pickDetail?.protection_type || 'unprotected';
}

// Helper to get pick protection range start
function getPickProtectionRangeStart(pickDetail: any): number | undefined {
  return pickDetail?.protection_metadata?.range_start ?? 
         pickDetail?.protection_metadata?.rangeStart ?? 
         pickDetail?.protection_range_start;
}

// Helper to get pick protection range end
function getPickProtectionRangeEnd(pickDetail: any): number | undefined {
  return pickDetail?.protection_metadata?.range_end ?? 
         pickDetail?.protection_metadata?.rangeEnd ?? 
         pickDetail?.protection_range_end;
}

// Helper to get pick protection rollover year
function getPickProtectionRolloverYear(pickDetail: any): number | undefined {
  return pickDetail?.protection_metadata?.rollover_year ?? 
         pickDetail?.protection_metadata?.rolloverYear ?? 
         pickDetail?.pick_rollover_year ?? 
         pickDetail?.rollover_year;
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
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
.gap-3 {
  gap: 12px;
}
.team-card {
  transition: transform 0.2s;
}
.team-card:hover {
  /* Subtle lift on hover for desktop */
  transform: translateY(-2px);
}
</style>
