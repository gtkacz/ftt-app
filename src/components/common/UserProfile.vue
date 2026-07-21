<template>
  <div class="user-data">
    <h3>{{ t('userProfile.title') }}</h3>
    <div v-if="authStore.user">
      <p><strong>{{ t('userProfile.id') }}</strong> {{ authStore.user.id }}</p>
      <p><strong>{{ t('userProfile.username') }}</strong> {{ authStore.user.username }}</p>
      <p><strong>{{ t('userProfile.name') }}</strong> {{ authStore.user.first_name }} {{ authStore.user.last_name }}</p>
      <p><strong>{{ t('userProfile.email') }}</strong> {{ authStore.user.email }}</p>
      <p><strong>{{ t('userProfile.staff') }}</strong> {{ authStore.user.is_staff ? t('userProfile.yes') : t('userProfile.no') }}</p>
      <p><strong>{{ t('userProfile.active') }}</strong> {{ authStore.user.is_active ? t('userProfile.yes') : t('userProfile.no') }}</p>
      <p><strong>{{ t('userProfile.approved') }}</strong> {{ authStore.user.is_approved ? t('userProfile.yes') : t('userProfile.no') }}</p>
    </div>
    <p v-else>{{ t('userProfile.noUser') }}</p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const authStore = useAuthStore();
</script>

<style scoped>
.user-data {
  font-family: Arial, sans-serif;
  max-width: 400px;
  margin: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.user-data h3 {
  margin-top: 0;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.user-data p {
  margin: 8px 0;
}

.user-data strong {
  display: inline-block;
  width: 80px;
  color: #666;
}
</style>