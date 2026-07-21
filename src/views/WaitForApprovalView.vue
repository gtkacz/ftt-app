<template>
  <AuthShell brand-to="/approval" :brand-label="t('waitForApprovalView.brandLabel')" compact-on-mobile>
    <div class="approval-state">
      <div class="approval-state__icon" aria-hidden="true">
        <v-icon icon="hourglass_top" size="34" />
      </div>
      <p class="eyebrow">{{ t('waitForApprovalView.eyebrow') }}</p>
      <h2>{{ t('waitForApprovalView.title') }}</h2>
      <p class="approval-state__intro">
        {{ t('waitForApprovalView.intro') }}
      </p>

      <div class="approval-state__status">
        <span aria-hidden="true" />
        {{ t('waitForApprovalView.statusPending') }}
      </div>

      <v-alert v-if="statusMessage" :type="statusType" variant="tonal" density="compact" class="mt-5">
        {{ statusMessage }}
      </v-alert>

      <div class="approval-state__actions">
        <v-btn color="secondary" size="large" :loading="isChecking" @click="checkApproval">
          {{ t('waitForApprovalView.checkAgain') }}
          <v-icon icon="refresh" end />
        </v-btn>
        <v-btn variant="text" size="large" @click="logout">{{ t('waitForApprovalView.useAnotherAccount') }}</v-btn>
      </div>

      <p class="approval-state__help">{{ t('waitForApprovalView.helpText') }}</p>
    </div>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthShell from '@/components/auth/AuthShell.vue'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const authStore = useAuthStore()
const router = useRouter()
const isChecking = ref(false)
const statusMessage = ref('')
const statusType = ref<'info' | 'error'>('info')

async function checkApproval() {
  if (isChecking.value) return

  isChecking.value = true
  statusMessage.value = ''
  try {
    await authStore.fetchUser()
    if (authStore.user?.is_approved) {
      await router.push({ name: authStore.user.team ? 'home' : 'create-team' })
      return
    }
    statusType.value = 'info'
    statusMessage.value = t('waitForApprovalView.statusStillPending')
  } catch (error) {
    console.error('Failed to refresh approval status:', error)
    statusType.value = 'error'
    statusMessage.value = t('waitForApprovalView.statusRefreshError')
  } finally {
    isChecking.value = false
  }
}

async function logout() {
  authStore.logout()
  await router.push({ name: 'login' })
}
</script>

<style lang="scss" scoped>
.approval-state__icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin-bottom: 24px;
  border: 1px solid rgba(var(--v-theme-secondary), 0.34);
  border-radius: 50%;
  color: rgb(var(--v-theme-secondary));
  background: rgba(var(--v-theme-secondary), 0.11);
}

.approval-state h2 {
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
  font-size: clamp(2rem, 4vw, 2.6rem);
  font-weight: 760;
  letter-spacing: -0.045em;
  line-height: 1.05;
}

.approval-state__intro {
  margin: 14px 0 0;
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.65;
}

.approval-state__status {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 38px;
  margin-top: 26px;
  padding: 8px 12px;
  border: 1px solid rgba(var(--v-theme-secondary), 0.25);
  border-radius: 999px;
  color: rgb(var(--v-theme-secondary));
  background: rgba(var(--v-theme-secondary), 0.08);
  font-size: 0.78rem;
  font-weight: 750;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 0 5px rgba(var(--v-theme-secondary), 0.1);
  }
}

.approval-state__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 30px;
}

.approval-state__help {
  margin: 28px 0 0;
  padding-top: 20px;
  border-top: 1px solid var(--surface-border);
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.82rem;
}

@media (max-width: $breakpoint-xs) {
  .approval-state__actions {
    display: grid;

    .v-btn {
      width: 100%;
    }
  }
}
</style>
