<template>
	<v-btn icon variant="text" @click="toggleTheme" class="action-btn" :loading="loading"
		:aria-label="label" :title="label">
		<v-icon :icon="isDark ? 'light_mode' : 'dark_mode'" />
	</v-btn>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useThemeStore } from '@/stores/theme';

const loading = ref(true);
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
const label = computed(() => isDark.value ? 'Use light theme' : 'Use dark theme')

onMounted(() => {
	loading.value = false;
});

const toggleTheme = () => {
	themeStore.toggleTheme()
}
</script>
