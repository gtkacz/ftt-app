<template>
  <div class="home-view page-view">
    <section class="home-hero">
      <div class="home-hero__court" aria-hidden="true">
        <span />
      </div>

      <div class="home-hero__copy">
        <p class="eyebrow">{{ t('homeView.hero.eyebrow') }}</p>
        <h1>{{ greeting }}, <span>{{ firstName }}</span>.</h1>
        <p>
          {{ t('homeView.hero.description') }}
        </p>

        <div class="home-hero__actions">
          <router-link :to="teamRoute" class="home-button home-button--primary">
            {{ t('homeView.hero.openRoster') }}
            <v-icon icon="arrow_forward" size="20" />
          </router-link>
          <router-link :to="{ name: 'trade-overview' }" class="home-button home-button--quiet">
            {{ t('homeView.hero.tradeCenter') }}
          </router-link>
        </div>
      </div>

      <aside class="team-spotlight" :aria-label="t('homeView.hero.spotlight.ariaLabel')">
        <div class="team-spotlight__topline">
          <span class="team-spotlight__status"><i aria-hidden="true" /> {{ t('homeView.hero.spotlight.activeStatus') }}</span>
          <span class="team-spotlight__season">{{ t('homeView.hero.spotlight.leagueHq') }}</span>
        </div>

        <div class="team-spotlight__identity">
          <v-avatar size="72" color="primary" class="team-spotlight__avatar">
            <v-img v-if="user?.team?.avatar" :src="user.team.avatar" :alt="t('homeView.hero.spotlight.teamAvatarAlt', { team: teamName })" cover />
            <app-logo v-else size="48px" :reactive="false" />
          </v-avatar>
          <div>
            <small>{{ t('homeView.hero.spotlight.yourFranchise') }}</small>
            <h2>{{ teamName }}</h2>
            <p>@{{ user?.username }}</p>
          </div>
        </div>

        <router-link :to="{ name: 'dashboard', params: { id: teamId } }" class="team-spotlight__dashboard">
          <span>
            <small>{{ t('homeView.hero.spotlight.dashboardLabel') }}</small>
            <strong>{{ t('homeView.hero.spotlight.dashboardDescription') }}</strong>
          </span>
          <v-icon icon="arrow_outward" size="22" />
        </router-link>
      </aside>
    </section>

    <section class="home-section" aria-labelledby="quick-actions-title">
      <div class="home-section__header">
        <div>
          <p class="eyebrow">{{ t('homeView.quickActions.eyebrow') }}</p>
          <h2 id="quick-actions-title" class="section-title">{{ t('homeView.quickActions.title') }}</h2>
        </div>
        <p>{{ t('homeView.quickActions.subtitle') }}</p>
      </div>

      <div class="quick-grid">
        <router-link v-for="action in quickActions" :key="action.label" :to="action.to" class="quick-card">
          <span class="quick-card__icon" :class="`quick-card__icon--${action.tone}`">
            <v-icon :icon="action.icon" size="25" />
          </span>
          <span class="quick-card__content">
            <strong>{{ action.label }}</strong>
            <small>{{ action.description }}</small>
          </span>
          <v-icon class="quick-card__arrow" icon="arrow_forward" size="20" />
        </router-link>
      </div>
    </section>

    <section v-if="authStore.isStaff" class="commission-callout">
      <span class="commission-callout__icon"><v-icon icon="manage_accounts" size="24" /></span>
      <div>
        <p class="eyebrow">{{ t('homeView.commission.eyebrow') }}</p>
        <h2 class="section-title">{{ t('homeView.commission.title') }}</h2>
        <p>{{ t('homeView.commission.description') }}</p>
      </div>
      <router-link :to="{ name: 'commission' }" class="home-button home-button--quiet">
        {{ t('homeView.commission.openButton') }}
        <v-icon icon="arrow_forward" size="19" />
      </router-link>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const authStore = useAuthStore()
const user = computed(() => authStore.user)
const firstName = computed(() => user.value?.first_name || user.value?.username || t('homeView.hero.defaultManagerName'))
const teamName = computed(() => user.value?.team?.name || t('homeView.hero.spotlight.defaultTeamName'))
const teamId = computed(() => user.value?.team?.id || '')
const teamRoute = computed(() => ({ name: 'team', params: { id: teamId.value } }))

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return t('homeView.hero.greetingMorning')
  if (hour < 18) return t('homeView.hero.greetingAfternoon')
  return t('homeView.hero.greetingEvening')
})

