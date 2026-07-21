<template>
  <div class="settings-page page-view">
    <div class="page-header settings-page__header">
      <div>
        <p class="eyebrow">Workspace controls</p>
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">Inspect the league configuration cached for this device.</p>
      </div>
      <div class="settings-page__status" :class="{ 'settings-page__status--cached': settingsStore.isCacheValid }">
        <span aria-hidden="true" />
        {{ settingsStore.isCacheValid ? 'Cache ready' : 'Live data' }}
      </div>
    </div>

    <section v-if="settingsStore.isLoading" class="state-panel surface-card" aria-live="polite">
      <div>
        <v-progress-circular indeterminate color="secondary" size="46" width="4" />
        <p>Loading workspace settings…</p>
      </div>
    </section>

    <v-card v-else-if="settingsStore.isLoaded" class="settings-card" variant="flat">
      <v-card-title class="settings-card__title">
        <span class="settings-card__icon"><v-icon icon="tune" /></span>
        <span>
          Application settings
          <small v-if="lastFetchedLabel">Updated {{ lastFetchedLabel }}</small>
        </span>
      </v-card-title>

      <v-card-text>
        <v-alert type="info" variant="tonal" density="compact" class="mb-5">
          Settings remain on this device for 30 minutes, reducing repeat network requests.
        </v-alert>

        <dl v-if="settingEntries.length" class="settings-grid">
          <div v-for="entry in settingEntries" :key="entry.key" class="settings-grid__item">
            <dt>{{ entry.label }}</dt>
            <dd>{{ entry.value }}</dd>
          </div>
        </dl>

        <div v-else class="settings-empty">
          <v-icon icon="inbox" size="32" />
          <p>No application settings were returned.</p>
        </div>
      </v-card-text>

      <v-card-actions class="settings-card__actions">
        <v-btn color="secondary" variant="flat" :loading="settingsStore.isLoading" @click="refreshSettings">
          <v-icon icon="refresh" start />
          Refresh
        </v-btn>
        <v-btn variant="tonal" @click="clearCache">
          <v-icon icon="delete_sweep" start />
          Clear cache
        </v-btn>
      </v-card-actions>
    </v-card>

    <section v-else class="settings-fallback surface-card">
      <div class="settings-fallback__icon"><v-icon icon="cloud_off" size="30" /></div>
      <div>
        <h2>Settings unavailable</h2>
        <p>{{ errorMessage || 'No settings are available for this workspace yet.' }}</p>
      </div>
      <v-btn color="secondary" :loading="settingsStore.isLoading" @click="loadSettings">Try again</v-btn>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
const errorMessage = ref('')

const settingEntries = computed(() => Object.entries(settingsStore.settings ?? {}).map(([key, value]) => ({
  key,
  label: key.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase()),
  value: formatSettingValue(value),
})))

const lastFetchedLabel = computed(() => {
  if (!settingsStore.lastFetched) return ''
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
    .format(settingsStore.lastFetched)
})

onMounted(loadSettings)

async function loadSettings() {
  errorMessage.value = ''
  try {
    await settingsStore.fetchSettings()
  } catch (error) {
    console.error('Error loading settings:', error)
    errorMessage.value = 'We could not reach the settings service.'
  }
}

async function refreshSettings() {
  errorMessage.value = ''
  try {
    await settingsStore.fetchSettings(true)
  } catch (error) {
    console.error('Error refreshing settings:', error)
    errorMessage.value = 'The latest settings could not be loaded.'
  }
}

function clearCache() {
  settingsStore.clearCache()
  errorMessage.value = 'The local cache was cleared. Load settings when you need them again.'
}

function formatSettingValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled'
  if (value === null || value === undefined || value === '') return 'Not set'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
</script>

<style lang="scss" scoped>
.settings-page {
  max-width: 980px;
}

.settings-page__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}

.settings-page__status {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 7px 11px;
  border: 1px solid var(--surface-border);
  border-radius: 999px;
  color: rgb(var(--v-theme-on-surface-variant));
  background: rgba(var(--v-theme-surface), 0.7);
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.07em;
  text-transform: uppercase;

  span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
  }
}

.settings-page__status--cached {
  color: rgb(var(--v-theme-success));
}

.settings-card {
  overflow: hidden;
  border: 1px solid var(--surface-border);
  border-radius: $border-radius-xl;
  background: rgb(var(--v-theme-surface));
  box-shadow: $shadow-md;
}

.settings-card__title {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 22px 24px;
  border-bottom: 1px solid var(--surface-border);

  > span:last-child {
    display: grid;
    gap: 2px;
  }

  small {
    color: rgb(var(--v-theme-on-surface-variant));
    font-size: 0.72rem;
    font-weight: 500;
  }
}

.settings-card__icon,
.settings-fallback__icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 13px;
  color: rgb(var(--v-theme-secondary));
  background: rgba(var(--v-theme-secondary), 0.1);
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.settings-grid__item {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--surface-border);
  border-radius: $border-radius-md;
  background: rgba(var(--v-theme-on-surface), 0.025);

  dt {
    margin-bottom: 6px;
    color: rgb(var(--v-theme-on-surface-variant));
    font-size: 0.7rem;
    font-weight: 750;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  dd {
    overflow-wrap: anywhere;
    margin: 0;
    color: rgb(var(--v-theme-on-surface));
    font-size: 0.95rem;
    font-weight: 650;
  }
}

.settings-card__actions {
  display: flex;
  gap: 10px;
  padding: 18px 24px 24px;
}

.settings-empty {
  display: grid;
  place-items: center;
  min-height: 180px;
  color: rgb(var(--v-theme-on-surface-variant));
  text-align: center;
}

.settings-fallback {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  padding: clamp(20px, 4vw, 28px);

  h2,
  p {
    margin: 0;
  }

  h2 {
    color: rgb(var(--v-theme-on-surface));
    font-size: 1.2rem;
  }

  p {
    margin-top: 4px;
    color: rgb(var(--v-theme-on-surface-variant));
  }
}

@media (max-width: $breakpoint-sm) {
  .settings-page__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .settings-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .settings-fallback {
    grid-template-columns: auto minmax(0, 1fr);

    .v-btn {
      grid-column: 1 / -1;
      width: 100%;
    }
  }
}

@media (max-width: $breakpoint-xs) {
  .settings-card__title,
  .settings-card__actions {
    padding-right: 18px;
    padding-left: 18px;
  }

  .settings-card__actions {
    display: grid;

    .v-btn {
      width: 100%;
    }
  }
}
</style>
