<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-btn
            icon="arrow_back"
            variant="text"
            @click="$router.back()"
          />
          <h1 class="text-h4 ml-3">Create Trade</h1>
        </div>
      </v-col>

      <v-col cols="12">
        <TradeComposer
          :all-teams="allTeams"
          :current-team-id="currentTeamId"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import TradeComposer from '@/components/trade/TradeComposer.vue';
import type { Team } from '@/types/trade';
import api from '@/api/axios';

const authStore = useAuthStore();
const allTeams = ref<Team[]>([]);

const currentTeamId = computed(() => authStore.user?.team?.id || 0);

onMounted(async () => {
  try {
    const response = await api.get('/teams/');
    allTeams.value = response.data.results || [];
  } catch (error) {
    console.error('Failed to load teams:', error);
  }
});
</script>
