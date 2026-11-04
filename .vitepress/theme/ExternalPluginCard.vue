<script setup lang="ts">
// The card of an external plugin in the catalog: not compiled into the IDE but installed from its
// Marketplace, so it shows what a built-in card does not: its repository, its version and the
// version of the plugin interface it was built for, the files it opens, where to download it and
// how to install it. Unlike a built-in card, the card is not one link: it has several actions.
import { computed } from 'vue'
import { withBase } from 'vitepress'
import type { Plugin } from './catalog.data'
import { categories } from './categories'

const props = defineProps<{ plugin: Plugin; lang: 'en' | 'fr'; prefix: string }>()

const t = computed(() =>
  props.lang === 'fr'
    ? {
        opens: 'Ouvre',
        toolWindow: 'Une fenêtre d’outils, sans fichier à ouvrir',
        interface: 'Interface',
        repo: 'Dépôt',
        releases: 'Téléchargements',
        docs: 'Documentation',
        install: 'Installer :',
        path: ['Plugins', 'Marketplace', 'Installer'],
        more: (n: number) => `et ${n} autres`,
      }
    : {
        opens: 'Opens',
        toolWindow: 'A tool window, no file to open',
        interface: 'Interface',
        repo: 'Repository',
        releases: 'Downloads',
        docs: 'Documentation',
        install: 'Install:',
        path: ['Plugins', 'Marketplace', 'Install'],
        more: (n: number) => `and ${n} more`,
      },
)

const p = computed(() => props.plugin)
const ext = computed(() => p.value.external!)
const repoName = computed(() => ext.value.repo.replace('https://github.com/', ''))

// The first extensions, then how many more (all of them in the tooltip).
const shown = 8
const extensions = computed(() => ext.value.extensions.slice(0, shown))
const more = computed(() => Math.max(0, ext.value.extensions.length - shown))
const allExtensions = computed(() => ext.value.extensions.map((e) => `.${e}`).join(' '))

const accent = computed(() => {
  const [a, b] = categories[p.value.category].color
  return { '--accent-a': a, '--accent-b': b }
})

const initials = computed(() => {
  const words = p.value.name[props.lang].replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean)
  return words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : p.value.name[props.lang].slice(0, 2)
})

const docs = computed(() => (p.value.link ? withBase(`${props.prefix}/${p.value.link}`) : undefined))
</script>

<template>
  <article class="ext-card" :style="accent">
    <header class="top">
      <div v-if="p.icon" class="logo" :class="{ themed: p.icon.dark }">
        <img class="light" :src="p.icon.light" alt="" />
        <img v-if="p.icon.dark" class="dark" :src="p.icon.dark" alt="" />
      </div>
      <div v-else class="logo initials">{{ initials }}</div>

      <div class="ident">
        <div class="name-row">
          <h3 class="name">{{ p.name[lang] }}</h3>
          <span class="version">v{{ ext.version }}</span>
        </div>
        <a class="repo-path" :href="ext.repo" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
            />
          </svg>
          {{ repoName }}
        </a>
      </div>

      <span class="category">{{ categories[p.category][lang] }}</span>
    </header>

    <p class="summary">{{ p.summary[lang] }}</p>

    <div class="opens">
      <span class="label">{{ t.opens }}</span>
      <template v-if="ext.extensions.length">
        <code v-for="e in extensions" :key="e" class="ext">.{{ e }}</code>
        <span v-if="more" class="ext-more" :title="allExtensions">{{ t.more(more) }}</span>
      </template>
      <span v-else class="tool-window">{{ t.toolWindow }}</span>
    </div>

    <div class="install">
      <span class="label">{{ t.install }}</span>
      <span class="path">
        <template v-for="(step, i) in t.path" :key="step">
          <span v-if="i" class="sep">›</span><kbd>{{ step }}</kbd>
        </template>
      </span>
      <span class="abi" :title="`abi ${ext.abi}`">{{ t.interface }} v{{ ext.abi }}</span>
    </div>

    <footer class="actions">
      <a class="action primary" :href="ext.repo" target="_blank" rel="noreferrer">
        {{ t.repo }}
        <svg class="out" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3h7v7M13 3 4 12" /></svg>
      </a>
      <a class="action" :href="ext.releases" target="_blank" rel="noreferrer">
        {{ t.releases }}
        <svg class="out" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3h7v7M13 3 4 12" /></svg>
      </a>
      <a v-if="docs" class="action docs" :href="docs">{{ t.docs }} →</a>
    </footer>
  </article>
