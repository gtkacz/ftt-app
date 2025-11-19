<template>
  <v-card class="trade-timeline" elevation="2">
    <v-card-title class="timeline-header">
      <v-icon icon="timeline" class="mr-2" />
      Trade History
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-0">
      <div v-if="loading" class="loading-state">
        <v-progress-circular indeterminate color="primary" size="32" />
        <div class="text-caption text-medium-emphasis mt-2">Loading timeline...</div>
      </div>
      <div v-else-if="!history || history.length === 0" class="empty-state">
        <v-icon icon="history" size="48" class="text-medium-emphasis mb-2" />
        <div class="text-caption text-medium-emphasis">No events yet</div>
      </div>

      <v-timeline direction="horizontal" v-else side="end" density="compact" class="timeline-content">
        <v-timeline-item
          v-for="event in sortedTimeline"
          :key="event.id"
          :dot-color="getEventColor(event.event_type)"
          size="small"
        >
          <div class="timeline-item-content">
            <div class="timeline-description">
              {{ event.message || event.description || event.event_display }}
            </div>
            <div class="timeline-timestamp">
              {{ formatTimestamp(event.created_at) }}
            </div>
          </div>
        </v-timeline-item>
      </v-timeline>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TradeHistoryEntry, TradeHistoryEventType } from '@/types/trade';

interface Props {
  tradeId: number;
  history?: TradeHistoryEntry[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  history: () => [],
  loading: false,
});

const sortedTimeline = computed(() => {
  return [...props.history].sort((a, b) => {
    // Sort chronologically (oldest first for horizontal timeline)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
});

// Team names are already provided in history entries via team_name field
// No need for a separate lookup function

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return timestamp;
  }
}

function getEventColor(eventType: TradeHistoryEventType): string {
  const colorMap: Record<TradeHistoryEventType, string> = {
    created: 'grey',
    proposed: 'primary',
    accepted: 'success',
    rejected: 'error',
    countered: 'warning',
    approved: 'purple',
    vetoed: 'error-darken-2',
    executed: 'success-darken-2',
    modified: 'info',
  };

  return colorMap[eventType] || 'grey';
}

function getEventIcon(eventType: TradeHistoryEventType): string {
  const iconMap: Record<TradeHistoryEventType, string> = {
    created: 'edit',
    proposed: 'send',
    accepted: 'check_circle',
    rejected: 'cancel',
    countered: 'sync_alt',
    approved: 'verified',
    vetoed: 'gavel',
    executed: 'done_all',
    modified: 'edit_note',
  };

  return iconMap[eventType] || 'circle';
}
</script>

<style scoped lang="scss">
.trade-timeline {
  .timeline-header {
    padding: 16px;
    background: rgba(var(--v-theme-surface-variant), 0.3);
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
  }

  .timeline-content {
    padding: 16px;
    overflow-x: auto;
  }

  .timeline-item-content {
    min-width: 150px;
    max-width: 250px;
  }

  .timeline-description {
    font-size: 0.875rem;
    line-height: 1.4;
    word-wrap: break-word;
    margin-bottom: 4px;
  }

  .timeline-timestamp {
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
  }
}
</style>
