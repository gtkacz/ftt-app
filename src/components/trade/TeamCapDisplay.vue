<template>
  <div class="team-cap-display">
    <v-row dense>
      <v-col cols="12" sm="6">
        <v-chip
          :color="salaryCapColor"
          variant="flat"
          size="small"
          class="w-100"
        >
          <v-icon start size="small">mdi-currency-usd</v-icon>
          <span class="text-caption">
            Cap: {{ formatCurrency(currentSalary) }} / {{ formatCurrency(salaryCap) }}
          </span>
        </v-chip>
      </v-col>

      <v-col cols="12" sm="6">
        <v-chip
          :color="rosterCapColor"
          variant="flat"
          size="small"
          class="w-100"
        >
          <v-icon start size="small">mdi-account-group</v-icon>
          <span class="text-caption">
            Roster: {{ currentPlayers }} / {{ maxPlayers }}
          </span>
        </v-chip>
      </v-col>
    </v-row>

    <!-- Optional: Show change indicators if trade validation available -->
    <v-row v-if="impact" dense class="mt-1">
      <v-col cols="12" sm="6">
        <div class="text-caption text-center">
          <v-icon
            :color="impact.net_salary > 0 ? 'error' : 'success'"
            size="x-small"
          >
            {{ impact.net_salary > 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
          </v-icon>
          {{ formatCurrency(Math.abs(impact.net_salary)) }}
        </div>
      </v-col>

      <v-col cols="12" sm="6">
        <div class="text-caption text-center">
          <v-icon
            :color="impact.net_players > 0 ? 'primary' : 'warning'"
            size="x-small"
          >
            {{ impact.net_players > 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
          </v-icon>
          {{ Math.abs(impact.net_players) }} player{{ Math.abs(impact.net_players) !== 1 ? 's' : '' }}
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TeamImpact } from '@/types/trade';

interface Props {
  currentSalary: number;
  salaryCap: number;
  currentPlayers: number;
  maxPlayers: number;
  impact?: TeamImpact | null;
}

const props = withDefaults(defineProps<Props>(), {
  currentSalary: 0,
  salaryCap: 140000000,
  currentPlayers: 0,
  maxPlayers: 17,
  impact: null,
});

// Calculate if over cap
const salaryCapColor = computed(() => {
  const newSalary = props.impact?.new_salary ?? props.currentSalary;
  if (newSalary > props.salaryCap) return 'error';
  if (newSalary > props.salaryCap * 0.9) return 'warning';
  return 'success';
});

const rosterCapColor = computed(() => {
  const newPlayers = props.impact?.new_player_count ?? props.currentPlayers;
  if (newPlayers > props.maxPlayers) return 'error';
  if (newPlayers > props.maxPlayers - 2) return 'warning';
  return 'primary';
});

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
.team-cap-display {
  padding: 8px;
}

.w-100 {
  width: 100%;
  justify-content: center;
}
</style>
