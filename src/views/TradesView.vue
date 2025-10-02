<template>
  <TradeInbox :current-team-id="currentTeamId" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import TradeInbox from '@/components/trade/TradeInbox.vue';

const authStore = useAuthStore();

const currentTeamId = computed(() => authStore.user?.team?.id || 0);
</script>
