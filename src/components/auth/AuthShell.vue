<template>
  <section class="auth-shell" :class="{ 'auth-shell--compact-mobile': compactOnMobile }">
    <header class="auth-shell__header">
      <router-link :to="brandTo" class="auth-shell__brand" :aria-label="brandLabel ?? t('authShell.brandLabel')">
        <app-logo size="38px" :reactive="false" />
        <span>
          <strong>{{ t('authShell.brandNamePart1') }}</strong>
          <small>{{ t('authShell.brandNamePart2') }}</small>
        </span>
      </router-link>
      <div class="auth-shell__header-actions">
        <language-switcher />
        <theme-changer />
      </div>
    </header>

    <div class="auth-shell__court" aria-hidden="true">
      <span class="auth-shell__center-circle" />
      <span class="auth-shell__arc" />
    </div>

    <div class="auth-shell__layout">
      <aside class="auth-shell__story">
        <p class="eyebrow">{{ t('authShell.story.eyebrow') }}</p>
        <h1>{{ t('authShell.story.headlineLine1') }}<br><span>{{ t('authShell.story.headlineLine2') }}</span></h1>
        <p class="auth-shell__lede">
          {{ t('authShell.story.lede') }}
        </p>

        <ul class="auth-shell__features" :aria-label="t('authShell.features.ariaLabel')">
          <li>
            <v-icon icon="groups" size="20" />
            <span><strong>{{ t('authShell.features.build.strong') }}</strong> {{ t('authShell.features.build.rest') }}</span>
          </li>
          <li>
            <v-icon icon="handshake" size="20" />
            <span><strong>{{ t('authShell.features.trade.strong') }}</strong> {{ t('authShell.features.trade.rest') }}</span>
          </li>
          <li>
            <v-icon icon="trophy" size="20" />
            <span><strong>{{ t('authShell.features.season.strong') }}</strong> {{ t('authShell.features.season.rest') }}</span>
          </li>
        </ul>
      </aside>

      <main class="auth-shell__panel">
        <slot />
      </main>
    </div>

    <footer class="auth-shell__footer">
      <span>{{ t('authShell.footer.abbreviation') }}</span>
      <span aria-hidden="true">•</span>
      <span>v{{ version }}</span>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

withDefaults(defineProps<{
  brandTo?: string
  brandLabel?: string
  compactOnMobile?: boolean
}>(), {
  brandTo: '/login',
  brandLabel: undefined,
  compactOnMobile: false,
})

const version = __APP_VERSION__
</script>

<style lang="scss" scoped>
.auth-shell {
  position: relative;
  isolation: isolate;
  display: grid;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden auto;
  padding: calc(88px + env(safe-area-inset-top)) max(22px, env(safe-area-inset-right))
    calc(30px + env(safe-area-inset-bottom)) max(22px, env(safe-area-inset-left));
  color: rgb(var(--v-theme-on-background));
  background: rgb(var(--v-theme-background));
}

.auth-shell__header {
  position: absolute;
  top: env(safe-area-inset-top);
  left: max(22px, env(safe-area-inset-left));
  right: max(22px, env(safe-area-inset-right));
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 76px;
}

.auth-shell__header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.auth-shell__brand {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  min-height: 44px;
  color: rgb(var(--v-theme-on-background));

  > span {
    display: flex;
    flex-direction: column;
    line-height: 1;
  }

  strong {
    font-size: 0.95rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  small {
    margin-top: 4px;
    color: rgb(var(--v-theme-on-surface-variant));
    font-size: 0.63rem;
    font-weight: 700;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }
}

.auth-shell__court {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  opacity: 0.55;
  pointer-events: none;

  &::before {
    content: "";
    position: absolute;
    top: -12%;
    bottom: -12%;
    left: 46%;
    width: 1px;
    background: rgba(var(--v-theme-on-surface), 0.09);
  }
}

.auth-shell__center-circle {
  position: absolute;
  top: 50%;
  left: 46%;
  width: min(31vw, 420px);
  aspect-ratio: 1;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.auth-shell__arc {
  position: absolute;
  top: 50%;
  right: -12rem;
  width: 31rem;
  height: 48rem;
  border: 1px solid rgba(var(--v-theme-secondary), 0.1);
  border-radius: 50%;
  transform: translateY(-50%);
}

.auth-shell__layout {
  align-self: center;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(380px, 470px);
  align-items: center;
  gap: clamp(48px, 9vw, 132px);
  width: min(100%, 1180px);
  margin: auto;
}

.auth-shell__story {
  max-width: 620px;

  h1 {
    max-width: 12ch;
    margin: 0;
    font-size: clamp(3rem, 5.5vw, 5.7rem);
    font-weight: 780;
    letter-spacing: -0.065em;
    line-height: 0.96;

    span {
      color: rgb(var(--v-theme-secondary));
    }
  }
}

.auth-shell__lede {
  max-width: 50ch;
  margin: 28px 0 0;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: clamp(1rem, 1.3vw, 1.15rem);
  line-height: 1.7;
}

.auth-shell__features {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 34px 0 0;
  padding: 0;
  list-style: none;

  li {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 42px;
    padding: 8px 12px;
    border: 1px solid var(--surface-border);
    border-radius: 999px;
    color: rgb(var(--v-theme-on-surface-variant));
    background: rgba(var(--v-theme-surface), 0.62);
    font-size: 0.82rem;
  }

  .v-icon,
  strong {
    color: rgb(var(--v-theme-secondary));
  }
}

.auth-shell__panel {
  width: 100%;
  padding: clamp(26px, 4vw, 42px);
  border: 1px solid var(--surface-border-strong);
  border-radius: $border-radius-xl;
  background: rgba(var(--v-theme-surface), 0.92);
  box-shadow: $shadow-xl;
}

.auth-shell__footer {
  position: absolute;
  right: max(24px, env(safe-area-inset-right));
  bottom: max(18px, env(safe-area-inset-bottom));
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.7rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (max-width: #{$breakpoint-md - 1px}) {
  .auth-shell {
    overflow-x: hidden;
    padding-top: calc(92px + env(safe-area-inset-top));
  }

  .auth-shell__court::before {
    left: 50%;
  }

  .auth-shell__center-circle {
    top: 24%;
    left: 86%;
    width: 340px;
  }

  .auth-shell__layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 34px;
    max-width: 600px;
  }

  .auth-shell__story {
    h1 {
      max-width: 13ch;
      font-size: clamp(2.4rem, 10vw, 4rem);
    }
  }

  .auth-shell--compact-mobile .auth-shell__story {
    display: none;
  }

  .auth-shell--compact-mobile .auth-shell__layout {
    gap: 0;
  }

  .auth-shell__lede {
    max-width: 44ch;
    margin-top: 18px;
  }

  .auth-shell__features {
    display: none;
  }

  .auth-shell__footer {
    position: static;
    justify-content: center;
    margin-top: 24px;
  }
}

@media (max-width: $breakpoint-xs) {
  .auth-shell {
    padding-right: max(16px, env(safe-area-inset-right));
    padding-bottom: calc(22px + env(safe-area-inset-bottom));
    padding-left: max(16px, env(safe-area-inset-left));
  }

  .auth-shell__header {
    left: max(16px, env(safe-area-inset-left));
    right: max(12px, env(safe-area-inset-right));
  }

  .auth-shell__story h1 {
    font-size: clamp(2.25rem, 12vw, 3rem);
  }

  .auth-shell__lede {
    display: none;
  }

  .auth-shell__layout {
    gap: 24px;
  }

  .auth-shell__panel {
    padding: 24px 20px;
    border-radius: 20px;
  }
}
</style>
