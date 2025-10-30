<template>
  <v-container v-if="trade" fluid class="trade-review">
    <v-row>
      <!-- Header -->
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-btn
            icon="arrow_back"
            variant="text"
            @click="$router.back()"
          />
          <div class="ml-3">
            <h1 class="text-h4">Trade #{{ trade.id }}</h1>
            <div class="text-caption text-medium-emphasis">
              Proposed by {{ proposingTeamName }} • {{ formatDate(trade.proposed_at || trade.created_at) }}
            </div>
          </div>
          <v-spacer />
          <v-chip
            :color="statusColor"
            size="large"
            variant="flat"
          >
            <v-icon :icon="statusIcon" size="small" class="mr-2" />
            {{ statusLabel }}
          </v-chip>
        </div>
      </v-col>

      <!-- Trade Overview -->
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-title>
            <v-icon icon="swap_horiz" class="mr-2" />
            Trade Overview
          </v-card-title>

          <v-divider />

          <v-card-text>
            <v-row>
              <v-col
                v-for="teamId in teamIds"
                :key="teamId"
                cols="12"
                :md="teamIds.length === 2 ? 6 : 4"
              >
                <div class="team-column">
                  <div class="team-header">
                    <h3 class="text-h6">{{ getTeamName(teamId) }}</h3>
                    <v-chip
                      v-if="isProposingTeam(teamId)"
                      size="small"
                      color="primary"
                      variant="tonal"
                      prepend-icon="star"
                    >
                      Proposer
                    </v-chip>
                  </div>

                  <!-- Giving Assets -->
                  <div class="mt-4">
                    <div class="text-subtitle-2 mb-2">
                      <v-icon icon="arrow_forward" color="error" size="small" class="mr-1" />
                      Giving Up
                    </div>
                    <div v-if="getGivingAssets(teamId).length === 0" class="text-caption text-medium-emphasis">
                      Nothing
                    </div>
                    <div v-else class="asset-list">
                      <TradeAssetCard
                        v-for="(asset, index) in getGivingAssets(teamId)"
                        :key="`giving-${index}`"
                        :asset="asset"
                        size="small"
                        variant="tonal"
                        class="mb-2"
                      />
                    </div>
                  </div>

                  <!-- Receiving Assets -->
                  <div class="mt-4">
                    <div class="text-subtitle-2 mb-2">
                      <v-icon icon="arrow_back" color="success" size="small" class="mr-1" />
                      Receiving
                    </div>
                    <div v-if="getReceivingAssets(teamId).length === 0" class="text-caption text-medium-emphasis">
                      Nothing
                    </div>
                    <div v-else class="asset-list">
                      <TradeAssetCard
                        v-for="(asset, index) in getReceivingAssets(teamId)"
                        :key="`receiving-${index}`"
                        :asset="asset"
                        size="small"
                        variant="tonal"
                        highlight-color="success-lighten"
                        class="mb-2"
                      />
                    </div>
                  </div>

                  <!-- Team Response Status -->
                  <div v-if="getTeamOffer(teamId)" class="mt-4">
                    <v-divider class="mb-3" />
                    <v-chip
                      :color="getOfferStatusColor(getTeamOffer(teamId)!.status)"
                      block
                      variant="flat"
                    >
                      <v-icon :icon="getOfferStatusIcon(getTeamOffer(teamId)!.status)" size="small" class="mr-2" />
                      {{ getOfferStatusText(getTeamOffer(teamId)!.status) }}
                    </v-chip>
                    <div v-if="getTeamOffer(teamId)!.message" class="mt-2 text-caption">
                      <strong>Message:</strong> {{ getTeamOffer(teamId)!.message }}
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Trade Notes -->
      <v-col v-if="trade.notes" cols="12">
        <v-card variant="outlined">
          <v-card-title>
            <v-icon icon="note" class="mr-2" />
            Trade Notes
          </v-card-title>
          <v-divider />
          <v-card-text>
            <p class="text-body-2">{{ trade.notes }}</p>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- My Response Actions (if I'm involved and status is pending) -->
      <v-col v-if="showMyActions" cols="12">
        <v-card variant="outlined" color="primary">
          <v-card-title>Your Response</v-card-title>
          <v-divider />
          <v-card-text>
            <v-alert
              type="info"
              variant="tonal"
              density="compact"
              class="mb-4"
            >
              Review the trade details above and choose your response
            </v-alert>

            <v-textarea
              v-model="responseMessage"
              label="Message (Optional)"
              variant="outlined"
              rows="2"
              placeholder="Add a message with your response..."
            />
          </v-card-text>
          <v-card-actions class="pa-4">
            <v-btn
              color="success"
              variant="flat"
              prepend-icon="check"
              :loading="isResponding"
              @click="acceptTrade"
            >
              Accept Trade
            </v-btn>

            <v-btn
              color="error"
              variant="outlined"
              prepend-icon="close"
              :loading="isResponding"
              @click="rejectTrade"
            >
              Reject Trade
            </v-btn>

            <v-spacer />

            <v-btn
              variant="text"
              prepend-icon="reply"
              @click="counterOffer"
            >
              Counter Offer
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Commissioner Actions -->
      <v-col v-if="showCommissionerActions" cols="12">
        <v-card variant="outlined" color="warning">
          <v-card-title>
            <v-icon icon="gavel" class="mr-2" />
            Commissioner Actions
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
              This trade is awaiting commissioner approval
            </v-alert>
          </v-card-text>
          <v-card-actions class="pa-4">
            <v-btn
              color="success"
              variant="flat"
              prepend-icon="verified"
              :loading="isResponding"
              @click="approveTrade"
            >
              Approve Trade
            </v-btn>

            <v-btn
              color="error"
              variant="outlined"
              prepend-icon="gavel"
              :loading="isResponding"
              @click="vetoTrade"
            >
              Veto Trade
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Proposer Actions -->
      <v-col v-if="showProposerActions" cols="12">
        <v-card variant="outlined">
          <v-card-actions class="pa-4">
            <v-btn
              v-if="trade.status === 'draft'"
              color="primary"
              variant="flat"
              prepend-icon="send"
              :loading="isResponding"
              @click="proposeTrade"
            >
              Propose Trade
            </v-btn>

            <v-btn
              v-if="canCancel"
              color="error"
              variant="outlined"
              prepend-icon="cancel"
              :loading="isResponding"
              @click="cancelTrade"
            >
              Cancel Trade
            </v-btn>

            <v-spacer />

            <v-btn
              v-if="trade.status === 'draft'"
              variant="text"
              prepend-icon="edit"
              @click="editTrade"
            >
              Edit Trade
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <div v-else class="text-center py-8">
    <v-progress-circular indeterminate color="primary" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTradeStore } from '@/stores/trade';
