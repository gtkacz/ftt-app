<template>
	<v-dialog v-model="open" max-width="400px">
		<v-card>
			<v-card-title class="headline">{{ title }}</v-card-title>
			<v-card-text>
				{{ text }}
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn variant="text" @click="cancel">No</v-btn>
				<v-btn color="primary" @click="confirm">Yes</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts" setup>
import { ref, defineProps, onMounted } from 'vue'

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
</style>