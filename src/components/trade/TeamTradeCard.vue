<template>
  <v-card class="team-trade-card" elevation="2">
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
        :salary-cap="team.salary_cap || 130000000"
        :current-players="team.total_players || 0"
        :max-players="team.max_player_cap || 15"
        :impact="impact"
      />
    </v-card-text>

    <!-- Tabs: Players / Picks -->
    <v-tabs v-model="activeTab" color="primary" align-tabs="center">
      <v-tab value="players">
        <v-icon start>person</v-icon>
        Players
      </v-tab>
      <v-tab value="picks">
        <v-icon start>lasso_select</v-icon>
        Picks
      </v-tab>
    </v-tabs>

    <v-card-text class="pa-0">
      <v-window v-model="activeTab">
        <!-- Players Tab -->
        <v-window-item value="players">
          <v-data-table
            :headers="playerHeaders"
            :items="playerAssets"
            density="compact"
            :items-per-page="-1"
            hide-default-footer
            class="asset-table"
          >
            <template #top>
              <v-toolbar flat density="compact">
                <v-spacer />
                <v-btn
                  color="primary"
                  size="small"
                  @click="$emit('add-asset', { teamId, assetType: 'player' })"
                >
                  <v-icon start>add</v-icon>
                  Add Player
                </v-btn>
              </v-toolbar>
            </template>

            <template #[`item.player`]="{ item }">
              <div v-if="item.player_detail" class="d-flex align-center">
                <div>
                  <div class="font-weight-medium">
                    {{ item.player_detail.first_name }} {{ item.player_detail.last_name }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ item.player_detail.position }} - {{ item.player_detail.nba_team }}
                  </div>
                </div>
              </div>
            </template>

            <template #[`item.destination`]="{ item }">
              <v-select
                :model-value="item.receiving_team"
                :items="availableDestinations"
                item-title="name"
                item-value="id"
                density="compact"
                hide-details
                variant="outlined"
                @update:model-value="(value) => $emit('update-destination', { asset: item, receivingTeam: value })"
              >
                <template #prepend-inner>
                  <v-icon size="small">arrow_right_alt</v-icon>
                </template>
              </v-select>
            </template>

            <template #[`item.actions`]="{ item }">
              <v-btn
                icon
                size="x-small"
                variant="text"
                color="error"
                @click="$emit('remove-asset', item)"
              >
                <v-icon size="small">backspace</v-icon>
              </v-btn>
            </template>

            <template #no-data>
              <div class="text-center pa-4 text-medium-emphasis">
                No players added yet
              </div>
            </template>
          </v-data-table>
        </v-window-item>

        <!-- Picks Tab -->
        <v-window-item value="picks">
          <v-data-table
            :headers="pickHeaders"
            :items="pickAssets"
            density="compact"
            :items-per-page="-1"
            hide-default-footer
            class="asset-table"
          >
            <template #top>
              <v-toolbar flat density="compact">
                <v-spacer />
                <v-btn
                  color="primary"
                  size="small"
                  @click="$emit('add-asset', { teamId, assetType: 'pick' })"
                >
                  <v-icon start>add</v-icon>
                  Add Pick
                </v-btn>
              </v-toolbar>
            </template>

            <template #[`item.pick`]="{ item }">
              <div v-if="item.pick_detail">
                <div class="font-weight-medium">
                  {{ item.pick_detail.year }} Round {{ item.pick_detail.round }}
                </div>
                <div v-if="item.pick_detail.protection_type && item.pick_detail.protection_type !== 'none'" class="text-caption">
                  <PickProtectionBadge :protection="item.pick_detail.protection_type" :value="item.pick_detail.protection_value" />
                </div>
              </div>
            </template>

            <template #[`item.destination`]="{ item }">
              <v-select
                :model-value="item.receiving_team"
                :items="availableDestinations"
                item-title="name"
                item-value="id"
                density="compact"
                hide-details
                variant="outlined"
                @update:model-value="(value) => $emit('update-destination', { asset: item, receivingTeam: value })"
              >
                <template #prepend-inner>
                  <v-icon size="small">arrow_right_alt</v-icon>
                </template>
              </v-select>
            </template>

            <template #[`item.actions`]="{ item }">
              <v-btn
                icon
                size="x-small"
                variant="text"
                color="error"
                @click="$emit('remove-asset', item)"
              >
                <v-icon size="small">backspace</v-icon>
              </v-btn>
            </template>

            <template #no-data>
              <div class="text-center pa-4 text-medium-emphasis">
                No picks added yet
              </div>
            </template>
          </v-data-table>
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Team, CreateTradeAssetData, TeamImpact } from '@/types/trade';
import TeamCapDisplay from './TeamCapDisplay.vue';
import PickProtectionBadge from './PickProtectionBadge.vue';

interface Props {
  teamId: number;
  team: Team;
  assets: CreateTradeAssetData[];
  availableTeams: Team[];
  isOwnTeam?: boolean;
  impact?: TeamImpact | null;
}

interface Emits {
  (e: 'add-asset', payload: { teamId: number; assetType: 'player' | 'pick' }): void;
  (e: 'remove-asset', asset: CreateTradeAssetData): void;
  (e: 'update-destination', payload: { asset: CreateTradeAssetData; receivingTeam: number }): void;
  (e: 'remove-team', teamId: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  isOwnTeam: false,
  impact: null,
});

defineEmits<Emits>();

// Active tab
const activeTab = ref<'players' | 'picks'>('players');

// Filter assets by type
const playerAssets = computed(() => {
  return props.assets.filter((a) => a.asset_type === 'player' && a.giving_team === props.teamId);
});

const pickAssets = computed(() => {
  return props.assets.filter((a) => a.asset_type === 'pick' && a.giving_team === props.teamId);
});

// Available destinations (all teams except this one)
const availableDestinations = computed(() => {
  return props.availableTeams.filter((t) => t.id !== props.teamId);
});

// Table headers
const playerHeaders = [
  { title: 'Player', key: 'player', sortable: false },
  { title: 'To', key: 'destination', sortable: false, width: '200px' },
  { title: '', key: 'actions', sortable: false, width: '50px', align: 'center' as const },
];

const pickHeaders = [
  { title: 'Pick', key: 'pick', sortable: false },
  { title: 'To', key: 'destination', sortable: false, width: '200px' },
  { title: '', key: 'actions', sortable: false, width: '50px', align: 'center' as const },
];
</script>

<style scoped>
.team-trade-card {
  min-width: 350px;
  max-width: 500px;
  height: 100%;
}

.asset-table :deep(.v-data-table__th) {
  font-size: 0.75rem;
  font-weight: 600;
}

.asset-table :deep(.v-data-table__td) {
  padding: 8px 12px;
}
</style>
