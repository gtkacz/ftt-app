<template>
  <v-card
    class="trade-asset-card"
    :variant="variant"
    :color="cardColor"
  >
    <v-card-text class="pa-3">
      <div class="d-flex align-center">
        <!-- Asset Icon/Image -->
        <v-avatar
          :size="avatarSize"
          :color="asset.asset_type === 'player' ? 'primary' : 'secondary'"
          class="mr-3"
        >
          <v-img
            v-if="asset.asset_type === 'player' && playerData?.photo_url"
            :src="playerData.photo_url"
            :alt="playerData.full_name"
          />
          <v-icon
            v-else
            :icon="asset.asset_type === 'player' ? 'person' : 'emoji_events'"
            :size="iconSize"
          />
        </v-avatar>

        <!-- Asset Info -->
        <div class="flex-grow-1">
          <!-- Player Asset -->
          <div v-if="asset.asset_type === 'player' && playerData">
            <div class="d-flex align-center">
              <div class="text-subtitle-2 font-weight-bold">
                {{ playerData.full_name }}
              </div>
              <v-chip
                v-if="contractData?.is_rfa && (contractData?.years_remaining || 0) <= 0"
                size="x-small"
                color="warning"
                class="ml-2"
              >
                RFA
              </v-chip>
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ playerData.position }} • {{ playerData.nba_team }}
            </div>
            <div v-if="contractData" class="text-caption">
              {{ formatCurrency(contractData.salary) }} • {{ contractData.duration }}yr
              <span v-if="contractData.years_remaining !== undefined">
                ({{ contractData.years_remaining }} left)
              </span>
            </div>
          </div>

          <!-- Pick Asset -->
          <div v-if="asset.asset_type === 'pick' && pickData">
            <div class="text-subtitle-2 font-weight-bold">
              {{ pickData.display_name || `${pickData.draft_year} Round ${pickData.round_number}` }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Via {{ pickData.original_team.name }}
            </div>
            <div v-if="asset.pick_protection_type && asset.pick_protection_type !== 'none'" class="mt-1">
              <PickProtectionBadge
                :protection-type="asset.pick_protection_type"
                :range-start="asset.pick_protection_range_start"
                :range-end="asset.pick_protection_range_end"
                :rollover-year="asset.pick_rollover_year"
              />
            </div>
          </div>
        </div>

        <!-- Remove Button (optional) -->
        <v-btn
          v-if="removable"
          icon="close"
          variant="text"
          size="small"
          color="error"
          @click="$emit('remove')"
        />
      </div>

      <!-- Direction Arrow (optional) -->
      <div v-if="showDirection" class="direction-arrow mt-2">
        <v-divider />
        <div class="text-center my-1">
          <v-icon
            :icon="directionIcon"
            size="small"
            :color="directionColor"
          />
        </div>
        <div class="text-caption text-center text-medium-emphasis">
          {{ directionText }}
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TradeAsset, Player, Contract, Pick, Team } from '@/types/trade';
import PickProtectionBadge from './PickProtectionBadge.vue';

interface Props {
  asset: TradeAsset;
  variant?: 'flat' | 'outlined' | 'elevated' | 'tonal';
  size?: 'small' | 'default' | 'large';
  removable?: boolean;
  showDirection?: boolean;
  directionType?: 'giving' | 'receiving';
  highlightColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'outlined',
  size: 'default',
  removable: false,
  showDirection: false,
});

defineEmits<{
  remove: [];
}>();

const avatarSize = computed(() => {
  switch (props.size) {
    case 'small':
      return 32;
    case 'large':
      return 56;
    default:
      return 40;
  }
});

const iconSize = computed(() => {
  switch (props.size) {
    case 'small':
      return 'small';
    case 'large':
      return 'large';
    default:
      return 'default';
  }
});

const playerData = computed(() => {
  if (props.asset.asset_type === 'player') {
    // Backend returns player_detail for the nested object
    return (props.asset as any).player_detail || null;
  }
  return null;
});

const contractData = computed(() => {
  // Contract info is nested in player_detail
  return playerData.value?.contract || null;
});

const pickData = computed(() => {
  if (props.asset.asset_type === 'pick') {
    // Backend returns pick_detail for the nested object
    return (props.asset as any).pick_detail || null;
  }
  return null;
});

const cardColor = computed(() => {
  return props.highlightColor || undefined;
});

const directionIcon = computed(() => {
  return props.directionType === 'giving' ? 'arrow_forward' : 'arrow_back';
});

const directionColor = computed(() => {
  return props.directionType === 'giving' ? 'error' : 'success';
});

const directionText = computed(() => {
  const givingTeam = typeof props.asset.giving_team === 'object' ? props.asset.giving_team.name : 'Team';
  const receivingTeam = typeof props.asset.receiving_team === 'object' ? props.asset.receiving_team.name : 'Team';

  return props.directionType === 'giving'
    ? `To ${receivingTeam}`
    : `From ${givingTeam}`;
});

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
</script>

<style scoped lang="scss">
.trade-asset-card {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }

  .direction-arrow {
    margin-top: 8px;
  }
}
</style>
