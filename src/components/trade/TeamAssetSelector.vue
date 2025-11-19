<template>
  <v-card class="team-asset-selector" elevation="2">
    <!-- Header: Team Info -->
    <v-card-title class="d-flex align-center">
      <v-avatar v-if="team.logo" size="32" class="mr-2">
        <v-img :src="team.logo" :alt="team.name" />
      </v-avatar>
      <span class="flex-grow-1">{{ team.name }}</span>
      <v-btn
        v-if="!isOwnTeam"
        icon
        size="small"
        variant="text"
        color="error"
        @click="$emit('remove-team', teamId)"
      >
        <v-icon>close</v-icon>
      </v-btn>
    </v-card-title>

    <!-- Cap and Roster Display -->
    <v-card-text class="pb-2">
      <TeamCapDisplay
        :current-salary="team.total_salary || 0"
        :salary-cap="leagueSettings?.SALARY_CAP || 130000000"
        :current-players="team.total_players || 0"
        :max-players="leagueSettings?.MAX_PLAYER_CAP || 15"
        :impact="impact"
      />
    </v-card-text>

    <!-- Tabs: Players / Picks -->
    <v-tabs v-model="activeTab" color="primary" align-tabs="center">
      <v-tab value="players">
        <v-icon start>person</v-icon>
        Players
        <v-chip
          v-if="selectedPlayersCount > 0"
          size="x-small"
          class="ml-2"
          color="primary"
        >
          {{ selectedPlayersCount }}
        </v-chip>
      </v-tab>
      <v-tab value="picks">
        <v-icon start>lasso_select</v-icon>
        Picks
        <v-chip
          v-if="selectedPicksCount > 0"
          size="x-small"
          class="ml-2"
          color="primary"
        >
          {{ selectedPicksCount }}
        </v-chip>
      </v-tab>
    </v-tabs>

    <v-card-text class="pa-0" style="max-height: 600px; overflow-y: auto;">
      <v-window v-model="activeTab">
        <!-- Players Tab -->
        <v-window-item value="players">
          <v-list density="compact">
            <v-list-item
              v-for="player in availablePlayers"
              :key="player.id"
              class="player-item"
              :class="{ 'selected': isPlayerSelected(player), 'disabled': !player.contract }"
              :disabled="!player.contract"
            >
              <template #prepend>
                <v-checkbox
                  :model-value="isPlayerSelected(player)"
                  :disabled="!player.contract"
                  density="compact"
                  hide-details
                  @update:model-value="(val) => togglePlayer(player, val)"
                />
              </template>

              <v-list-item-title>
                {{ player.full_name || `${player.first_name} ${player.last_name}` }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ player.position }} - {{ player.nba_team }}
                <span v-if="player.contract?.salary" class="ml-2">
                  ${{ formatSalary(player.contract.salary) }}
                </span>
              </v-list-item-subtitle>

              <template #append>
                <v-select
                  v-if="isPlayerSelected(player)"
                  :model-value="getPlayerReceiver(player)"
                  :items="availableDestinations"
                  item-title="name"
                  item-value="id"
                  density="compact"
                  hide-details
                  variant="outlined"
                  style="min-width: 150px;"
                  @update:model-value="(value) => updatePlayerReceiver(player, value)"
                >
                  <template #prepend-inner>
                    <v-icon size="small">arrow_right_alt</v-icon>
                  </template>
                </v-select>
              </template>
            </v-list-item>

            <v-list-item v-if="availablePlayers.length === 0">
              <v-list-item-title class="text-center text-medium-emphasis">
                No players available
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-window-item>

        <!-- Picks Tab -->
        <v-window-item value="picks">
          <v-list density="compact">
            <v-list-item
              v-for="pick in availablePicks"
              :key="pick.id"
              class="pick-item"
              :class="{ 'selected': isPickSelected(pick) }"
            >
              <template #prepend>
                <v-checkbox
                  :model-value="isPickSelected(pick)"
                  density="compact"
                  hide-details
                  @update:model-value="(val) => togglePick(pick, val)"
                />
              </template>

              <v-list-item-title>
                {{ pick.display_name || `${pick.year} Round ${pick.round}` }}
              </v-list-item-title>
              <v-list-item-subtitle>
                <PickProtectionBadge
                  v-if="getPickProtection(pick) && getPickProtection(pick) !== 'unprotected'"
                  :protection="getPickProtection(pick)"
                  :value="getPickProtectionValue(pick)"
                />
                <span v-else class="text-caption text-medium-emphasis">Unprotected</span>
              </v-list-item-subtitle>

              <template #append>
                <div class="d-flex align-center gap-2">
                  <v-btn
                    v-if="isPickSelected(pick)"
                    icon
                    size="small"
                    variant="text"
                    color="primary"
                    @click="openProtectionModal(pick)"
                  >
                    <v-icon size="small">shield</v-icon>
                  </v-btn>
                  <v-select
                    v-if="isPickSelected(pick)"
                    :model-value="getPickReceiver(pick)"
                    :items="availableDestinations"
                    item-title="name"
                    item-value="id"
                    density="compact"
                    hide-details
                    variant="outlined"
                    style="min-width: 150px;"
                    @update:model-value="(value) => updatePickReceiver(pick, value)"
                  >
                    <template #prepend-inner>
                      <v-icon size="small">arrow_right_alt</v-icon>
                    </template>
                  </v-select>
                </div>
              </template>
            </v-list-item>

            <v-list-item v-if="availablePicks.length === 0">
              <v-list-item-title class="text-center text-medium-emphasis">
                No picks available
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>

  <!-- Pick Protection Modal -->
  <PickProtectionModal
    v-model="protectionModalOpen"
    :pick="selectedPickForProtection"
    @save="handleProtectionSave"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Team, Player, Pick, TeamImpact, CreateTradeAssetData } from '@/types/trade';
