<template>
  <AuthShell brand-to="/create-team" :brand-label="t('teamCreateView.brandLabel')" compact-on-mobile>
    <div class="team-setup">
      <div class="team-setup__icon" aria-hidden="true">
        <v-icon icon="add_business" size="30" />
      </div>
      <p class="eyebrow">{{ t('teamCreateView.eyebrow') }}</p>
      <h2>{{ t('teamCreateView.title') }}</h2>
      <p class="team-setup__intro">
        {{ t('teamCreateView.intro') }}
      </p>

      <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="team-setup__alert">
        {{ errorMessage }}
      </v-alert>

      <v-form v-model="formValid" class="team-setup__form" @submit.prevent="handleCreateTeam">
        <v-text-field v-model.trim="teamName" :label="t('teamCreateView.form.teamNameLabel')" autocomplete="organization"
          append-inner-icon="badge" :rules="[rules.required]" hide-details="auto" />

        <v-file-input v-model="teamIcon" accept="image/png,image/jpeg,image/webp" :label="t('teamCreateView.form.teamLogoLabel')"
          prepend-icon="" append-inner-icon="add_photo_alternate" show-size clearable hide-details="auto" />

        <p class="team-setup__hint">
          <v-icon icon="info" size="17" />
          {{ t('teamCreateView.form.hint') }}
        </p>

        <v-btn type="submit" block size="large" height="52" :loading="isLoading"
          :disabled="!formValid || isLoading" color="secondary">
          {{ t('teamCreateView.form.submit') }}
          <v-icon icon="arrow_forward" end />
        </v-btn>
      </v-form>
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

const teamName = ref('')
const teamIcon = ref<File | null>(null)
const formValid = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const rules = {
  required: (value: string) => !!value || t('teamCreateView.validation.required'),
}

async function handleCreateTeam() {
  if (!formValid.value || isLoading.value) return

  const ownerId = authStore.user?.id
  if (!ownerId) {
    errorMessage.value = t('teamCreateView.errors.accountNotLoaded')
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  const payload = new FormData()
  payload.append('owner', String(ownerId))
  payload.append('name', teamName.value)
  if (teamIcon.value) payload.append('icon', teamIcon.value)

  try {
    await authStore.createTeam(payload)
    await router.push({ name: 'home' })
  } catch (error) {
    console.error('Failed to create team:', error)
    errorMessage.value = t('teamCreateView.errors.createFailed')
  } finally {
    isLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.team-setup__icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  margin-bottom: 24px;
  border: 1px solid rgba(var(--v-theme-secondary), 0.32);
  border-radius: 18px;
  color: rgb(var(--v-theme-secondary));
  background: rgba(var(--v-theme-secondary), 0.1);
}

.team-setup h2 {
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
  font-size: clamp(2rem, 4vw, 2.6rem);
  font-weight: 760;
  letter-spacing: -0.045em;
  line-height: 1.05;
}

.team-setup__intro {
  margin: 12px 0 0;
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.6;
}

.team-setup__alert {
  margin-top: 22px;
}

.team-setup__form {
  display: grid;
  gap: 18px;
  margin-top: 28px;
}

.team-setup__hint {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: -6px 2px 2px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.78rem;
  line-height: 1.4;
}
</style>