const quickActions = computed(() => [
  {
    label: t('homeView.quickActions.myTeam.label'),
    description: t('homeView.quickActions.myTeam.description'),
    icon: 'person_play',
    tone: 'blue',
    to: teamRoute.value,
  },
  {
    label: t('homeView.quickActions.playerDirectory.label'),
    description: t('homeView.quickActions.playerDirectory.description'),
    icon: 'clinical_notes',
    tone: 'cyan',
    to: { name: 'players' },
  },
  {
    label: t('homeView.quickActions.tradeCenter.label'),
    description: t('homeView.quickActions.tradeCenter.description'),
    icon: 'handshake',
    tone: 'orange',
    to: { name: 'trade-overview' },
  },
  {
    label: t('homeView.quickActions.teamAnalytics.label'),
    description: t('homeView.quickActions.teamAnalytics.description'),
    icon: 'analytics',
    tone: 'violet',
    to: { name: 'dashboard', params: { id: teamId.value } },
  },
])
</script>

<style lang="scss" scoped>
.home-view {
  display: grid;
  gap: clamp(28px, 4vw, 46px);
}

.home-hero {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
  align-items: center;
  gap: clamp(32px, 6vw, 84px);
  min-height: clamp(430px, 59vh, 620px);
  overflow: hidden;
  padding: clamp(28px, 5vw, 72px);
  border: 1px solid var(--surface-border);
  border-radius: $border-radius-xl;
  background: rgb(var(--v-theme-surface));
  box-shadow: $shadow-md;
}

.home-hero__court {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;

  &::before {
    content: "";
    position: absolute;
    top: -20%;
    bottom: -20%;
    left: 54%;
    width: 1px;
    background: rgba(var(--v-theme-on-surface), 0.07);
  }

  span {
    position: absolute;
    top: 50%;
    left: 54%;
    width: min(36vw, 470px);
    aspect-ratio: 1;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
}

.home-hero__copy {
  max-width: 760px;

  h1 {
    max-width: 12ch;
    margin: 0;
    color: rgb(var(--v-theme-on-surface));
    font-size: clamp(2.8rem, 5.7vw, 6rem);
    font-weight: 790;
    letter-spacing: -0.065em;
    line-height: 0.96;

    span {
      color: rgb(var(--v-theme-secondary));
    }
  }

  > p:not(.eyebrow) {
    max-width: 54ch;
    margin: 24px 0 0;
    color: rgb(var(--v-theme-on-surface-variant));
    font-size: clamp(1rem, 1.2vw, 1.12rem);
    line-height: 1.7;
  }
}

.home-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}

.home-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 48px;
  padding: 11px 18px;
  border: 1px solid transparent;
  border-radius: $border-radius-md;
  font-size: 0.9rem;
  font-weight: 720;
  transition: transform $transition-fast, border-color $transition-fast, background-color $transition-fast;

  &--primary {
    color: rgb(var(--v-theme-on-secondary));
    background: rgb(var(--v-theme-secondary));
    box-shadow: 0 10px 24px rgba(var(--v-theme-secondary), 0.18);
  }

  &--quiet {
    border-color: var(--surface-border-strong);
    color: rgb(var(--v-theme-on-surface));
    background: rgba(var(--v-theme-surface), 0.58);
  }
}

.team-spotlight {
  position: relative;
  padding: clamp(22px, 3vw, 30px);
  border: 1px solid var(--surface-border-strong);
  border-radius: $border-radius-xl;
  background: rgba(var(--v-theme-surface), 0.88);
  box-shadow: $shadow-lg;
}

.team-spotlight__topline,
.team-spotlight__identity,
.team-spotlight__dashboard {
  display: flex;
  align-items: center;
}

.team-spotlight__topline {
  justify-content: space-between;
  gap: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.team-spotlight__status {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: rgb(var(--v-theme-success));
    box-shadow: 0 0 0 4px rgba(var(--v-theme-success), 0.12);
  }
}