import TeamCapDisplay from './TeamCapDisplay.vue';
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

// Get player receiver
function getPlayerReceiver(player: Player): number | undefined {
  const contractId = getContractId(player);
  const asset = props.selectedAssets.find(
    a => a.asset_type === 'player' && a.player === contractId
  );
  return asset?.receiving_team;
}

// Get pick receiver
function getPickReceiver(pick: Pick): number | undefined {
  const asset = props.selectedAssets.find(
    a => a.asset_type === 'pick' && a.pick === pick.id
  );
  return asset?.receiving_team;
}

// Get pick protection
function getPickProtection(pick: Pick): string | undefined {
  const asset = props.selectedAssets.find(
    a => a.asset_type === 'pick' && a.pick === pick.id
  );
  return (asset as any)?.protection_type || 
         (asset as any)?.pick_detail?.protection_type || 
         'unprotected';
}

// Get pick protection value
function getPickProtectionValue(pick: Pick): number | undefined {
  const asset = props.selectedAssets.find(
    a => a.asset_type === 'pick' && a.pick === pick.id
  );
  return (asset as any)?.protection_value || 
         (asset as any)?.pick_detail?.protection_value;
}

// Toggle player selection
function togglePlayer(player: Player, selected: boolean) {
  if (selected) {
    // Add player - need contract ID
    const contractId = getContractId(player);
    if (!player.contract || !contractId || contractId === player.id) {
      // If no contract, we can't trade this player
      console.warn('Player has no contract, cannot add to trade', player);
      return;
    }
    if (availableDestinations.value.length === 0) {
      console.warn('No available destination teams');
      return;
    }
    const asset: CreateTradeAssetData = {
      asset_type: 'player',
      giving_team: props.teamId,
      receiving_team: availableDestinations.value[0].id, // Default to first available team
      player: contractId, // Contract ID for backend
      player_detail: player,
    };
    emit('add-asset', asset);
  } else {
    // Remove player - find by contract ID
    const contractId = getContractId(player);
    const asset = props.selectedAssets.find(
      a => a.asset_type === 'player' && a.player === contractId
    );
    if (asset) {
      emit('remove-asset', asset);
    }
  }
}

// Toggle pick selection
function togglePick(pick: Pick, selected: boolean) {
  if (selected) {
    if (availableDestinations.value.length === 0) {
      console.warn('No available destination teams');
      return;
    }
    const asset: CreateTradeAssetData = {
      asset_type: 'pick',
      giving_team: props.teamId,
      receiving_team: availableDestinations.value[0].id, // Default to first available team
      pick: pick.id,
      pick_detail: pick,
    };
    emit('add-asset', asset);
  } else {
    const asset = props.selectedAssets.find(
      a => a.asset_type === 'pick' && a.pick === pick.id
    );
    if (asset) {
      emit('remove-asset', asset);
    }
  }
}

// Update player receiver
function updatePlayerReceiver(player: Player, receiverId: number) {
  const contractId = getContractId(player);
  const asset = props.selectedAssets.find(
    a => a.asset_type === 'player' && a.player === contractId
  );
  if (asset) {
    const updated: CreateTradeAssetData = {
      ...asset,
      receiving_team: receiverId,
    };
    emit('update-asset', updated);
  }
}

// Update pick receiver
function updatePickReceiver(pick: Pick, receiverId: number) {
  const asset = props.selectedAssets.find(
    a => a.asset_type === 'pick' && a.pick === pick.id
  );
  if (asset) {
    const updated: CreateTradeAssetData = {
      ...asset,
      receiving_team: receiverId,
    };
    emit('update-asset', updated);
  }
}

// Open protection modal
function openProtectionModal(pick: Pick) {
  selectedPickForProtection.value = pick;
  protectionModalOpen.value = true;
}

// Handle protection save
function handleProtectionSave(protection: { type: string; value?: number }) {
  const asset = props.selectedAssets.find(
    a => a.asset_type === 'pick' && a.pick === selectedPickForProtection.value?.id
  );
  if (asset && selectedPickForProtection.value) {
    const updated: CreateTradeAssetData = {
      ...asset,
      pick_detail: {
        ...selectedPickForProtection.value,
        protection_type: protection.type as any,
        protection_value: protection.value,
      },
      // Also store protection at top level for easy access
      protection_type: protection.type as any,
      protection_value: protection.value,
    } as any;
    emit('update-asset', updated);
  }
  protectionModalOpen.value = false;
  selectedPickForProtection.value = null;
}

// Format salary
function formatSalary(salary: number): string {
  if (salary >= 1000000) {
    return `${(salary / 1000000).toFixed(1)}M`;
  }
  if (salary >= 1000) {
    return `${(salary / 1000).toFixed(0)}K`;
  }
  return salary.toString();
}
</script>

<style scoped>
.team-asset-selector {
  min-width: 400px;
  max-width: 500px;
  height: 100%;
}

.player-item.selected,
.pick-item.selected {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.gap-2 {
  gap: 8px;
}
</style>

