<template>
  <v-card class="trade-timeline" elevation="2">
    <v-card-title class="timeline-header">
      <v-icon icon="timeline" class="mr-2" />
      Trade History
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-0">
      <div v-if="!timeline || timeline.length === 0" class="empty-state">
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
              {{ formatTimestamp(event.timestamp) }}
            </div>
          </template>

          <v-card density="compact" variant="outlined">
            <v-card-text class="pa-3">
              <div class="d-flex align-center mb-1">
                <v-icon :icon="getEventIcon(event.event_type)" size="small" class="mr-2" />
                <span class="text-subtitle-2 font-weight-medium">
                  {{ getEventTitle(event.event_type) }}
                </span>
              </div>

              <div class="event-details">
                <div v-if="event.actor_username" class="text-caption text-medium-emphasis mb-1">
                  by {{ event.actor_username }}
                  <span v-if="getTeamName(event.actor_team)">
                    ({{ getTeamName(event.actor_team) }})
                  </span>
                </div>

                <div v-if="event.message" class="event-message text-caption">
                  {{ event.message }}
                </div>

                <div v-if="event.metadata && hasMetadataDisplay(event)" class="event-metadata mt-2">
                  <div v-if="event.metadata.veto_reason" class="veto-reason">
                    <v-chip size="small" color="error" variant="tonal">
                      Veto Reason
                    </v-chip>
                    <div class="text-caption mt-1">{{ event.metadata.veto_reason }}</div>
                  </div>

                  <div v-if="event.metadata.counter_changes" class="counter-changes">
                    <v-chip size="small" color="warning" variant="tonal">
                      Counter Offer
                    </v-chip>
                    <div class="text-caption mt-1">{{ event.metadata.counter_changes }}</div>
                  </div>
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
import type { TradeTimelineEvent, TradeTimelineEventType, Team } from '@/types/trade';
import { format, parseISO } from 'date-fns';

interface Props {
  timeline: TradeTimelineEvent[];
  teams: Team[];
}

const props = defineProps<Props>();

const sortedTimeline = computed(() => {
  return [...props.timeline].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
});

function getTeamName(teamIdOrTeam: Team | number | undefined): string {
  if (!teamIdOrTeam) return '';

  if (typeof teamIdOrTeam === 'number') {
    const team = props.teams.find(t => t.id === teamIdOrTeam);
    return team?.name || '';
  }

  return teamIdOrTeam.name;
}

function formatTimestamp(timestamp: string): string {
  try {
    const date = parseISO(timestamp);
    return format(date, 'MMM d, yyyy h:mm a');
  } catch {
    return timestamp;
  }
}

function getEventColor(eventType: TradeTimelineEventType): string {
  const colorMap: Record<TradeTimelineEventType, string> = {
    created: 'grey',
    proposed: 'primary',
    team_accepted: 'success',
    team_rejected: 'error',
    team_countered: 'warning',
    cancelled: 'grey-darken-2',
    commissioner_approved: 'purple',
    commissioner_vetoed: 'error-darken-2',
    completed: 'success-darken-2',
  };

  return colorMap[eventType] || 'grey';
}

function getEventIcon(eventType: TradeTimelineEventType): string {
  const iconMap: Record<TradeTimelineEventType, string> = {
    created: 'edit',
    proposed: 'send',
    team_accepted: 'check_circle',
    team_rejected: 'cancel',
    team_countered: 'sync_alt',
    cancelled: 'block',
    commissioner_approved: 'verified',
    commissioner_vetoed: 'gavel',
    completed: 'done_all',
  };

  return iconMap[eventType] || 'circle';
}

function getEventTitle(eventType: TradeTimelineEventType): string {
  const titleMap: Record<TradeTimelineEventType, string> = {
    created: 'Trade Created',
    proposed: 'Trade Proposed',
    team_accepted: 'Team Accepted',
    team_rejected: 'Team Rejected',
    team_countered: 'Counter Offer',
    cancelled: 'Trade Cancelled',
    commissioner_approved: 'Commissioner Approved',
    commissioner_vetoed: 'Commissioner Vetoed',
    completed: 'Trade Completed',
  };

  return titleMap[eventType] || 'Event';
}

function hasMetadataDisplay(event: TradeTimelineEvent): boolean {
  if (!event.metadata) return false;

  return Boolean(
    event.metadata.veto_reason ||
    event.metadata.counter_changes ||
    event.metadata.approval_notes
  );
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
