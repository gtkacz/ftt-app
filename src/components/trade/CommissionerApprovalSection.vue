<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon start>gavel</v-icon>
      Commissioner Approval
    </v-card-title>

    <v-divider />

    <v-card-text>
      <!-- Approval Status Overview -->
      <v-row v-if="approvalStatus" class="mb-4">
        <v-col cols="12">
          <v-alert
            :type="getApprovalStatusType()"
            variant="tonal"
            prominent
          >
            <template #prepend>
              <v-icon>{{ getApprovalStatusIcon() }}</v-icon>
            </template>
            <div class="text-subtitle-1 font-weight-medium">
              {{ getApprovalStatusMessage() }}
            </div>
            <div class="text-caption mt-1">
              {{ approvalStatus.approve_votes }} approve,
              {{ approvalStatus.veto_votes }} veto
              ({{ approvalStatus.majority_needed }} needed for majority)
            </div>
            <v-progress-linear
              :model-value="getApprovalProgress()"
              :color="getProgressColor()"
              class="mt-2"
              height="8"
              rounded
            />
          </v-alert>
        </v-col>
      </v-row>

      <!-- Commissioner Votes List -->
      <v-row v-if="approvals && approvals.length > 0">
        <v-col cols="12">
          <div class="text-subtitle-2 mb-2">Commissioner Votes</div>
          <v-list density="compact">
            <v-list-item
              v-for="approval in sortedApprovals"
              :key="approval.id"
              :class="{ 'approval-item': true, 'admin-vote-item': approval.is_admin_vote }"
            >
              <template #prepend>
                <v-badge
                  v-if="approval.is_admin_vote"
                  icon="star"
                  color="purple"
                  overlap
                >
                  <v-avatar :color="getVoteColor(approval.vote)" size="32" class="mr-3">
                    <v-icon color="white" size="small">
                      {{ getVoteIcon(approval.vote) }}
                    </v-icon>
                  </v-avatar>
                </v-badge>
                <v-avatar v-else :color="getVoteColor(approval.vote)" size="32" class="mr-3">
                  <v-icon color="white" size="small">
                    {{ getVoteIcon(approval.vote) }}
                  </v-icon>
                </v-avatar>
              </template>

              <v-list-item-title>
                {{ approval.commissioner_username }}
                <v-chip
                  v-if="approval.is_admin_vote"
                  size="small"
                  color="purple"
                  variant="flat"
                  prepend-icon="star"
                  class="ml-2"
                >
                  Admin - Instant Decision
                </v-chip>
              </v-list-item-title>

              <v-list-item-subtitle>
                <v-chip :color="getVoteColor(approval.vote)" size="small" variant="flat">
                  {{ approval.vote_display }}
                </v-chip>
                <span class="ml-2 text-caption">{{ formatDate(approval.voted_at) }}</span>
                <v-chip
                  v-if="approval.is_admin_vote"
                  size="x-small"
                  color="purple"
                  variant="outlined"
                  class="ml-2"
                >
                  Final Authority
                </v-chip>
              </v-list-item-subtitle>

              <!-- Notes (expandable) -->
              <template v-if="approval.notes">
                <v-list-item-subtitle class="mt-1">
                  <v-btn
                    size="x-small"
                    variant="text"
                    @click="toggleNotes(approval.id)"
                  >
                    <v-icon start size="small">
                      {{ expandedNotes.includes(approval.id) ? 'expand_less' : 'expand_more' }}
                    </v-icon>
                    {{ expandedNotes.includes(approval.id) ? 'Hide' : 'View' }} Notes
                  </v-btn>
                </v-list-item-subtitle>
                <v-expand-transition>
                  <div v-if="expandedNotes.includes(approval.id)" class="notes-content mt-2 pa-2">
                    <p class="text-caption">{{ approval.notes }}</p>
                  </div>
                </v-expand-transition>
              </template>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>

      <!-- Pending Commissioners -->
      <v-row v-if="approvalStatus && approvalStatus.votes_remaining > 0">
        <v-col cols="12">
          <div class="text-subtitle-2 mb-2">
            Pending Votes ({{ approvalStatus.votes_remaining }} remaining)
          </div>
          <v-chip size="small" variant="outlined" color="grey">
            <v-icon start size="small">schedule</v-icon>
            Awaiting commissioner decisions
          </v-chip>
        </v-col>
      </v-row>

      <!-- Voting Interface (for commissioners) -->
      <v-row v-if="canVote && !hasVoted">
        <v-col cols="12">
          <v-divider class="my-4" />
          <div class="text-subtitle-2 mb-3">Cast Your Vote</div>

          <v-radio-group v-model="voteSelection" hide-details>
            <v-radio label="Approve" value="approve" color="success">
              <template #label>
                <div class="d-flex align-center">
                  <v-icon color="success" class="mr-2">check_circle</v-icon>
                  <span>Approve</span>
                </div>
              </template>
            </v-radio>
            <v-radio label="Veto" value="veto" color="error">
              <template #label>
                <div class="d-flex align-center">
                  <v-icon color="error" class="mr-2">cancel</v-icon>
                  <span>Veto</span>
                </div>
              </template>
            </v-radio>
          </v-radio-group>

          <v-textarea
            v-model="voteNotes"
            label="Notes (optional)"
            variant="outlined"
            rows="3"
            class="mt-3"
            placeholder="Add any comments about your decision..."
          />

          <v-btn
            color="primary"
            size="large"
            :disabled="!voteSelection"
            :loading="submitting"
            @click="submitVote"
          >
            <v-icon start>send</v-icon>
            Submit Vote
          </v-btn>
        </v-col>
      </v-row>

      <!-- Already Voted Message -->
      <v-row v-else-if="canVote && hasVoted">
        <v-col cols="12">
          <v-alert type="info" variant="tonal">
            <template #prepend>
              <v-icon>info</v-icon>
            </template>
            You have already voted on this trade.
          </v-alert>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { Trade, TradeApproval, ApprovalStatus, VoteType } from '@/types/trade';

