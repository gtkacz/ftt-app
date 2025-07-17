<template>
	<v-btn icon variant="text" @click="toggleTheme" class="action-btn" :loading="loading" v-tooltip="isDark ? 'Toggle Light Mode' : 'Toggle Dark Mode'">
		<v-icon :icon="isDark ? 'flash_on' : 'flash_off'" />
	</v-btn>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useThemeStore } from '../../stores/theme';

const loading = ref(true);
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

onMounted(() => {
	loading.value = false;
});

const toggleTheme = () => {
	themeStore.toggleTheme()
}
</script>