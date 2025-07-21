<template>
	<v-dialog v-model="open" class="confirm-dialog" persistent>
		<v-card class="d-flex flex-column align-center justify-center pa-8 gap-2" rounded="lg">
			<v-card-title class="d-flex align-center justify-center flex-column">
				<v-icon icon="warning" color="warning" />
				<v-spacer />
				<h6 class="text-h6">{{ title }}</h6>
			</v-card-title>
			<v-card-text>
				{{ text }}
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn rounded variant="outlined" class="action-btn" @click="cancel" prepend-icon="close">No</v-btn>
				<v-btn rounded variant="flat" color="primary" class="action-btn" @click="confirm"
					prepend-icon="check">Yes</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'

const props = defineProps<{
	title?: string
	text?: string
	onConfirm: () => void
	onCancel: () => void
}>()

const open = ref(false)

// Ensure dialog opens after mount
onMounted(() => {
	open.value = true
})

function confirm() {
	open.value = false
	props.onConfirm()
}

function cancel() {
	open.value = false
	props.onCancel()
}
</script>

<style scoped lang="scss">
.action-btn {
	min-width: 10vw !important;
}

.confirm-dialog {
	max-width: 25vw;

	@media (max-width: 600px) {
		max-width: 90vw;
	}
}
</style>