import { useAuthStore } from '@/stores/auth';
import type { Trade, TradeAsset, TradeOffer, TradeOfferStatus, Team } from '@/types/trade';
import TradeAssetCard from './TradeAssetCard.vue';
import moment from 'moment';
import api from '@/api/axios';

interface Props {
  tradeId: number;
}

const props = defineProps<Props>();
const router = useRouter();
const tradeStore = useTradeStore();
const authStore = useAuthStore();

const isResponding = ref(false);
const responseMessage = ref('');
const allTeams = ref<Team[]>([]);

const trade = computed(() => tradeStore.currentTrade);

const proposingTeamName = computed(() => {
  if (!trade.value) return '';
  if (typeof trade.value.proposing_team === 'object') {
    return trade.value.proposing_team.name;
  }
  const team = allTeams.value.find(t => t.id === trade.value.proposing_team);
  return team?.name || `Team ${trade.value.proposing_team}`;
});

const teamIds = computed(() => {
  if (!trade.value) return [];
  return trade.value.teams.map(t => typeof t === 'object' ? t.id : t);
});

const statusIcon = computed(() => {
  if (!trade.value) return '';
  switch (trade.value.status) {
    case 'proposed':
      return 'email';
    case 'accepted':
      return 'check_circle';
    case 'rejected':
      return 'cancel';
    case 'completed':
      return 'done_all';
    case 'cancelled':
      return 'cancel';
    case 'vetoed':
      return 'gavel';
    case 'waiting_approval':
      return 'schedule';
    case 'approved':
      return 'verified';
    default:
      return 'description';
  }
});

const statusColor = computed(() => {
  if (!trade.value) return 'default';
  switch (trade.value.status) {
    case 'proposed':
    case 'waiting_approval':
      return 'warning';
    case 'accepted':
    case 'completed':
    case 'approved':
      return 'success';
    case 'rejected':
    case 'cancelled':
    case 'vetoed':
      return 'error';
    default:
      return 'default';
  }
});

const statusLabel = computed(() => {
  if (!trade.value) return '';
  return trade.value.status.replace('_', ' ').toUpperCase();
});

const myOffer = computed(() => {
  if (!trade.value || !authStore.user?.team?.id) return null;
  return trade.value.offers?.find(o => {
    const offerTeamId = typeof o.team === 'object' ? o.team.id : o.team;
    return offerTeamId === authStore.user?.team?.id;
  });
});

const showMyActions = computed(() => {
  return myOffer.value?.status === 'pending' && trade.value?.status === 'proposed';
});

const showCommissionerActions = computed(() => {
  return authStore.isStaff &&
    trade.value?.status === 'waiting_approval';
});

const showProposerActions = computed(() => {
  if (!trade.value || !authStore.user?.team?.id) return false;
  const proposingTeamId = typeof trade.value.proposing_team === 'object'
    ? trade.value.proposing_team.id
    : trade.value.proposing_team;
  return proposingTeamId === authStore.user?.team?.id;
});

const canCancel = computed(() => {
  return trade.value?.status === 'draft' || trade.value?.status === 'proposed';
});

