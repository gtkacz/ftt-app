<template>
  <v-card
    class="trade-card"
    :class="{ 'clickable': true }"
    variant="outlined"
    hover
    @click="$emit('click')"
  >
    <v-card-title class="d-flex align-center">
      <v-icon :icon="statusIcon" :color="statusColor" size="small" class="mr-2" />
      <span class="text-subtitle-1">Trade #{{ trade.id }}</span>
      <v-spacer />
      <v-chip
        :color="statusColor"
        size="small"
        variant="flat"
      >
        {{ statusLabel }}
      </v-chip>
    </v-card-title>

    <v-divider />

    <v-card-text>
      <!-- Proposing Team -->
      <div class="mb-3">
        <div class="text-caption text-medium-emphasis mb-1">Proposed by</div>
        <div class="text-body-2 font-weight-medium">
          {{ proposingTeamName }}
        </div>
        <div class="text-caption text-medium-emphasis">
          {{ formatDate(trade.proposed_at || trade.created_at) }}
        </div>
      </div>

      <!-- Quick Asset Summary -->
      <div class="mb-3">
        <div class="text-caption text-medium-emphasis mb-2">Assets</div>
        <div class="asset-summary">
          <div class="d-flex align-center">
            <v-icon icon="groups" size="small" class="mr-2" />
            <span class="text-caption">{{ playerCount }} Players</span>
          </div>
          <div class="d-flex align-center">
            <v-icon icon="emoji_events" size="small" class="mr-2" />
            <span class="text-caption">{{ pickCount }} Picks</span>
          </div>
        </div>
      </div>

      <!-- Teams Involved -->
      <div class="mb-2">
        <div class="text-caption text-medium-emphasis mb-1">Teams ({{ teamCount }})</div>
        <v-chip-group column>
          <v-chip
            v-for="teamId in teamIds"
            :key="teamId"
            size="small"
            :variant="teamId === currentTeamId ? 'flat' : 'outlined'"
            :color="teamId === currentTeamId ? 'primary' : 'default'"
          >
            {{ getTeamName(teamId) }}
          </v-chip>
        </v-chip-group>
      </div>

      <!-- Response Status (for active trades) -->
      <div v-if="type === 'active' && myOffer" class="mt-3">
        <v-alert
          :color="myOfferColor"
          variant="tonal"
          density="compact"
        >
          <div class="d-flex align-center">
            <v-icon :icon="myOfferIcon" size="small" class="mr-2" />
            <span class="text-caption">{{ myOfferText }}</span>
          </div>
        </v-alert>
      </div>

      <!-- Other Teams' Responses (for sent trades) -->
      <div v-if="type === 'sent' && trade.offers" class="mt-3">
        <div class="text-caption text-medium-emphasis mb-2">Responses</div>
        <div class="response-grid">
          <v-chip
            v-for="offer in otherOffers"
            :key="offer.id"
            size="small"
            :color="getOfferStatusColor(offer.status)"
            variant="flat"
          >
            <v-icon :icon="getOfferStatusIcon(offer.status)" size="x-small" class="mr-1" />
            {{ getOfferTeamName(offer) }}
          </v-chip>
        </div>
      </div>
    </v-card-text>

    <v-divider />

    <v-card-actions>
      <v-btn
        v-if="type === 'active' && myOffer?.status === 'pending'"
        color="primary"
        variant="text"
        size="small"
      >
        Review Trade
      </v-btn>

      <v-btn
        v-else-if="type === 'sent'"
        variant="text"
        size="small"
      >
        View Details
      </v-btn>

      <v-btn
        v-else
        variant="text"
        size="small"
      >
        View
      </v-btn>

      <v-spacer />

      <v-btn
        v-if="type === 'sent' && (trade.status === 'draft' || trade.status === 'proposed')"
        icon="delete"
        variant="text"
        size="small"
        color="error"
        @click.stop="handleCancel"
      />
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Trade, TradeOffer, TradeOfferStatus } from '@/types/trade';
import moment from 'moment';

interface Props {
  trade: Trade;
  currentTeamId: number;
  type: 'active' | 'sent' | 'history';
}

const props = defineProps<Props>();
const emit = defineEmits<{
  click: [];
  cancel: [tradeId: number];
}>();

const statusIcon = computed(() => {
  switch (props.trade.status) {
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
  switch (props.trade.status) {
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
  return props.trade.status.replace('_', ' ').toUpperCase();
});

const proposingTeamName = computed(() => {
  if (typeof props.trade.proposing_team === 'object') {
    return props.trade.proposing_team.name;
  }
  return `Team ${props.trade.proposing_team}`;
});

const teamIds = computed(() => {
  return props.trade.teams.map(t => typeof t === 'object' ? t.id : t);
});

const teamCount = computed(() => teamIds.value.length);

const playerCount = computed(() => {
  return props.trade.assets?.filter(a => a.asset_type === 'player').length || 0;
});

const pickCount = computed(() => {
  return props.trade.assets?.filter(a => a.asset_type === 'pick').length || 0;
});

const myOffer = computed(() => {
  return props.trade.offers?.find(o => {
    const offerTeamId = typeof o.team === 'object' ? o.team.id : o.team;
    return offerTeamId === props.currentTeamId;
  });
});

const myOfferColor = computed(() => {
  if (!myOffer.value) return 'default';
  switch (myOffer.value.status) {
    case 'pending':
      return 'warning';
    case 'accepted':
      return 'success';
    case 'rejected':
      return 'error';
    default:
      return 'default';
  }
});

const myOfferIcon = computed(() => {
  if (!myOffer.value) return 'help';
  switch (myOffer.value.status) {
    case 'pending':
      return 'schedule';
    case 'accepted':
      return 'check';
    case 'rejected':
      return 'close';
    default:
      return 'help';
  }
});

const myOfferText = computed(() => {
  if (!myOffer.value) return 'Unknown status';
  switch (myOffer.value.status) {
    case 'pending':
      return 'Awaiting your response';
    case 'accepted':
      return 'You accepted this trade';
    case 'rejected':
      return 'You rejected this trade';
    default:
      return 'Unknown status';
  }
});

const otherOffers = computed(() => {
  return props.trade.offers?.filter(o => {
    const offerTeamId = typeof o.team === 'object' ? o.team.id : o.team;
    return offerTeamId !== props.currentTeamId;
  }) || [];
});

function getTeamName(teamId: number): string {
  const team = props.trade.teams.find(t => {
    const id = typeof t === 'object' ? t.id : t;
    return id === teamId;
  });
  return typeof team === 'object' ? team.name : `Team ${teamId}`;
}

function getOfferTeamName(offer: TradeOffer): string {
  if (typeof offer.team === 'object') {
    return offer.team.name;
  }
  return `Team ${offer.team}`;
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

function formatDate(date: string): string {
  return moment(date).fromNow();
}

function handleCancel() {
  emit('cancel', props.trade.id);
}
</script>

<style scoped lang="scss">
.trade-card {
  transition: all 0.2s ease;

  &.clickable {
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
    }
  }

  .asset-summary {
    display: flex;
    gap: 16px;
  }

  .response-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
