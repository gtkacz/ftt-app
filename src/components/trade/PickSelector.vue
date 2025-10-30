<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between">
      <div>
        <v-icon icon="emoji_events" class="mr-2" />
        Select Draft Pick
      </div>
      <v-btn icon="close" variant="text" @click="$emit('close')" />
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-4">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
        <div class="text-caption text-medium-emphasis mt-2">Loading picks...</div>
      </div>

      <!-- Error State -->
      <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
        {{ error }}
      </v-alert>

      <!-- Pick List -->
      <div v-else-if="availablePicks.length > 0">
        <!-- Filters -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.year"
              :items="availableYears"
              label="Draft Year"
              variant="outlined"
              density="compact"
              clearable
              prepend-inner-icon="calendar_today"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.round"
              :items="[1, 2]"
              label="Round"
              variant="outlined"
              density="compact"
              clearable
              prepend-inner-icon="filter_list"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.team"
              :items="teamOptions"
              item-title="name"
              item-value="id"
              label="Original Team"
              variant="outlined"
              density="compact"
              clearable
              prepend-inner-icon="diversity_3"
            />
          </v-col>
        </v-row>

        <!-- Pick Cards -->
        <v-row>
          <v-col
            v-for="pick in filteredPicks"
            :key="pick.id"
            cols="12"
            md="6"
          >
            <v-card
              variant="outlined"
              class="pick-card"
              :class="{ 'pick-card--selected': selectedPick?.id === pick.id }"
              @click="selectPick(pick)"
              hover
            >
              <v-card-text class="pa-3">
                <div class="d-flex align-center">
                  <v-avatar color="secondary" size="48" class="mr-3">
                    <v-icon icon="emoji_events" size="large" />
                  </v-avatar>

                  <div class="flex-grow-1">
                    <div class="text-subtitle-2 font-weight-bold">
                      {{ pick.draft_year }} Round {{ pick.round_number }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      Via {{ getTeamName(pick.original_team) }}
                    </div>
                    <div class="text-caption">
                      Currently owned by: {{ getTeamName(pick.current_team) }}
                    </div>
                  </div>

                  <v-icon
                    v-if="selectedPick?.id === pick.id"
                    icon="check_circle"
                    color="success"
                    size="large"
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Empty filtered state -->
        <div v-if="filteredPicks.length === 0" class="text-center py-8">
          <v-icon icon="search_off" size="64" class="text-medium-emphasis mb-2" />
          <div class="text-body-1 text-medium-emphasis">No picks match your filters</div>
          <v-btn variant="text" color="primary" class="mt-2" @click="clearFilters">
            Clear Filters
          </v-btn>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-8">
        <v-icon icon="inventory_2" size="64" class="text-medium-emphasis mb-2" />
        <div class="text-body-1 text-medium-emphasis">No picks available</div>
        <div class="text-caption text-medium-emphasis">
          This team doesn't have any draft picks available for trade
        </div>
      </div>
    </v-card-text>

    <v-divider />

    <v-card-actions class="pa-4">
      <v-btn
        v-if="selectedPick"
        variant="outlined"
        color="secondary"
        prepend-icon="shield"
        @click="showProtectionConfig = true"
      >
        Configure Protection
      </v-btn>
      <v-spacer />
      <v-btn variant="text" @click="$emit('close')">
        Cancel
      </v-btn>
      <v-btn
        variant="flat"
        color="primary"
        :disabled="!selectedPick"
        @click="confirmSelection"
      >
        Add Pick
      </v-btn>
    </v-card-actions>

    <!-- Pick Protection Config Dialog -->
    <PickProtectionConfig
      v-if="selectedPick"
      v-model="showProtectionConfig"
      :pick="selectedPick"
      @update:protection="updateProtection"
    />
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Pick, Team, PickProtectionType } from '@/types/trade';
import { TradeService } from '@/api/trade';
import PickProtectionConfig from './PickProtectionConfig.vue';

interface Props {
  teamId: number;
  allTeams: Team[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  'pick-selected': [pick: Pick];
}>();

// State
const loading = ref(true);
const error = ref<string | null>(null);
const availablePicks = ref<Pick[]>([]);
const selectedPick = ref<Pick | null>(null);
const showProtectionConfig = ref(false);

// Protection configuration
const protection = ref({
  type: 'none' as PickProtectionType,
  rangeStart: undefined as number | undefined,
  rangeEnd: undefined as number | undefined,
  rolloverYear: undefined as number | undefined,
});

// Filters
const filters = ref({
  year: null as number | null,
  round: null as number | null,
  team: null as number | null,
});

// Computed
const availableYears = computed(() => {
  const years = [...new Set(availablePicks.value.map(p => p.draft_year))];
  return years.sort();
});

const teamOptions = computed(() => {
  return props.allTeams;
});

const filteredPicks = computed(() => {
  let picks = availablePicks.value;

  if (filters.value.year !== null) {
    picks = picks.filter(p => p.draft_year === filters.value.year);
  }

  if (filters.value.round !== null) {
    picks = picks.filter(p => p.round_number === filters.value.round);
  }

  if (filters.value.team !== null) {
    picks = picks.filter(p => {
      const originalTeamId = typeof p.original_team === 'object' ? p.original_team.id : p.original_team;
      return originalTeamId === filters.value.team;
    });
  }

  return picks;
});

// Methods
function getTeamName(team: Team | number): string {
  if (typeof team === 'object') {
    return team.name;
  }
  const foundTeam = props.allTeams.find(t => t.id === team);
  return foundTeam?.name || `Team ${team}`;
}

function selectPick(pick: Pick) {
  selectedPick.value = pick;
}

function updateProtection(config: any) {
  protection.value = config;
}

function confirmSelection() {
  if (selectedPick.value) {
    // Attach protection configuration to the pick
    const pickWithProtection = {
      ...selectedPick.value,
      protection_type: protection.value.type,
      protection_range_start: protection.value.rangeStart,
      protection_range_end: protection.value.rangeEnd,
      rollover_year: protection.value.rolloverYear,
    };
    emit('pick-selected', pickWithProtection);
  }
}

function clearFilters() {
  filters.value = {
    year: null,
    round: null,
    team: null,
  };
}

async function loadPicks() {
  loading.value = true;
  error.value = null;

  try {
    availablePicks.value = await TradeService.listPicks({ team: props.teamId });
  } catch (err: any) {
    console.error('Failed to load picks:', err);
    error.value = err.response?.data?.message || 'Failed to load draft picks';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadPicks();
});
</script>

<style scoped lang="scss">
.pick-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &--selected {
    border-color: rgb(var(--v-theme-success));
    background-color: rgba(var(--v-theme-success), 0.05);
  }
}
</style>
