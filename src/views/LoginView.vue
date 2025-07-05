<template>
  <div>
    <h1>Login</h1>
    <form @submit.prevent="handleLogin">
      <input v-model="username" type="text" placeholder="Username" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit" :disabled="authStore.isLoading">
        {{ authStore.isLoading ? 'Loading...' : 'Login' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

const username = ref("");
const password = ref("");

const handleLogin = async () => {
  const success = await authStore.login({
    username: username.value,
    password: password.value,
  });

  if (success) {
    const redirectPath = router.currentRoute.value.query.redirect || '/';
    router.push(redirectPath as string);
  }
};
</script>