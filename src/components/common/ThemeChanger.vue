<template>
	<v-btn icon variant="text" @click="toggleTheme" class="action-btn" :loading="loading"
		:aria-label="label" :title="label">
		<v-icon :icon="isDark ? 'light_mode' : 'dark_mode'" />
	</v-btn>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useThemeStore } from '@/stores/theme';

const { t } = useI18n();
const loading = ref(true);
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
const label = computed(() => isDark.value ? t('theme.useLight') : t('theme.useDark'))

onMounted(() => {
	loading.value = false;
});

const toggleTheme = () => {
	themeStore.toggleTheme()
}
</script>