function isProposingTeam(teamId: number): boolean {
  if (!trade.value) return false;
  const proposingTeamId = typeof trade.value.proposing_team === 'object'
    ? trade.value.proposing_team.id
    : trade.value.proposing_team;
  return teamId === proposingTeamId;
}

function getTeamName(teamId: number): string {
  if (!trade.value) return `Team ${teamId}`;
  // Try to find in trade.teams first (might be full objects)
  const teamInTrade = trade.value.teams.find(t => {
    const id = typeof t === 'object' ? t.id : t;
    return id === teamId;
  });
  if (typeof teamInTrade === 'object') return teamInTrade.name;

  // Fall back to allTeams lookup
  const team = allTeams.value.find(t => t.id === teamId);
  return team?.name || `Team ${teamId}`;
}

function getGivingAssets(teamId: number): TradeAsset[] {
  return trade.value?.assets?.filter(a => {
    const givingTeamId = typeof a.giving_team === 'object' ? a.giving_team.id : a.giving_team;
    return givingTeamId === teamId;
  }) || [];
}

function getReceivingAssets(teamId: number): TradeAsset[] {
  return trade.value?.assets?.filter(a => {
    const receivingTeamId = typeof a.receiving_team === 'object' ? a.receiving_team.id : a.receiving_team;
    return receivingTeamId === teamId;
  }) || [];
}

function getTeamOffer(teamId: number): TradeOffer | undefined {
  return trade.value?.offers?.find(o => {
    const offerTeamId = typeof o.team === 'object' ? o.team.id : o.team;
    return offerTeamId === teamId;
  });
}

function getOfferStatusColor(status: TradeOfferStatus): string {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'accepted':
      return 'success';
    case 'rejected':
      return 'error';
    default:
      return 'default';
  }
}

function getOfferStatusIcon(status: TradeOfferStatus): string {
  switch (status) {
    case 'pending':
      return 'schedule';
    case 'accepted':
      return 'check';
    case 'rejected':
      return 'close';
    default:
      return 'help';
  }
}

function getOfferStatusText(status: TradeOfferStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending Response';
    case 'accepted':
      return 'Accepted';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Unknown';
  }
}

function formatDate(date: string): string {
  return moment(date).fromNow();
}

async function acceptTrade() {
  if (!myOffer.value) return;
  isResponding.value = true;
  try {
    await tradeStore.acceptOffer(myOffer.value.id, responseMessage.value);
    responseMessage.value = '';
  } catch (error) {
    console.error('Failed to accept trade:', error);
  } finally {
    isResponding.value = false;
  }
}

async function rejectTrade() {
  if (!myOffer.value) return;
  if (!confirm('Are you sure you want to reject this trade?')) return;

  isResponding.value = true;
  try {
    await tradeStore.rejectOffer(myOffer.value.id, responseMessage.value);
    responseMessage.value = '';
  } catch (error) {
    console.error('Failed to reject trade:', error);
  } finally {
    isResponding.value = false;
  }
}

function counterOffer() {
  // Navigate to create trade with pre-filled data
  router.push({ name: 'trade-counter', params: { id: props.tradeId } });
}

async function approveTrade() {
  if (!confirm('Are you sure you want to approve this trade?')) return;
  isResponding.value = true;
  try {
    // Commissioner approve action - to be implemented
    console.log('Approve trade');
  } catch (error) {
    console.error('Failed to approve trade:', error);
  } finally {
    isResponding.value = false;
  }
}

async function vetoTrade() {
  if (!confirm('Are you sure you want to veto this trade?')) return;
  isResponding.value = true;
  try {
    // Commissioner veto action - to be implemented
    console.log('Veto trade');
  } catch (error) {
    console.error('Failed to veto trade:', error);
  } finally {
    isResponding.value = false;
  }
}

async function proposeTrade() {
  isResponding.value = true;
  try {
    await tradeStore.proposeTrade(props.tradeId);
  } catch (error) {
    console.error('Failed to propose trade:', error);
  } finally {
    isResponding.value = false;
  }
}

async function cancelTrade() {
  if (!confirm('Are you sure you want to cancel this trade?')) return;
  isResponding.value = true;
  try {
    await tradeStore.cancelTrade(props.tradeId);
    router.push({ name: 'trades' });
  } catch (error) {
    console.error('Failed to cancel trade:', error);
  } finally {
    isResponding.value = false;
  }
}

function editTrade() {
  router.push({ name: 'trade-edit', params: { id: props.tradeId } });
}

async function loadTeams() {
  try {
    const response = await api.get('/teams/');
    allTeams.value = response.data.results || [];
  } catch (error) {
    console.error('Failed to load teams:', error);
  }
}

onMounted(async () => {
  await loadTeams();
  await tradeStore.loadTrade(props.tradeId);
});
</script>

<style scoped lang="scss">
.trade-review {
  .team-column {
    padding: 16px;
    border-radius: 8px;
    background: rgba(var(--v-theme-surface-variant), 0.3);

    .team-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .asset-list {
      max-height: 400px;
      overflow-y: auto;
    }
  }
}
</style>
