<template>
  <v-container fluid class="trade-overview-view">
    <!-- Header -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon start>swap_horiz</v-icon>
            Trade Center
            <v-spacer />
            <v-btn
              color="primary"
              @click="createNewTrade"
            >
              <v-icon start>add</v-icon>
              Create New Trade
            </v-btn>
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <!-- Status Tabs -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-tabs
            v-model="activeTab"
            color="primary"
            align-tabs="center"
            show-arrows
          >
            <v-tab value="waiting_acceptance">
              <v-icon start>schedule</v-icon>
              Waiting Response
              <v-chip
                v-if="getCountByStatus('waiting_acceptance') > 0"
                size="x-small"
                class="ml-2"
                color="info"
              >
                {{ getCountByStatus('waiting_acceptance') }}
              </v-chip>
            </v-tab>
            <v-tab value="rejected">
              <v-icon start>cancel</v-icon>
              Rejected
              <v-chip
                v-if="getCountByStatus('rejected') > 0"
                size="x-small"
                class="ml-2"
                color="error"
              >
                {{ getCountByStatus('rejected') }}
              </v-chip>
            </v-tab>
            <v-tab value="accepted">
              <v-icon start>check_circle</v-icon>
              Accepted
              <v-chip
                v-if="getCountByStatus('accepted') > 0"
                size="x-small"
                class="ml-2"
                color="warning"
              >
                {{ getCountByStatus('accepted') }}
              </v-chip>
            </v-tab>
            <v-tab value="vetoed">
              <v-icon start>block</v-icon>
              Vetoed
              <v-chip
                v-if="getCountByStatus('vetoed') > 0"
                size="x-small"
                class="ml-2"
                color="error"
              >
                {{ getCountByStatus('vetoed') }}
              </v-chip>
            </v-tab>
            <v-tab value="completed">
              <v-icon start>done_all</v-icon>
              Completed
              <v-chip
                v-if="getCountByStatus('completed') > 0"
                size="x-small"
                class="ml-2"
                color="success"
              >
                {{ getCountByStatus('completed') }}
              </v-chip>
            </v-tab>
          </v-tabs>

          <v-divider />

          <v-card-text>
            <v-window v-model="activeTab">
              <!-- Waiting Acceptance Tab -->
              <v-window-item value="waiting_acceptance">
                <TradeList
                  :trades="tradesByStatus('waiting_acceptance')"
                  :loading="loading.trades"
                  @trade-click="handleTradeClick"
                  @respond-trade="handleRespondTrade"
                />
              </v-window-item>

              <!-- Rejected Tab -->
              <v-window-item value="rejected">
                <TradeList
                  :trades="tradesByStatus('rejected')"
                  :loading="loading.trades"
                  @trade-click="handleTradeClick"
                />
              </v-window-item>

              <!-- Accepted Tab -->
              <v-window-item value="accepted">
                <TradeList
                  :trades="tradesByStatus('accepted')"
                  :loading="loading.trades"
                  @trade-click="handleTradeClick"
                />
              </v-window-item>

              <!-- Vetoed Tab -->
              <v-window-item value="vetoed">
                <TradeList
                  :trades="tradesByStatus('vetoed')"
                  :loading="loading.trades"
                  @trade-click="handleTradeClick"
                />
              </v-window-item>

              <!-- Completed Tab -->
              <v-window-item value="completed">
                <TradeList
                  :trades="tradesByStatus('completed')"
                  :loading="loading.trades"
                  @trade-click="handleTradeClick"
                />
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- FAB for mobile -->
    <v-btn
      class="fab-create"
      color="primary"
      size="large"
      icon
      elevation="8"
      @click="createNewTrade"
    >
      <v-icon>add</v-icon>
    </v-btn>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTradeStore } from '@/stores/trade';
import { storeToRefs } from 'pinia';
import type { Trade, TradeDisplayStatus } from '@/types/trade';
import TradeList from '@/components/trade/TradeList.vue';

const router = useRouter();
const tradeStore = useTradeStore();

const { loading } = storeToRefs(tradeStore);

// Component state
const activeTab = ref<string>('waiting_acceptance');
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});

// Get trades by display status
function tradesByStatus(status: TradeDisplayStatus): Trade[] {
  return tradeStore.tradesByDisplayStatus(status);
}

// Get count by status
function getCountByStatus(status: TradeDisplayStatus): number {
  return tradesByStatus(status).length;
}

// Navigation handlers
function createNewTrade() {
  router.push({ name: 'trade-create' });
}

function handleTradeClick(trade: Trade) {
  router.push({ name: 'trade-detail', params: { id: trade.id } });
}

async function handleRespondTrade(payload: { trade: Trade; response: 'accept' | 'reject' | 'counter' }) {
  const { trade, response } = payload;
  
  try {
    if (response === 'counter') {
      // Navigate to edit page for counter-offer
      router.push({ name: 'trade-edit', params: { id: trade.id } });
      return;
    }

    // Use the backend trade action endpoint
    const { TradeService } = await import('@/api/trade');
    await TradeService.performTradeAction({
      action: response === 'accept' ? 'accept' : 'reject',
      trade_id: trade.id,
    });

    showSnackbar(`Trade ${response === 'accept' ? 'accepted' : 'rejected'} successfully`, 'success');
    await loadTrades();
  } catch (error: any) {
    console.error('Trade action error:', error);
    const errorMessage = error.response?.data?.detail || error.message || `Failed to ${response} trade`;
    showSnackbar(errorMessage, 'error');
  }
}

function showSnackbar(message: string, color: 'success' | 'error' | 'warning' | 'info') {
  snackbar.value = { show: true, message, color };
}

// Load trades on mount
async function loadTrades() {
  try {
    await tradeStore.fetchUserTrades();
  } catch (error) {
    console.error('Failed to load trades:', error);
    showSnackbar('Failed to load trades', 'error');
  }
}

onMounted(async () => {
  await loadTrades();
});
</script>

<style scoped>
.trade-overview-view {
  padding-bottom: 100px; /* Space for FAB */
}

.fab-create {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
}

/* Hide FAB on larger screens where header button is visible */
@media (min-width: 960px) {
  .fab-create {
    display: none;
  }
}
</style>
