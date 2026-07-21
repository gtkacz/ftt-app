<template>
  <v-card class="team-asset-selector fill-height d-flex flex-column" elevation="2" width="350">
    <!-- Team Header -->
    <div class="team-header px-4 py-3 border-b bg-surface-light">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center overflow-hidden">
           <v-avatar v-if="team.logo" size="32" class="mr-2 border bg-white">
             <v-img :src="team.logo" cover />
           </v-avatar>
           <v-avatar v-else size="32" color="primary" class="mr-2">
             <span class="text-subtitle-2 text-white font-weight-bold">{{ team.name.charAt(0) }}</span>
           </v-avatar>
           <div class="text-subtitle-1 font-weight-bold text-truncate">{{ team.name }}</div>
        </div>
        <v-btn
          v-if="!isOwnTeam"
          icon
          variant="text"
          color="error"
          size="small"
          class="ml-2"
          @click="$emit('remove-team', teamId)"
        >
          <v-icon>close</v-icon>
        </v-btn>
      </div>

      <!-- Cap Space Visualization -->
      <div class="cap-space-viz">
        <div class="d-flex justify-space-between text-caption mb-1">
          <span class="text-medium-emphasis">Cap Space</span>
          <span :class="isOverCap ? 'text-error font-weight-bold' : 'text-success font-weight-bold'">
             {{ formatCurrency(availableCapSpace) }}
          </span>
        </div>
        <v-progress-linear
          :model-value="capUsagePercentage"
          :color="isOverCap ? 'error' : 'success'"
          height="6"
          rounded
        />
      </div>
    </div>

    <!-- Asset Type Tabs -->
    <v-tabs
      v-model="activeTab"
      density="compact"
      color="secondary"
      grow
    >
      <v-tab value="players">
        <v-icon start size="small">person</v-icon>
        Players ({{ selectedPlayersCount }})
      </v-tab>
      <v-tab value="picks">
        <v-icon start size="small">star</v-icon>
        Picks ({{ selectedPicksCount }})
      </v-tab>
    </v-tabs>

    <v-divider />

    <!-- Asset Lists -->
    <v-card-text class="pa-0 flex-grow-1 overflow-y-auto" style="height: 400px;">
      <v-window v-model="activeTab" class="fill-height">
        
        <!-- Players Tab -->
        <v-window-item value="players" class="fill-height">
           <v-list density="compact" class="pa-0">
             <template v-if="availablePlayers.length > 0">
               <v-list-item
                 v-for="player in availablePlayers"
                 :key="getContractId(player)"
                 :active="isPlayerSelected(player)"
                 active-color="primary"
                 class="asset-item py-2"
                 lines="two"
               >
                 <template #prepend>
                   <v-checkbox-btn
                     :model-value="isPlayerSelected(player)"
                     color="primary"
                     class="mr-2"
                     @update:model-value="togglePlayer(player)"
                   />
                 </template>

                 <v-list-item-title class="font-weight-medium">
                   {{ player.full_name || player.name }}
                 </v-list-item-title>
                 
                 <v-list-item-subtitle class="d-flex align-center mt-1 text-caption">
                    <span class="font-weight-medium mr-2">{{ player.position }}</span>
                    <span class="text-medium-emphasis">{{ formatCurrency(player.contract?.salary || 0) }}</span>
                    <span v-if="player.contract?.years_remaining" class="ml-auto text-medium-emphasis">
                      {{ player.contract.years_remaining }}y left
                    </span>
                 </v-list-item-subtitle>

                 <!-- Destination Selector (Only visible when selected) -->
                 <div v-if="isPlayerSelected(player)" class="mt-2 pt-2 border-t">
                    <v-select
                      :model-value="getPlayerReceiver(player)"
                      :items="availableDestinations"
                      item-title="name"
                      item-value="id"
                      label="Send to"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="asset-destination-select"
                      bg-color="surface"
                      @update:model-value="(value) => updatePlayerReceiver(player, value)"
                    >
                       <template #item="{ props, item }">
                          <v-list-item v-bind="props" :title="item.raw.name">
                             <template #prepend>
                                <v-avatar size="20" class="mr-2">
                                   <v-img v-if="item.raw.logo" :src="item.raw.logo" />
                                   <span v-else class="text-caption">{{ item.raw.name.charAt(0) }}</span>
                                </v-avatar>
                             </template>
                          </v-list-item>
                       </template>
                    </v-select>
                 </div>
               </v-list-item>
             </template>
             
             <v-list-item v-else class="text-center py-8">
               <v-list-item-title class="text-medium-emphasis">No players available</v-list-item-title>
             </v-list-item>
           </v-list>
        </v-window-item>

        <!-- Picks Tab -->
        <v-window-item value="picks" class="fill-height">
          <v-list density="compact" class="pa-0">
             <template v-if="availablePicks.length > 0">
               <v-list-item
                 v-for="pick in availablePicks"
                 :key="pick.id"
                 :active="isPickSelected(pick)"
                 active-color="primary"
                 class="asset-item py-2"
                 lines="two"
               >
                 <template #prepend>
                   <v-checkbox-btn
                     :model-value="isPickSelected(pick)"
                     color="primary"
                     class="mr-2"
                     @update:model-value="togglePick(pick)"
                   />
                 </template>

                 <v-list-item-title class="font-weight-medium">
                   {{ pick.draft_year || pick.year }} Round {{ pick.round_number || pick.round }}
                 </v-list-item-title>
                 
                 <v-list-item-subtitle class="d-flex flex-wrap gap-1 align-center mt-1">
                   <v-chip size="x-small" label variant="outlined" color="secondary" class="mr-1">
                      via {{ getOriginalTeamName(pick) }}
                   </v-chip>
                   <PickProtectionBadge
                      v-if="hasProtection(pick)"
                      :protection-type="getPickProtectionType(pick)"
                      :range-start="getPickProtectionRangeStart(pick)"
                      :range-end="getPickProtectionRangeEnd(pick)"
                   />
                 </v-list-item-subtitle>

                 <!-- Destination & Protection Actions (Visible when selected) -->
                 <div v-if="isPickSelected(pick)" class="mt-2 pt-2 border-t">
                    <div class="d-flex gap-2 mb-2">
                       <v-btn
                          block
                          variant="tonal"
                          size="small"
                          prepend-icon="shield"
                          color="secondary"
                          @click="openProtectionModal(pick)"
                       >
                          {{ hasProtection(pick) ? 'Edit Protection' : 'Add Protection' }}
                       </v-btn>
                    </div>
                    <v-select
                      :model-value="getPickReceiver(pick)"
                      :items="availableDestinations"
                      item-title="name"
                      item-value="id"
                      label="Send to"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="asset-destination-select"
                      bg-color="surface"
                      @update:model-value="(value) => updatePickReceiver(pick, value)"
                    >
                        <template #item="{ props, item }">
                          <v-list-item v-bind="props" :title="item.raw.name">
                             <template #prepend>
                                <v-avatar size="20" class="mr-2">
                                   <v-img v-if="item.raw.logo" :src="item.raw.logo" />
                                   <span v-else class="text-caption">{{ item.raw.name.charAt(0) }}</span>
                                </v-avatar>
                             </template>
                          </v-list-item>
                       </template>
                    </v-select>
                 </div>
               </v-list-item>
             </template>

             <v-list-item v-else class="text-center py-8">
               <v-list-item-title class="text-medium-emphasis">No picks available</v-list-item-title>
             </v-list-item>
          </v-list>
        </v-window-item>

      </v-window>
    </v-card-text>

    <!-- Pick Protection Modal -->
    <PickProtectionModal
      v-model="protectionModalOpen"
      :pick="selectedPickForProtection"
      @save="handleProtectionSave"
    />
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Team, Player, Pick, TeamImpact, CreateTradeAssetData } from '@/types/trade';
import PickProtectionBadge from './PickProtectionBadge.vue';
import PickProtectionModal from './PickProtectionModal.vue';

