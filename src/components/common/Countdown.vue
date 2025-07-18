<template>
	<div :class="[containerClass, { 'text-danger': isExpired }]" :style="{ width: widthPx }" v-tooltip="actualDate">
		<div ref="timerRef" :class="['countdown-display', displayClass, { [expiredClass]: isExpired }]">
			{{ formattedTime }}
		</div>

		<v-progress-linear v-if="showProgress" :model-value="progressPercentage"
			:color="isExpired ? 'danger' : 'primary'" height="8" rounded class="mt-4" />
	</div>
</template>

<script setup lang="ts">
import {
	ref,
	computed,
	onMounted,
	onUnmounted,
	watch,
	nextTick,
	withDefaults,
	defineProps,
	defineEmits,
} from 'vue'
import moment from 'moment'

const props = withDefaults(
	defineProps<{
		value: number            // Can be minutes or Unix timestamp
		timestamp?: boolean      // If true, value is treated as Unix timestamp
		startFrom?: number       // initial total minutes for progress bar
		showProgress?: boolean
		containerClass?: string
		displayClass?: string
		expiredClass?: string
		showExtended?: boolean   // enable years/months/days display
	}>(),
	{
		timestamp: false,
		startFrom: 0,
		showProgress: true,
		containerClass: '',
		displayClass: '',
		expiredClass: 'text-danger',
		showExtended: true,
	}
)

const emit = defineEmits<{
	(e: 'minutes-change', minutes: number): void
	(e: 'expired', flag: true): void
}>()

const timerRef = ref<HTMLElement | null>(null)
const widthPx = ref<string>('auto')

const actualDate = computed(() => {
	if (props.timestamp) {
		return moment.unix(props.value).format('YYYY-MM-DD HH:mm')
	}
	return moment().add(props.value, 'minutes').format('YYYY-MM-DD HH:mm')
})

const remainingSeconds = ref(0)
const totalProgressSeconds = ref(0)
let intervalId: number | null = null
let lastEmittedMinute = -1

const computedMinutes = computed(() => {
	if (props.timestamp) {
		const now = moment()
		const target = moment.unix(props.value)
		const diff = target.diff(now, 'minutes', true)
		return Math.max(0, Math.ceil(diff))
	}
	return props.value
})

function initializeTimer() {
	const mins = computedMinutes.value
	totalProgressSeconds.value = (props.startFrom || mins) * 60
	remainingSeconds.value = mins * 60
	lastEmittedMinute = Math.ceil(remainingSeconds.value / 60)
	emit('minutes-change', lastEmittedMinute)
}

const formattedTime = computed(() => {
	const secsTotal = remainingSeconds.value
	const seconds = secsTotal % 60
	const minsTotal = Math.floor(secsTotal / 60)
	const minutes = minsTotal % 60
	const hoursTotal = Math.floor(minsTotal / 60)
	const hours = hoursTotal % 24
	const daysTotal = Math.floor(hoursTotal / 24)
	const days = daysTotal % 30
	const monthsTotal = Math.floor(daysTotal / 30)
	const months = monthsTotal % 12
	const years = Math.floor(monthsTotal / 12)

	const two = (n: number) => n.toString().padStart(2, '0')
	let parts: string[] = []

	if (props.showExtended) {
		if (years > 0) {
			parts = [
				two(years),
				two(months),
				two(days),
				two(hours),
				two(minutes),
				two(seconds),
			]
		} else if (months > 0) {
			parts = [
				two(months),
				two(days),
				two(hours),
				two(minutes),
				two(seconds),
			]
		} else if (days > 0) {
			parts = [
				two(days),
				two(hours),
				two(minutes),
				two(seconds),
			]
		} else {
			parts = [
				two(hours),
				two(minutes),
				two(seconds),
			]
		}
	} else {
		parts = [
			two(hoursTotal),
			two(minutes),
			two(seconds),
		]
	}

	return parts.join(':')
})

const progressPercentage = computed(() =>
	totalProgressSeconds.value === 0
		? 0
		: ((totalProgressSeconds.value - remainingSeconds.value) /
			totalProgressSeconds.value) * 100
)

const isExpired = computed(() => remainingSeconds.value === 0)

function startTimer() {
	stopTimer()
	intervalId = window.setInterval(() => {
		if (remainingSeconds.value > 0) {
			remainingSeconds.value--
			const currentMin = Math.ceil(remainingSeconds.value / 60)
			if (currentMin !== lastEmittedMinute) {
				lastEmittedMinute = currentMin
				emit('minutes-change', currentMin)
			}
			if (remainingSeconds.value === 0) {
				emit('expired', true)
			}
		} else {
			stopTimer()
		}
	}, 1000)
}

function stopTimer() {
	if (intervalId !== null) {
		clearInterval(intervalId)
		intervalId = null
	}
}

watch(
	() => [props.value, props.timestamp],
	() => {
		stopTimer()
		initializeTimer()
		startTimer()
	},
	{ immediate: true }
)

onMounted(async () => {
	initializeTimer()
	startTimer()
	await nextTick()
	if (timerRef.value) {
		widthPx.value = `${timerRef.value.offsetWidth}px`
	}
})

onUnmounted(() => {
	stopTimer()
})
</script>

<style lang="scss" scoped>
.countdown-display {
	cursor: default;
	font-size: 2.5rem;
	font-weight: bold;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	letter-spacing: 0.1em;

	display: inline-block;
	white-space: nowrap;
	text-align: center;

	@media (max-width: 600px) {
		font-size: 2rem;
	}
}

.v-progress-linear {
	border-radius: 4px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
</style>
