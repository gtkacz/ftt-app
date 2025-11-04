<template>
  <v-card class="team-selector" variant="outlined">
    <v-card-text>
      <div class="d-flex align-center gap-3">
        <v-autocomplete
          v-model="selectedTeam"
          :items="availableTeams"
          item-title="name"
          item-value="id"
          label="Add Team to Trade"
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
          :disabled="disabled"
          @update:model-value="handleTeamSelect"
        >
          <template #prepend-inner>
            <v-icon icon="add_circle" size="small" />
          </template>

          <template #item="{ item, props: itemProps }">
            <v-list-item
              v-bind="itemProps"
              :disabled="(props.selectedTeamIds || []).includes(item.value)"
            >
              <template #prepend>
                <v-avatar
                  v-if="item.raw.logo"
                  :image="item.raw.logo"
                  size="32"
                  class="mr-2"
                />
                <v-avatar
                  v-else
                  color="primary"
                  size="32"
                  class="mr-2"
                >
                  <span class="text-caption">{{ getInitials(item.raw.name) }}</span>
                </v-avatar>
              </template>

              <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                {{ item.raw.owner_username || `Owner ID: ${item.raw.owner_id}` }}
              </v-list-item-subtitle>
            </v-list-item>
          </template>
        </v-autocomplete>
      </div>

      <!-- Selected Teams Display -->
      <div v-if="(props.selectedTeamIds || []).length > 0" class="mt-4">
        <div class="text-caption text-medium-emphasis mb-2">
          Teams in Trade ({{ (props.selectedTeamIds || []).length }})
        </div>

        <v-chip-group column>
          <v-chip
            v-for="teamId in (props.selectedTeamIds || [])"
            :key="teamId"
            :color="teamId === props.proposingTeamId ? 'primary' : 'default'"
            :variant="teamId === props.proposingTeamId ? 'flat' : 'outlined'"
            :closable="teamId !== props.proposingTeamId && !props.disabled"
            @click:close="removeTeam(teamId)"
          >
            <template #prepend>
              <v-avatar
                v-if="getTeam(teamId)?.logo"
                :image="getTeam(teamId)?.logo"
                size="24"
                start
              />
              <v-icon
                v-else-if="teamId === props.proposingTeamId"
                icon="star"
                size="small"
                start
              />
            </template>

            {{ getTeam(teamId)?.name }}

            <v-tooltip
              v-if="teamId === props.proposingTeamId"
              activator="parent"
              location="top"
            >
              Proposing Team
            </v-tooltip>
          </v-chip>
        </v-chip-group>
      </div>

      <!-- Trade Type Info -->
      <v-alert
        v-if="(props.selectedTeamIds || []).length >= 3"
        type="info"
        variant="tonal"
        density="compact"
        class="mt-3"
      >
        <div class="d-flex align-center">
          <v-icon icon="info" size="small" class="mr-2" />
          <span class="text-caption">
            Multi-team trade: All teams must give and receive at least one asset
          </span>
        </div>
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Team } from '@/types/trade';

interface Props {
  teams: Team[];
  selectedTeamIds?: number[];
  proposingTeamId?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectedTeamIds: () => [],
});
const emit = defineEmits<{
  'add-team': [teamId: number];
  'remove-team': [teamId: number];
}>();

const selectedTeam = ref<number | null>(null);

const availableTeams = computed(() => {
  return props.teams?.filter(team => !(props.selectedTeamIds || []).includes(team.id));
});

function getTeam(teamId: number): Team | undefined {
  return props.teams?.find(t => t.id === teamId);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function handleTeamSelect(teamId: number | null) {
  if (teamId) {
    emit('add-team', teamId);
    selectedTeam.value = null;
  }
}

function removeTeam(teamId: number) {
  if (teamId !== props.proposingTeamId) {
    emit('remove-team', teamId);
  }
}
</script>

<style scoped lang="scss">
.team-selector {
  .v-chip-group {
    gap: 8px;
  }
}
</style>