.team-spotlight__identity {
  gap: 16px;
  margin-top: 28px;

  > div:last-child {
    min-width: 0;
  }

  small,
  p {
    color: rgb(var(--v-theme-on-surface-variant));
  }

  small {
    display: block;
    font-size: 0.72rem;
    font-weight: 650;
  }

  h2 {
    display: -webkit-box;
    overflow: hidden;
    margin: 3px 0;
    color: rgb(var(--v-theme-on-surface));
    font-size: clamp(1.25rem, 2vw, 1.65rem);
    font-weight: 750;
    letter-spacing: -0.035em;
    line-height: 1.15;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  p {
    margin: 0;
    font-size: 0.82rem;
  }
}

.team-spotlight__avatar {
  flex: 0 0 auto;
  border: 1px solid rgba(var(--v-theme-secondary), 0.25);
  background: rgba(var(--v-theme-primary), 0.65) !important;
}

.team-spotlight__dashboard {
  justify-content: space-between;
  gap: 14px;
  margin-top: 26px;
  padding: 15px 16px;
  border: 1px solid var(--surface-border);
  border-radius: $border-radius-md;
  color: rgb(var(--v-theme-on-surface));
  background: rgba(var(--v-theme-on-surface), 0.035);

  span {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  small {
    color: rgb(var(--v-theme-on-surface-variant));
    font-size: 0.68rem;
  }

  strong {
    font-size: 0.82rem;
    font-weight: 680;
  }
}

.home-section {
  display: grid;
  gap: 20px;
}

.home-section__header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;

  > p {
    max-width: 38ch;
    margin: 0;
    color: rgb(var(--v-theme-on-surface-variant));
    font-size: 0.9rem;
    text-align: right;
  }
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.quick-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  min-height: 112px;
  padding: 18px;
  border: 1px solid var(--surface-border);
  border-radius: $border-radius-lg;
  color: rgb(var(--v-theme-on-surface));
  background: rgb(var(--v-theme-surface));
  box-shadow: $shadow-sm;
  transition: transform $transition-fast, border-color $transition-fast, box-shadow $transition-fast;
}

.quick-card__icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;

  &--blue {
    color: #8fa4ff;
    background: rgba(91, 113, 220, 0.14);
  }

  &--cyan {
    color: rgb(var(--v-theme-info));
    background: rgba(var(--v-theme-info), 0.12);
  }

  &--orange {
    color: rgb(var(--v-theme-secondary));
    background: rgba(var(--v-theme-secondary), 0.12);
  }

  &--violet {
    color: #c6a7ff;
    background: rgba(144, 97, 249, 0.13);
  }
}

.quick-card__content {
  display: grid;
  gap: 6px;
  min-width: 0;

  strong {
    font-size: 0.95rem;
    font-weight: 720;
  }

  small {
    color: rgb(var(--v-theme-on-surface-variant));
    font-size: 0.75rem;
    line-height: 1.45;
  }
}

.quick-card__arrow {
  color: rgb(var(--v-theme-on-surface-variant));
  transition: transform $transition-fast, color $transition-fast;
}

.commission-callout {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  padding: 20px;
  border: 1px solid rgba(var(--v-theme-secondary), 0.2);
  border-radius: $border-radius-lg;
  background: rgba(var(--v-theme-secondary), 0.055);

  p:not(.eyebrow) {
    margin: 7px 0 0;
    color: rgb(var(--v-theme-on-surface-variant));
    font-size: 0.86rem;
  }
}

.commission-callout__icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 15px;
  color: rgb(var(--v-theme-secondary));
  background: rgba(var(--v-theme-secondary), 0.12);
}

@media (hover: hover) {
  .home-button:hover,
  .quick-card:hover {
    transform: translateY(-2px);
  }

  .quick-card:hover {
    border-color: rgba(var(--v-theme-secondary), 0.28);
    box-shadow: $shadow-md;

    .quick-card__arrow {
      color: rgb(var(--v-theme-secondary));
      transform: translateX(3px);
    }
  }
}

@media (max-width: #{$breakpoint-lg - 1px}) {
  .quick-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: #{$breakpoint-md - 1px}) {
  .home-hero {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .home-hero__copy h1 {
    max-width: 10ch;
  }

  .home-hero__court::before,
  .home-hero__court span {
    left: 82%;
  }
}

@media (max-width: $breakpoint-xs) {
  .home-view {
    gap: 30px;
  }

  .home-hero {
    gap: 28px;
    margin: -2px;
    padding: 24px 20px;
    border-radius: 20px;
  }

  .home-hero__copy h1 {
    max-width: 11ch;
    font-size: clamp(2.55rem, 13vw, 3.7rem);
  }

  .home-hero__copy > p:not(.eyebrow) {
    margin-top: 18px;
    font-size: 0.94rem;
    line-height: 1.6;
  }

  .home-hero__actions {
    display: grid;
    grid-template-columns: 1fr;
    margin-top: 24px;
  }

  .home-button {
    width: 100%;
  }

  .team-spotlight {
    padding: 20px;
    border-radius: 18px;
  }

  .team-spotlight__identity {
    margin-top: 22px;
  }

  .home-section__header {
    display: block;

    > p {
      margin-top: 8px;
      text-align: left;
    }
  }

  .quick-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .quick-card {
    min-height: 94px;
    padding: 15px;
  }

  .commission-callout {
    grid-template-columns: auto minmax(0, 1fr);

    .home-button {
      grid-column: 1 / -1;
    }
  }
}
</style>