interface Props {
  teamId: number;
  team: Team;
  availablePlayers: Player[];
  availablePicks: Pick[];
  selectedAssets: CreateTradeAssetData[];
  availableTeams: Team[];
  isOwnTeam?: boolean;
  impact?: TeamImpact | null;
  leagueSettings?: {
    SALARY_CAP: number;
    MIN_PLAYER_CAP: number;
    MAX_PLAYER_CAP: number;
  } | null;
}

interface Emits {
  (e: 'add-asset', asset: CreateTradeAssetData): void;
  (e: 'remove-asset', asset: CreateTradeAssetData): void;
  (e: 'update-asset', asset: CreateTradeAssetData): void;
  (e: 'remove-team', teamId: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  isOwnTeam: false,
  impact: null,
  leagueSettings: null,
});

const emit = defineEmits<Emits>();

// Active tab
const activeTab = ref<'players' | 'picks'>('players');

// Protection modal
const protectionModalOpen = ref(false);
const selectedPickForProtection = ref<Pick | null>(null);

// Count selected assets
const selectedPlayersCount = computed(() => {
  return props.selectedAssets.filter(
    a => a.asset_type === 'player' && a.giving_team === props.teamId
  ).length;
});

const selectedPicksCount = computed(() => {
  return props.selectedAssets.filter(
    a => a.asset_type === 'pick' && a.giving_team === props.teamId
  ).length;
});

