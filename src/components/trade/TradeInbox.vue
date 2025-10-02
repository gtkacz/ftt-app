<template>
  <v-container fluid class="trade-inbox">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <h1 class="text-h4">Trade Center</h1>
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="add"
            :to="{ name: 'trade-create' }"
          >
            Create Trade
          </v-btn>
        </div>
      </v-col>

      <!-- Tabs for different trade categories -->
      <v-col cols="12">
        <v-tabs v-model="activeTab" grow>
          <v-tab value="active">
            <v-badge
              :content="tradeStore.pendingTrades.length"
              :model-value="tradeStore.pendingTrades.length > 0"
              color="error"
            >
              Active
            </v-badge>
          </v-tab>
          <v-tab value="sent">Sent</v-tab>
          <v-tab value="history">History</v-tab>
        </v-tabs>

        <v-window v-model="activeTab" class="mt-4">
          <!-- Active Trades Tab -->
          <v-window-item value="active">
            <div v-if="tradeStore.isLoadingTrades" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" />
            </div>

            <div v-else-if="tradeStore.activeTrades.length === 0" class="empty-state">
              <v-icon icon="inbox" size="64" class="mb-4 text-medium-emphasis" />
              <div class="text-h6 text-medium-emphasis">No Active Trades</div>
              <div class="text-caption text-medium-emphasis">
                You have no pending trade proposals
              </div>
            </div>

            <v-row v-else dense>
              <v-col
                v-for="trade in tradeStore.activeTrades"
                :key="trade.id"
                cols="12"
                md="6"
                lg="4"
              >
                <TradeCard
                  :trade="trade"
                  :current-team-id="currentTeamId"
                  type="active"
                  @click="$router.push(`/trades/${trade.id}`)"
                />
              </v-col>
            </v-row>
          </v-window-item>

          <!-- Sent Trades Tab -->
          <v-window-item value="sent">
            <div v-if="tradeStore.isLoadingTrades" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" />
            </div>

            <div v-else-if="tradeStore.sentTrades.length === 0" class="empty-state">
              <v-icon icon="send" size="64" class="mb-4 text-medium-emphasis" />
              <div class="text-h6 text-medium-emphasis">No Sent Trades</div>
              <div class="text-caption text-medium-emphasis">
                You haven't proposed any trades
              </div>
            </div>

            <v-row v-else dense>
              <v-col
                v-for="trade in tradeStore.sentTrades"
                :key="trade.id"
                cols="12"
                md="6"
                lg="4"
              >
                <TradeCard
                  :trade="trade"
                  :current-team-id="currentTeamId"
                  type="sent"
                  @click="$router.push(`/trades/${trade.id}`)"
                />
              </v-col>
            </v-row>
          </v-window-item>

          <!-- History Tab -->
          <v-window-item value="history">
            <div v-if="tradeStore.isLoadingTrades" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" />
            </div>

            <div v-else-if="tradeStore.tradeHistory.length === 0" class="empty-state">
              <v-icon icon="history" size="64" class="mb-4 text-medium-emphasis" />
              <div class="text-h6 text-medium-emphasis">No Trade History</div>
              <div class="text-caption text-medium-emphasis">
                Your completed trade history will appear here
              </div>
            </div>

            <v-row v-else dense>
              <v-col
                v-for="trade in tradeStore.tradeHistory"
                :key="trade.id"
                cols="12"
                md="6"
                lg="4"
              >
                <TradeCard
                  :trade="trade"
                  :current-team-id="currentTeamId"
                  type="history"
                  @click="$router.push(`/trades/${trade.id}`)"
                />
              </v-col>
            </v-row>
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTradeStore } from '@/stores/trade';
import TradeCard from './TradeCard.vue';

interface Props {
  currentTeamId: number;
}

const props = defineProps<Props>();
const tradeStore = useTradeStore();
const activeTab = ref('active');

onMounted(async () => {
  await tradeStore.loadTrades({ team: props.currentTeamId });
});
</script>

<style scoped lang="scss">
.trade-inbox {
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 24px;
    text-align: center;
  }
}
</style>
