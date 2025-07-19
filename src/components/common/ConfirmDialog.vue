<template>
	<v-dialog :model-value="modelValue" @update:model-value="handleClose">
		<v-card>
			<v-card-title>
				<slot name="title">Confirm</slot>
			</v-card-title>
			<v-card-text>
				<slot name="text">Are you sure you want to {{ textProp }}?</slot>
			</v-card-text>
			<v-card-actions>
				<slot name="actions">
					<v-btn text @click="handleClose">No</v-btn>
					<v-btn color="primary" @click="handleConfirm">Yes</v-btn>
				</slot>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts" setup>
import { defineProps, withDefaults } from 'vue'

const props = withDefaults(
	defineProps<{
		modelValue: boolean
		textProp?: string
		onConfirm: () => void
		onCancel?: () => void
	}>(),
	{
		textProp: 'confirm this action',
		onCancel: () => { }
	}
)

function handleConfirm() {
	props.onConfirm()
}

function handleClose() {
	props.onCancel?.()
}
</script>

<style lang="scss" scoped>
</style>