// Available destinations (all teams except this one)
const availableDestinations = computed(() => {
  return props.availableTeams.filter((t) => t.id !== props.teamId);
});

// Cap space calculations
const salaryCap = computed(() => props.leagueSettings?.SALARY_CAP || 130000000);
const currentSalary = computed(() => props.impact?.new_salary ?? props.team.total_salary ?? 0);
const availableCapSpace = computed(() => salaryCap.value - currentSalary.value);
const capUsagePercentage = computed(() => Math.min((currentSalary.value / salaryCap.value) * 100, 100));
const isOverCap = computed(() => currentSalary.value > salaryCap.value);

// Get contract ID for player
function getContractId(player: Player): number {
  return player.contract?.id || (player as any).contract_id || player.id;
}

// Check if player is selected
function isPlayerSelected(player: Player): boolean {
  const contractId = getContractId(player);
  return props.selectedAssets.some(
    a => a.asset_type === 'player' && a.player === contractId
  );
}

// Check if pick is selected
function isPickSelected(pick: Pick): boolean {
  return props.selectedAssets.some(
    a => a.asset_type === 'pick' && a.pick === pick.id
  );
}

// Get default receiver (first available other team)
function getDefaultReceiver(): number {
  return availableDestinations.value.length > 0 ? availableDestinations.value[0].id : 0;
}

// Get current receiver for player asset
function getPlayerReceiver(player: Player): number {
  const contractId = getContractId(player);
  const asset = props.selectedAssets.find(
    a => a.asset_type === 'player' && a.player === contractId
  );
  return asset ? asset.receiving_team : getDefaultReceiver();
}

// Get current receiver for pick asset
function getPickReceiver(pick: Pick): number {
  const asset = props.selectedAssets.find(
    a => a.asset_type === 'pick' && a.pick === pick.id
  );
  return asset ? asset.receiving_team : getDefaultReceiver();
}

