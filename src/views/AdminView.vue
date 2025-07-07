<template>
  <div v-if="authStore.isStaff">
    <h1>Painel Administrativo</h1>
  </div>
  <div v-else>
    <p>Acesso restrito a administradores</p>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
</script>