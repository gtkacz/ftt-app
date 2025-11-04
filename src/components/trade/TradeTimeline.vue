<template>
  <v-card class="trade-timeline" elevation="2">
    <v-card-title class="timeline-header">
      <v-icon icon="timeline" class="mr-2" />
      Trade History
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-0">
      <div v-if="!history || history.length === 0" class="empty-state">
        <v-icon icon="history" size="48" class="text-medium-emphasis mb-2" />
        <div class="text-caption text-medium-emphasis">No events yet</div>
      </div>

      <v-timeline v-else side="end" density="compact" class="timeline-content">
        <v-timeline-item
          v-for="event in sortedTimeline"
          :key="event.id"
          :dot-color="getEventColor(event.event_type)"
          size="small"
        >
          <template #opposite>
            <div class="text-caption text-medium-emphasis">
              {{ formatTimestamp(event.created_at) }}
            </div>
          </template>

          <v-card density="compact" variant="outlined">
            <v-card-text class="pa-3">
              <div class="d-flex align-center mb-1">
                <v-icon :icon="getEventIcon(event.event_type)" size="small" class="mr-2" />
                <span class="text-subtitle-2 font-weight-medium">
                  {{ event.event_display }}
                </span>
              </div>

              <div class="event-details">
                <div v-if="event.actor_display" class="text-caption text-medium-emphasis mb-1">
                  {{ event.actor_display }}
                </div>

                <div v-if="event.message" class="event-message text-caption">
                  {{ event.message }}
                </div>

                <div v-if="event.has_snapshot" class="event-metadata mt-2">
                  <v-chip size="small" color="info" variant="tonal">
                    {{ event.snapshot_summary }}
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>
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
}

const props = withDefaults(defineProps<Props>(), {
  history: () => [],
});

const sortedTimeline = computed(() => {
  return [...props.history].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
  }

  .timeline-content {
    padding: 16px;

    .event-details {
      .event-message {
        padding: 8px;
        background: rgba(var(--v-theme-surface-variant), 0.3);
        border-radius: 4px;
        font-style: italic;
      }

      .event-metadata {
        .veto-reason,
        .counter-changes {
          padding: 8px;
          background: rgba(var(--v-theme-surface-variant), 0.2);
          border-radius: 4px;
          margin-top: 4px;
        }
      }
    }
  }
}
</style>