const authStore = useAuthStore();

interface Props {
  trade: Trade;
  approvalStatus: ApprovalStatus | null;
  approvals: TradeApproval[];
}

interface Emits {
  (e: 'vote', payload: { vote: VoteType; notes?: string }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Component state
const voteSelection = ref<VoteType | ''>('');
const voteNotes = ref('');
const submitting = ref(false);
const expandedNotes = ref<number[]>([]);

// Check if user can vote
const canVote = computed(() => {
  return authStore.user?.is_staff || authStore.user?.is_superuser || false;
});

// Check if user has already voted
const hasVoted = computed(() => {
  const userId = authStore.user?.id;
  if (!userId) return false;
  return props.approvals.some(a => a.commissioner === userId);
});

// Sorted approvals (admin votes first, then by date)
const sortedApprovals = computed(() => {
  return [...props.approvals].sort((a, b) => {
    if (a.is_admin_vote && !b.is_admin_vote) return -1;
    if (!a.is_admin_vote && b.is_admin_vote) return 1;
    return new Date(b.voted_at).getTime() - new Date(a.voted_at).getTime();
  });
});

// Get approval status type
function getApprovalStatusType(): 'success' | 'error' | 'warning' | 'info' {
  if (!props.approvalStatus) return 'info';

  if (props.approvalStatus.approve_votes >= props.approvalStatus.majority_needed) {
    return 'success';
  } else if (props.approvalStatus.veto_votes >= props.approvalStatus.majority_needed) {
    return 'error';
  } else {
    return 'warning';
  }
}

// Get approval status icon
function getApprovalStatusIcon(): string {
  const type = getApprovalStatusType();
  const icons = {
    success: 'check_circle',
    error: 'cancel',
    warning: 'schedule',
    info: 'info',
  };
  return icons[type];
}

// Get approval status message
function getApprovalStatusMessage(): string {
  if (!props.approvalStatus) return 'Awaiting commissioner votes';

  if (props.approvalStatus.approve_votes >= props.approvalStatus.majority_needed) {
    return 'Trade Approved by Majority';
  } else if (props.approvalStatus.veto_votes >= props.approvalStatus.majority_needed) {
    return 'Trade Vetoed by Majority';
  } else {
    return `${props.approvalStatus.votes_remaining} vote${props.approvalStatus.votes_remaining !== 1 ? 's' : ''} remaining`;
  }
}

// Get approval progress percentage
function getApprovalProgress(): number {
  if (!props.approvalStatus) return 0;
  const totalVotes = props.approvalStatus.approve_votes + props.approvalStatus.veto_votes;
  return (totalVotes / props.approvalStatus.total_commissioners) * 100;
}

// Get progress color
function getProgressColor(): string {
  const type = getApprovalStatusType();
  const colors = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };
  return colors[type];
}

// Get vote color
function getVoteColor(vote: VoteType): string {
  return vote === 'approve' ? 'success' : 'error';
}

// Get vote icon
function getVoteIcon(vote: VoteType): string {
  return vote === 'approve' ? 'check' : 'close';
}

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Toggle notes expansion
function toggleNotes(approvalId: number) {
  const index = expandedNotes.value.indexOf(approvalId);
  if (index > -1) {
    expandedNotes.value.splice(index, 1);
  } else {
    expandedNotes.value.push(approvalId);
  }
}

// Submit vote
async function submitVote() {
  if (!voteSelection.value) return;

  submitting.value = true;
  try {
    emit('vote', {
      vote: voteSelection.value as VoteType,
      notes: voteNotes.value || undefined,
    });

    // Reset form
    voteSelection.value = '';
    voteNotes.value = '';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.approval-item {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.approval-item:last-child {
  border-bottom: none;
}

.notes-content {
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 4px;
  border-left: 3px solid rgba(var(--v-theme-primary), 0.5);
}
</style>
