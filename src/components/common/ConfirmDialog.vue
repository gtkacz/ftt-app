<template>
	<v-dialog :model-value="modelValue" @update:model-value="handleClose" class="w-100">
		<v-card>
			<v-card-title>
				<slot name="title">{{ t('confirmDialog.title') }}</slot>
			</v-card-title>
			<v-card-text>
				<slot name="text">{{ t('confirmDialog.text', { action: actionText }) }}</slot>
			</v-card-text>
			<v-card-actions>
				<slot name="actions">
					<v-btn text @click="handleClose">{{ t('confirmDialog.no') }}</v-btn>
					<v-btn color="primary" @click="handleConfirm">{{ t('confirmDialog.yes') }}</v-btn>
				</slot>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(
	defineProps<{
		modelValue: boolean
		textProp?: string
		onConfirm: () => void
		onCancel?: () => void
	}>(),
	{
		textProp: undefined,
		onCancel: () => { }
	}
)

const actionText = computed(() => props.textProp ?? t('confirmDialog.defaultAction'))

function handleConfirm() {
	props.onConfirm()
}

function handleClose() {
	props.onCancel?.()
}
</script>

<style lang="scss" scoped></style>
