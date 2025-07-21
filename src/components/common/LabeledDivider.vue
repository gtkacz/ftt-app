<template>
	<div class="labeled-divider">
		<v-divider class="labeled-divider__divider" />
		<span class="labeled-divider__label">
			<slot>{{ label }}</slot>
		</span>
		<v-divider class="labeled-divider__divider" />
	</div>
</template>

<script setup lang="ts">

// Label prop can be not passed if the slot is used
const props = withDefaults(defineProps<{
	label?: string | null;
}>(), {
	label: null
});
</script>

<style lang="scss" scoped>
.labeled-divider {
	display: flex;
	align-items: center;
	width: 100%;

	&__divider {
		flex: 1;
	}

	&__label {
		margin: 0 16px;
		white-space: nowrap;
		font-weight: 500;
		color: rgba(0, 0, 0, 0.6);
	}
}
</style>