</template>

<style scoped>
.ext-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--at-r-lg);
  background: var(--vp-c-bg-soft);
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}

/* The band of the color of its category, the mark of an external plugin. */
.ext-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: linear-gradient(90deg, var(--accent-a), var(--accent-b));
}

.ext-card:hover {
  border-color: color-mix(in srgb, var(--accent-a) 55%, var(--vp-c-divider));
  box-shadow: 0 10px 30px -18px var(--accent-a);
}

.top {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.logo {
  flex: none;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: var(--at-r-lg);
  background: var(--vp-c-bg);
  box-shadow:
    inset 0 0 0 1px var(--vp-c-divider),
    0 0 0 3px color-mix(in srgb, var(--accent-a) 14%, transparent);
}

.logo img {
  width: 30px;
  height: 30px;
}

.logo .dark,
:global(.dark) .logo.themed .light {
  display: none;
}

:global(.dark) .logo.themed .dark {
  display: block;
}

.logo.initials {
  color: #fff;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-a), var(--accent-b));
}

.ident {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.name {
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  font-size: 17px !important;
  line-height: 1.3 !important;
  font-weight: 650;
  color: var(--vp-c-text-1);
}

.version {
  padding: 1px 7px;
  border-radius: 999px;
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.repo-path {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 100%;
  margin-top: 4px;
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  color: var(--vp-c-text-2) !important;
  text-decoration: none !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.repo-path:hover {
  color: var(--vp-c-brand-1) !important;
}

.repo-path svg {
  flex: none;
  width: 13px;
  height: 13px;
  fill: currentColor;
}

.category {
  flex: none;
  padding: 2px 8px;
  border-radius: var(--at-r-sm);
  font-size: 11.5px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background: color-mix(in srgb, var(--accent-a) 12%, transparent);
}

.summary {
  margin: 0 !important;
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
}

.opens {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
}

.opens .label {
  margin-right: 4px;
}

.ext {
  padding: 1px 6px !important;
  border-radius: var(--at-r-sm);
  font-size: 12px !important;
  color: var(--vp-c-text-1) !important;
  background: var(--vp-c-default-soft) !important;
}

.ext-more,
.tool-window {
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}

.ext-more {
  cursor: help;
  text-decoration: underline dotted;
}

.install {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--at-r-md);
  background: var(--vp-c-bg);
  border: 1px dashed var(--vp-c-divider);
}

.path {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.path kbd {
  padding: 1px 7px;
  border: 1px solid var(--vp-c-divider);
  border-bottom-width: 2px;
  border-radius: var(--at-r-sm);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
}

.sep {
  color: var(--vp-c-text-3);
}

.abi {
  margin-left: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  color: var(--vp-c-text-3);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
}

.action {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--at-r);
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-1) !important;
  text-decoration: none !important;
  background: var(--vp-c-bg);
  transition: border-color 0.2s, color 0.2s, background-color 0.2s;
}

.action {
  gap: 6px;
}

.out {
  width: 11px;
  height: 11px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.action:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1) !important;
}

.action.primary {
  border-color: transparent;
  color: #fff !important;
  background: var(--at-accent);
}

.action.primary:hover {
  color: #fff !important;
  filter: brightness(1.08);
}

.action.docs {
  margin-left: auto;
}
</style>