// Helper for team name
function getOriginalTeamName(pickDetail: any): string {
  if (pickDetail.original_team_name) return pickDetail.original_team_name;
  if (pickDetail.original_team && typeof pickDetail.original_team === 'object') return pickDetail.original_team.name;
  return `Team ${typeof pickDetail.original_team === 'object' ? pickDetail.original_team.id : pickDetail.original_team}`;
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

// Toggle player selection
function togglePlayer(player: Player) {
  const isSelected = isPlayerSelected(player);
  const contractId = getContractId(player);

  if (isSelected) {
    // Remove
    const asset = props.selectedAssets.find(
      a => a.asset_type === 'player' && a.player === contractId
    );
    if (asset) {
      emit('remove-asset', asset);
    }
  } else {
    // Add
    emit('add-asset', {
      asset_type: 'player',
      giving_team: props.teamId,
      receiving_team: getDefaultReceiver(),
      player: contractId,
      player_detail: player,
    });
  }
}

// Update player receiver
function updatePlayerReceiver(player: Player, receivingTeamId: number) {
  const contractId = getContractId(player);
  const asset = props.selectedAssets.find(
    a => a.asset_type === 'player' && a.player === contractId
  );
  
  if (asset) {
    emit('update-asset', {
      ...asset,
      receiving_team: receivingTeamId,
    });
  }
}

// Toggle pick selection
function togglePick(pick: Pick) {
  const isSelected = isPickSelected(pick);

  if (isSelected) {
    // Remove
    const asset = props.selectedAssets.find(
      a => a.asset_type === 'pick' && a.pick === pick.id
    );
    if (asset) {
      emit('remove-asset', asset);
    }
  } else {
    // Add
    emit('add-asset', {
      asset_type: 'pick',
      giving_team: props.teamId,
      receiving_team: getDefaultReceiver(),
      pick: pick.id,
      pick_detail: pick,
      // Initialize protection fields on the asset data structure
      // These will be populated if protection is configured later
      // but need to be present for type consistency
    } as any);
  }
}

// Update pick receiver
function updatePickReceiver(pick: Pick, receivingTeamId: number) {
  const asset = props.selectedAssets.find(
    a => a.asset_type === 'pick' && a.pick === pick.id
  );
  
  if (asset) {
    emit('update-asset', {
      ...asset,
      receiving_team: receivingTeamId,
    });
  }
}

// Protection helpers
function openProtectionModal(pick: Pick) {
  // Get current protection from selected asset if exists
  const asset = props.selectedAssets.find(
    a => a.asset_type === 'pick' && a.pick === pick.id
  );
  
  // If not selected yet, select it first
  if (!asset) {
    togglePick(pick);
    // Need to wait for parent to update prop? 
    // Ideally parent handles update and we just emit, 
    // but for modal we need current state.
    // Let's assume we can just pass the pick and defaults
  }
  
  // We pass the raw pick to the modal, but we'll need to 
  // overlay any existing protection configuration from the selected asset
  if (asset) {
    // Create a temporary object merging pick info with asset protection info
    selectedPickForProtection.value = {
      ...pick,
      protection_type: (asset as any).protection_type || pick.protection_type,
      protection_value: (asset as any).protection_value || pick.protection_value,
      // Add other protection fields if needed
    };
  } else {
    selectedPickForProtection.value = pick;
  }
  
  protectionModalOpen.value = true;
}

function handleProtectionSave(protectionData: any) {
  if (!selectedPickForProtection.value) return;
  
  const pickId = selectedPickForProtection.value.id;
  const asset = props.selectedAssets.find(
    a => a.asset_type === 'pick' && a.pick === pickId
  );
  
  if (asset) {
    emit('update-asset', {
      ...asset,
      pick_detail: {
        ...asset.pick_detail!,
        protection_type: protectionData.type,
        protection_value: protectionData.value,
        // protection_range_start: protectionData.rangeStart,
        // protection_range_end: protectionData.rangeEnd,
      },
      // Also update top-level properties for easier access
      protection_type: protectionData.type,
      protection_value: protectionData.value,
    } as any);
  }
  
  protectionModalOpen.value = false;
}

function hasProtection(pick: Pick): boolean {
  const asset = props.selectedAssets.find(a => a.asset_type === 'pick' && a.pick === pick.id);
  if (asset && (asset as any).protection_type && (asset as any).protection_type !== 'none') {
    return true;
  }
  return !!(pick.protection_type && pick.protection_type !== 'none');
}

function getPickProtectionType(pick: Pick): string {
  const asset = props.selectedAssets.find(a => a.asset_type === 'pick' && a.pick === pick.id);
  if (asset && (asset as any).protection_type) {
    return (asset as any).protection_type;
  }
  return pick.protection_type || 'unprotected';
}

function getPickProtectionRangeStart(pick: Pick): number | undefined {
  // Simplified - specific fields would need to be on asset/pick
  return undefined; 
}

function getPickProtectionRangeEnd(pick: Pick): number | undefined {
  return undefined;
}

</script>

<style scoped>
.team-asset-selector {
  flex: 0 0 350px;
  max-width: calc(100vw - 54px);
  transition: box-shadow 0.2s;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

@media (hover: hover) {
  .team-asset-selector:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
  }
}

.asset-item {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.5);
  transition: background-color 0.2s;
}

.asset-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.03);
}

.asset-item--active {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.border-t {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
</style>
