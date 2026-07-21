<template>
  <v-container fluid class="commissioner-trades">
    <!-- Header -->
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-2">
          <v-icon class="mr-2">gavel</v-icon>
          {{ t('commissionerTradesView.header.title') }}
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          {{ t('commissionerTradesView.header.subtitle') }}
        </p>
      </v-col>
    </v-row>

    <!-- Quick Stats -->
    <v-row>
      <v-col cols="12" md="4">
        <v-card variant="outlined" color="warning">
          <v-card-text>
            <div class="text-h3 text-center">
              {{ waitingApprovalTrades.length }}
            </div>
            <div class="text-caption text-center text-medium-emphasis">
              {{ t('commissionerTradesView.stats.awaitingApproval') }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card variant="outlined" color="error">
          <v-card-text>
            <div class="text-h3 text-center">
              {{ needsYourVote.length }}
            </div>
            <div class="text-caption text-center text-medium-emphasis">
              {{ t('commissionerTradesView.stats.needYourVote') }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card variant="outlined" color="success">
          <v-card-text>
            <div class="text-h3 text-center">
              {{ approvedTrades.length }}
            </div>
            <div class="text-caption text-center text-medium-emphasis">
              {{ t('commissionerTradesView.stats.readyForExecution') }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Trades Needing Vote -->
    <v-row v-if="needsYourVote.length > 0">
      <v-col>
        <v-alert
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          <v-icon class="mr-2">priority_high</v-icon>
          <strong>{{ needsYourVote.length }}</strong> {{ t('commissionerTradesView.alerts.needsVote', needsYourVote.length) }}
        </v-alert>

        <h2 class="text-h5 mb-4">
          <v-icon class="mr-2">priority_high</v-icon>
          {{ t('commissionerTradesView.sections.needsYourVote') }}
        </h2>

        <v-row>
          <v-col
            v-for="trade in needsYourVote"
            :key="trade.id"
            cols="12"
          >
            <v-card>
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" color="warning">schedule</v-icon>
                {{ t('commissionerTradesView.trade.title', { id: trade.id }) }}
                <v-spacer />
                <v-chip size="small" color="warning">{{ t('commissionerTradesView.chip.needsVote') }}</v-chip>
              </v-card-title>

              <v-card-text>
                <!-- Teams -->
                <div class="mb-3">
                  <div class="text-caption text-medium-emphasis mb-1">{{ t('commissionerTradesView.teamsLabel') }}</div>
                  <v-chip-group>
                    <v-chip
                      v-for="team in trade.teams_detail"
                      :key="team.id"
                      size="small"
                      variant="outlined"
                    >
                      {{ team.name }}
                    </v-chip>
                  </v-chip-group>
                </div>

                <!-- Vote Progress -->
                <div v-if="trade.approval_status" class="mb-3">
                  <div class="text-caption text-medium-emphasis mb-1">
                    {{ t('commissionerTradesView.vote.progressLabel') }}
                  </div>
                  <v-progress-linear
                    :model-value="(trade.approval_status.approve_votes / trade.approval_status.majority_needed) * 100"
                    color="success"
                    height="20"
                  >
                    <template #default>
                      <span class="text-caption">
                        {{ t('commissionerTradesView.vote.progressCount', { approved: trade.approval_status.approve_votes, needed: trade.approval_status.majority_needed }) }}
                      </span>
                    </template>
                  </v-progress-linear>
                </div>

                <!-- Quick Vote Buttons -->
                <div class="d-flex gap-2 mt-4">
                  <v-btn
                    color="success"
                    @click="quickVote(trade.id, 'approve')"
                    :loading="loading[`vote_${trade.id}`]"
                  >
                    <v-icon start>check</v-icon>
                    {{ t('commissionerTradesView.actions.approve') }}
                  </v-btn>
                  <v-btn
                    color="error"
                    @click="quickVote(trade.id, 'veto')"
                    :loading="loading[`vote_${trade.id}`]"
                  >
                    <v-icon start>close</v-icon>
                    {{ t('commissionerTradesView.actions.veto') }}
                  </v-btn>
                  <v-btn
                    variant="outlined"
                    :to="{ name: 'trade-detail', params: { id: trade.id } }"
                  >
                    <v-icon start>visibility</v-icon>
                    {{ t('commissionerTradesView.actions.viewDetails') }}
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- All Pending Trades -->
    <v-row v-if="waitingApprovalTrades.length > 0">
      <v-col>
        <h2 class="text-h5 mb-4">{{ t('commissionerTradesView.sections.allPending') }}</h2>

        <v-row>
          <v-col
            v-for="trade in waitingApprovalTrades"
            :key="trade.id"
            cols="12"
            md="6"
          >
            <v-card>
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">handshake</v-icon>
                {{ t('commissionerTradesView.trade.title', { id: trade.id }) }}
                <v-spacer />
                <v-chip size="small" color="warning">{{ t('commissionerTradesView.chip.pending') }}</v-chip>
              </v-card-title>

              <v-card-text>
                <!-- Teams -->
                <div class="mb-2">
                  <v-chip-group>
                    <v-chip
                      v-for="team in trade.teams_detail"
                      :key="team.id"
                      size="small"
                      variant="outlined"
                    >
                      {{ team.name }}
                    </v-chip>
                  </v-chip-group>
                </div>

                <!-- Vote Status -->
                <div v-if="trade.approval_status" class="mb-2">
                  <v-chip
                    size="small"
                    color="success"
                    variant="outlined"
                    class="mr-2"
                  >
                    <v-icon start size="small">thumb_up</v-icon>
                    {{ trade.approval_status.approve_votes }}
                  </v-chip>
                  <v-chip
                    size="small"
                    color="error"
                    variant="outlined"
                  >
                    <v-icon start size="small">thumb_down</v-icon>
                    {{ trade.approval_status.veto_votes }}
                  </v-chip>
                  <span class="text-caption text-medium-emphasis ml-2">
                    {{ t('commissionerTradesView.vote.needCount', { needed: trade.approval_status.majority_needed }) }}
                  </span>
                </div>

                <!-- Action -->
                <v-btn
                  :to="{ name: 'trade-detail', params: { id: trade.id } }"
                  variant="outlined"
                  block
                  class="mt-2"
                >
                  {{ t('commissionerTradesView.actions.reviewVote') }}
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Approved Trades (Admin Only) -->
    <v-row v-if="isAdmin && approvedTrades.length > 0">
      <v-col>
        <h2 class="text-h5 mb-4">
          <v-icon class="mr-2">check_circle</v-icon>
          {{ t('commissionerTradesView.sections.approvedReady') }}
        </h2>

        <v-row>
          <v-col
            v-for="trade in approvedTrades"
            :key="trade.id"
            cols="12"
            md="6"
          >
            <v-card>
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" color="success">check_circle</v-icon>
                {{ t('commissionerTradesView.trade.title', { id: trade.id }) }}
                <v-spacer />
                <v-chip size="small" color="success">{{ t('commissionerTradesView.chip.approved') }}</v-chip>
              </v-card-title>

              <v-card-text>
                <!-- Teams -->
                <div class="mb-3">
                  <v-chip-group>
                    <v-chip
                      v-for="team in trade.teams_detail"
                      :key="team.id"
                      size="small"
                      variant="outlined"
                    >
                      {{ team.name }}
                    </v-chip>
                  </v-chip-group>
                </div>

                <!-- Actions -->
                <div class="d-flex gap-2">
                  <v-btn
                    color="success"
                    @click="executeTrade(trade.id)"
                    :loading="loading[`execute_${trade.id}`]"
                  >
                    <v-icon start>play_arrow</v-icon>
                    {{ t('commissionerTradesView.actions.executeTrade') }}
                  </v-btn>
                  <v-btn
                    variant="outlined"
                    :to="{ name: 'trade-detail', params: { id: trade.id } }"
                  >
                    {{ t('commissionerTradesView.actions.viewDetails') }}
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-if="waitingApprovalTrades.length === 0 && approvedTrades.length === 0">
      <v-col>
        <v-card variant="outlined">
          <v-card-text class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1">gavel</v-icon>
            <p class="text-h6 mt-4">{{ t('commissionerTradesView.empty.title') }}</p>
            <p class="text-body-2 text-medium-emphasis">
              {{ t('commissionerTradesView.empty.subtitle') }}
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useTradeStore } from '@/stores/trade'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const authStore = useAuthStore()
const tradeStore = useTradeStore()
const router = useRouter()

const loading = ref<Record<string, boolean>>({})
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Check permissions
const isAdmin = computed(() => authStore.user?.is_superuser || false)
const isCommissioner = computed(() =>
  authStore.user?.is_staff || authStore.user?.is_superuser || false
)
const userId = computed(() => authStore.user?.id)

// Trades
const waitingApprovalTrades = computed(() => tradeStore.waitingApprovalTrades)
const approvedTrades = computed(() => tradeStore.approvedTrades)

// Trades that need the current user's vote
const needsYourVote = computed(() => {
  if (!userId.value) return []
  return waitingApprovalTrades.value.filter(trade => {
    return !trade.approvals.some(a => a.commissioner === userId.value)
  })
})

// Quick vote function
async function quickVote(tradeId: number, vote: 'approve' | 'veto') {
  loading.value[`vote_${tradeId}`] = true
  try {
    await tradeStore.voteOnTrade(tradeId, vote, '')
    snackbar.value = {
      show: true,
      message: vote === 'approve' ? t('commissionerTradesView.messages.approvedSuccess') : t('commissionerTradesView.messages.vetoedSuccess'),
      color: 'success'
    }
    // Refresh trades
    await tradeStore.fetchUserTrades()
  } catch (error: any) {
    snackbar.value = {
      show: true,
      message: error.message || t('commissionerTradesView.messages.voteFailed'),
      color: 'error'
    }
  } finally {
    loading.value[`vote_${tradeId}`] = false
  }
}

// Execute trade (admin only)
async function executeTrade(tradeId: number) {
  if (!isAdmin.value) return

  loading.value[`execute_${tradeId}`] = true
  try {
    await tradeStore.executeTrade(tradeId)
    snackbar.value = {
      show: true,
      message: t('commissionerTradesView.messages.executeSuccess'),
      color: 'success'
    }
    // Refresh trades
    await tradeStore.fetchUserTrades()
  } catch (error: any) {
    snackbar.value = {
      show: true,
      message: error.message || t('commissionerTradesView.messages.executeFailed'),
      color: 'error'
    }
  } finally {
    loading.value[`execute_${tradeId}`] = false
  }
}

// Lifecycle
onMounted(async () => {
  // Check if user is commissioner
  if (!isCommissioner.value) {
    snackbar.value = {
      show: true,
      message: t('commissionerTradesView.messages.commissionerOnly'),
      color: 'error'
    }
    router.push({ name: 'trade-overview' })
    return
  }

  // Load trades
  await tradeStore.fetchUserTrades()
})
</script>

<style scoped>
.commissioner-trades {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
