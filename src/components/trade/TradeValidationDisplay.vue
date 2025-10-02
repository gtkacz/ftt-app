<template>
  <v-card v-if="validation" class="trade-validation-display">
    <v-card-title class="d-flex align-center">
      <v-icon
        :icon="overallIcon"
        :color="overallColor"
        class="mr-2"
      />
      Trade Validation {{ validation.valid ? 'Passed' : 'Failed' }}
    </v-card-title>

    <v-divider />

    <v-card-text>
      <!-- Errors -->
      <div v-if="validation.errors.length" class="mb-4">
        <div class="text-subtitle-2 text-error mb-2">
          <v-icon icon="error" size="small" class="mr-1" />
          Errors ({{ validation.errors.length }})
        </div>
        <v-list density="compact" class="bg-transparent">
          <v-list-item
            v-for="(error, index) in validation.errors"
            :key="`error-${index}`"
            class="px-0"
          >
            <template #prepend>
              <v-icon icon="cancel" color="error" size="small" class="mr-2" />
            </template>
            <v-list-item-title class="text-body-2">{{ error }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </div>

      <!-- Warnings -->
      <div v-if="validation.warnings.length" class="mb-4">
        <div class="text-subtitle-2 text-warning mb-2">
          <v-icon icon="warning" size="small" class="mr-1" />
          Warnings ({{ validation.warnings.length }})
        </div>
        <v-list density="compact" class="bg-transparent">
          <v-list-item
            v-for="(warning, index) in validation.warnings"
            :key="`warning-${index}`"
            class="px-0"
          >
            <template #prepend>
              <v-icon icon="error_outline" color="warning" size="small" class="mr-2" />
            </template>
            <v-list-item-title class="text-body-2">{{ warning }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </div>

      <!-- Team Impacts -->
      <div v-if="Object.keys(validation.team_impacts).length">
        <div class="text-subtitle-2 mb-3">
          Team Impact Analysis
        </div>

        <v-expansion-panels variant="accordion">
          <v-expansion-panel
            v-for="(impact, teamId) in validation.team_impacts"
            :key="teamId"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center justify-space-between w-100">
                <span>{{ getTeamName(Number(teamId)) }}</span>
                <div class="d-flex align-center gap-2 mr-4">
                  <v-chip
                    :color="impact.under_salary_cap ? 'success' : 'error'"
                    size="small"
                    variant="flat"
                  >
                    <v-icon
                      :icon="impact.under_salary_cap ? 'check' : 'close'"
                      size="x-small"
                      class="mr-1"
                    />
                    Cap
                  </v-chip>
                  <v-chip
                    :color="impact.under_player_cap ? 'success' : 'error'"
                    size="small"
                    variant="flat"
                  >
                    <v-icon
                      :icon="impact.under_player_cap ? 'check' : 'close'"
                      size="x-small"
                      class="mr-1"
                    />
                    Roster
                  </v-chip>
                </div>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <v-row dense>
                <!-- Salary Impact -->
                <v-col cols="12" md="6">
                  <div class="impact-card">
                    <div class="text-caption text-medium-emphasis mb-1">Salary Impact</div>
                    <div class="d-flex align-center justify-space-between">
                      <div>
                        <div class="text-body-2">
                          {{ formatCurrency(impact.current_salary) }} → {{ formatCurrency(impact.new_salary) }}
                        </div>
                        <div
                          class="text-caption"
                          :class="impact.net_salary >= 0 ? 'text-error' : 'text-success'"
                        >
                          {{ impact.net_salary >= 0 ? '+' : '' }}{{ formatCurrency(impact.net_salary) }}
                        </div>
                      </div>
                      <v-chip
                        :color="impact.under_salary_cap ? 'success' : 'error'"
                        size="small"
                        variant="tonal"
                      >
                        {{ formatCurrency(impact.salary_cap - impact.new_salary) }} space
                      </v-chip>
                    </div>
                  </div>
                </v-col>

                <!-- Roster Impact -->
                <v-col cols="12" md="6">
                  <div class="impact-card">
                    <div class="text-caption text-medium-emphasis mb-1">Roster Impact</div>
                    <div class="d-flex align-center justify-space-between">
                      <div>
                        <div class="text-body-2">
                          {{ impact.current_player_count }} → {{ impact.new_player_count }} players
                        </div>
                        <div
                          class="text-caption"
                          :class="impact.net_players > 0 ? 'text-warning' : impact.net_players < 0 ? 'text-info' : ''"
                        >
                          {{ impact.net_players > 0 ? '+' : '' }}{{ impact.net_players }} players
                        </div>
                      </div>
                      <v-chip
                        :color="impact.under_player_cap ? 'success' : 'error'"
                        size="small"
                        variant="tonal"
                      >
                        {{ impact.max_player_cap - impact.new_player_count }} slots
                      </v-chip>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TradeValidationResponse, Team } from '@/types/trade';

interface Props {
  validation: TradeValidationResponse | null;
  teams?: Team[];
}

const props = defineProps<Props>();

const overallIcon = computed(() => {
  if (!props.validation) return 'help_outline';
  return props.validation.valid ? 'check_circle' : 'error';
});

const overallColor = computed(() => {
  if (!props.validation) return 'grey';
  return props.validation.valid ? 'success' : 'error';
});

function getTeamName(teamId: number): string {
  const team = props.teams?.find(t => t.id === teamId);
  return team?.name || `Team ${teamId}`;
}

function formatCurrency(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
</script>

<style scoped lang="scss">
.trade-validation-display {
  .impact-card {
    padding: 12px;
    border-radius: 8px;
    background: rgba(var(--v-theme-surface-variant), 0.3);
  }
}
</style>
