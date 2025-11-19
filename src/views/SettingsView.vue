<template>
  <div class="page-view">
    <div class="page-header">
      <h1 class="page-title">Settings</h1>
      <p class="page-subtitle">Configure your preferences</p>
    </div>

    <v-card v-if="settingsStore.isLoading" class="pa-4">
      <v-progress-circular indeterminate color="primary" />
      <span class="ml-4">Loading settings...</span>
    </v-card>

    <v-card v-else-if="settingsStore.isLoaded" class="pa-4">
      <v-card-title>
        Application Settings
        <v-chip class="ml-2" size="small" color="success" v-if="settingsStore.isCacheValid">
          Cached
        </v-chip>
      </v-card-title>

      <v-card-text>
        <v-alert type="info" class="mb-4">
          Settings are cached in local storage for 30 minutes to improve performance.
        </v-alert>

        <!-- Display settings (example - customize based on actual backend settings structure) -->
        <pre>{{ settingsStore.settings }}</pre>
      </v-card-text>

      <v-card-actions>
        <v-btn
          color="primary"
          @click="refreshSettings"
          :loading="settingsStore.isLoading"
        >
          Refresh Settings
        </v-btn>
        <v-btn
          color="secondary"
          @click="clearCache"
        >
          Clear Cache
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card v-else class="pa-4">
      <v-card-text>
        <v-alert type="warning">
          Failed to load settings or no settings available.
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="primary"
          @click="loadSettings"
          :loading="settingsStore.isLoading"
        >
          Load Settings
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSettingsStore } from '@/stores/settings';

const settingsStore = useSettingsStore();

// Load settings on component mount
// Will use cached version if available and not expired
onMounted(async () => {
  await loadSettings();
});

async function loadSettings() {
  try {
    await settingsStore.fetchSettings();
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function refreshSettings() {
  try {
    // Force refresh bypasses cache
    await settingsStore.fetchSettings(true);
  } catch (error) {
    console.error('Error refreshing settings:', error);
  }
}

function clearCache() {
  settingsStore.clearCache();
}
</script>

<style lang="scss" scoped>
.page-view {
  max-width: 1200px;
  margin: 0 auto;
}

.v-card {
  margin-bottom: 1rem;
}
</style>