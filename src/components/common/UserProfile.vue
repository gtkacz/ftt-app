<template>
  <div class="user-data">
    <h3>Dados do Usuário (JWT)</h3>
    <div v-if="authStore.user">
      <p><strong>ID:</strong> {{ authStore.user.id }}</p>
      <p><strong>Username:</strong> {{ authStore.user.username }}</p>
      <p><strong>Nome:</strong> {{ authStore.user.first_name }} {{ authStore.user.last_name }}</p>
      <p><strong>Email:</strong> {{ authStore.user.email }}</p>
      <p><strong>Staff:</strong> {{ authStore.user.is_staff ? 'Sim' : 'Não' }}</p>
      <p><strong>Ativo:</strong> {{ authStore.user.is_active ? 'Sim' : 'Não' }}</p>
      <p><strong>Aprovado:</strong> {{ authStore.user.is_approved ? 'Sim' : 'Não' }}</p>
    </div>
    <p v-else>Nenhum usuário autenticado</p>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../../stores/auth';

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