<template>
  <v-container fluid class="trade-overview-view">
    <!-- Header -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon start>swap_horiz</v-icon>
            Trade Overview
            <v-spacer />
            <v-btn
              :to="{ name: 'league-trades' }"
              variant="outlined"
              class="mr-2"
            >
              <v-icon start>history</v-icon>
              League History
            </v-btn>
            <v-btn
              color="primary"
              @click="createNewTrade"
            >
              <v-icon start>add</v-icon>
              Create Trade
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
            <v-tab value="draft">
              <v-icon start>draft</v-icon>
              Draft
              <v-chip
                v-if="getCountByStatus('draft') > 0"
                size="x-small"
                class="ml-2"
                color="grey"
              >
                {{ getCountByStatus('draft') }}
              </v-chip>
            </v-tab>
            <v-tab value="proposed">
              <v-icon start>send</v-icon>
              Proposed
              <v-chip
                v-if="getCountByStatus('proposed') > 0"
                size="x-small"
                class="ml-2"
                color="info"
              >
                {{ getCountByStatus('proposed') }}
              </v-chip>
            </v-tab>
            <v-tab value="waiting_approval">
              <v-icon start>schedule</v-icon>
              Pending Approval
              <v-chip
                v-if="getCountByStatus('waiting_approval') > 0"
                size="x-small"
                class="ml-2"
                color="warning"
              >
                {{ getCountByStatus('waiting_approval') }}
              </v-chip>
            </v-tab>
            <v-tab value="approved">
              <v-icon start>check_circle</v-icon>
              Approved
              <v-chip
                v-if="getCountByStatus('approved') > 0"
                size="x-small"
                class="ml-2"
                color="success"
              >
                {{ getCountByStatus('approved') }}
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
            <v-tab value="rejected">
              <v-icon start>approval_delegation_off</v-icon>
              Rejected/Vetoed
              <v-chip
                v-if="getRejectedCount() > 0"
                size="x-small"
                class="ml-2"
                color="error"
              >
                {{ getRejectedCount() }}
              </v-chip>
            </v-tab>
          </v-tabs>

          <v-divider />

          <v-card-text>
            <v-window v-model="activeTab">
              <!-- Draft Tab -->
              <v-window-item value="draft">
                <TradeList
                  :trades="tradesByStatus('draft')"
                  :loading="loading.trades"
                  @trade-click="handleTradeClick"
                  @edit-trade="handleEditTrade"
                  @delete-trade="handleDeleteTrade"
                />
              </v-window-item>

              <!-- Proposed Tab -->
              <v-window-item value="proposed">
                <TradeList
                  :trades="tradesByStatus('proposed')"
                  :loading="loading.trades"
                  @trade-click="handleTradeClick"
                  @respond-trade="handleRespondTrade"
                />
              </v-window-item>

              <!-- Waiting Approval Tab -->
              <v-window-item value="waiting_approval">
                <TradeList
                  :trades="tradesByStatus('waiting_approval')"
                  :loading="loading.trades"
                  @trade-click="handleTradeClick"
                />
              </v-window-item>

              <!-- Approved Tab -->
              <v-window-item value="approved">
                <TradeList
                  :trades="tradesByStatus('approved')"
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

              <!-- Rejected/Vetoed Tab -->
              <v-window-item value="rejected">
                <TradeList
                  :trades="getRejectedTrades()"
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTradeStore } from '@/stores/trade';
import { storeToRefs } from 'pinia';
import type { Trade } from '@/types/trade';
import TradeList from '@/components/trade/TradeList.vue';

const router = useRouter();
const tradeStore = useTradeStore();

const { trades, loading } = storeToRefs(tradeStore);

// Component state
const activeTab = ref<string>('proposed');
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});

// Get trades by status
function tradesByStatus(status: string): Trade[] {
  return tradeStore.tradesByStatus(status);
}

// Get rejected/vetoed trades
function getRejectedTrades(): Trade[] {
  return trades.value.filter((t) => t.status === 'rejected' || t.status === 'vetoed');
}

// Get count by status
function getCountByStatus(status: string): number {
  return tradesByStatus(status).length;
}

// Get rejected count
function getRejectedCount(): number {
  return getRejectedTrades().length;
}

// Navigation handlers
function createNewTrade() {
  router.push({ name: 'trade-create' });
}

function handleTradeClick(trade: Trade) {
  router.push({ name: 'trade-detail', params: { id: trade.id } });
}

function handleEditTrade(trade: Trade) {
  router.push({ name: 'trade-edit', params: { id: trade.id } });
}

async function handleDeleteTrade(trade: Trade) {
  if (!confirm(`Are you sure you want to delete trade #${trade.id}?`)) {
    return;
  }

  try {
    // TODO: Implement delete trade API endpoint
    // await tradeStore.deleteTrade(trade.id);
    showSnackbar('Trade deleted successfully', 'success');
    await loadTrades();
  } catch (error: any) {
    console.error('Delete trade error:', error);
    showSnackbar(error.message || 'Failed to delete trade', 'error');
  }
}

function handleRespondTrade(payload: { trade: Trade; response: 'accept' | 'reject' | 'counter' }) {
  if (payload.response === 'counter') {
    // Navigate to edit page for counter-offer
    router.push({ name: 'trade-edit', params: { id: payload.trade.id } });
  } else {
    // Navigate to detail page for accept/reject
    router.push({ name: 'trade-detail', params: { id: payload.trade.id } });
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
