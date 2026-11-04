<script setup lang="ts">
// The header of the page of a plugin or a language, made from its card (see ../catalog.ts): its
// logo, name and summary, then what kind it is and its facts, then its links.
// - an external plugin: its version, the plugin interface, the files it opens, its repository
//   and downloads;
// - a built-in plugin: how it is on, its key in `.atelier/config.json`, its parent or its
//   sub-plugins, its code in the IDE;
// - a language: the files that turn it on, its key, its code in the IDE.
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { categories } from './categories'
import { usePlugin } from './usePlugin'

const { plugin: p, parent, subs, l, prefix } = usePlugin()
const ext = computed(() => p.value?.external)
const isLanguage = computed(() => p.value?.category === 'languages')

const t = computed(() =>
  l.value === 'fr'
    ? {
        catalog: 'Catalogue',
        external: 'Plugin externe',
        builtin: 'Plugin intégré',
        language: 'Langage',
        version: 'Version',
        interface: 'Interface',
        category: 'Catégorie',
        opens: 'Ouvre',
        files: 'Fichiers',
        toolWindow: 'Une fenêtre d’outils',
        state: 'Activation',
        on: 'Activé par défaut',
        auto: 'Automatique',
        key: 'Clé',
        partOf: 'Fait partie de',
        subs: 'Sous-plugins',
        repo: 'Dépôt',
        releases: 'Téléchargements',
        install: 'Installer',
        activation: 'L’activer',
        code: 'Son code',
      }
    : {
        catalog: 'Catalog',
        external: 'External plugin',
        builtin: 'Built-in plugin',
        language: 'Language',
        version: 'Version',
        interface: 'Interface',
        category: 'Category',
        opens: 'Opens',
        files: 'Files',
        toolWindow: 'A tool window',
        state: 'State',
        on: 'On by default',
        auto: 'Automatic',
        key: 'Key',
        partOf: 'Part of',
        subs: 'Sub-plugins',
        repo: 'Repository',
        releases: 'Downloads',
        install: 'Install',
        activation: 'Turn it on or off',
        code: 'Its code',
      },
)

const kind = computed(() => (ext.value ? t.value.external : isLanguage.value ? t.value.language : t.value.builtin))

const accent = computed(() => {
  if (!p.value) return {}
  const [a, b] = categories[p.value.category].color
  return { '--accent-a': a, '--accent-b': b }
})

const repoName = computed(() => ext.value?.repo.replace('https://github.com/', ''))
const anchor = computed(() =>
  ext.value ? (l.value === 'fr' ? '#installation' : '#install') : '#activation',
)
const catalog = computed(() =>
  withBase(`${prefix.value}/plugins/${ext.value ? '#external-plugins-list' : ''}`),
)
const href = (link?: string) => (link ? withBase(`${prefix.value}/${link}`) : undefined)
const code = computed(() =>
  p.value?.code ? `https://github.com/atelier-ide-org/app/tree/main/${p.value.code}` : undefined,
)
</script>

<template>
  <header v-if="p" class="hero" :style="accent">
    <div class="glow" aria-hidden="true" />

    <a class="crumb" :href="catalog">← {{ t.catalog }} · {{ kind }}</a>

    <div class="main">
      <div class="logo" :class="{ themed: p.icon?.dark }">
        <template v-if="p.icon">
          <img class="light" :src="p.icon.light" alt="" />
          <img v-if="p.icon.dark" class="dark" :src="p.icon.dark" alt="" />
        </template>
        <span v-else class="initials">{{ p.name[l].slice(0, 2) }}</span>
      </div>
      <div class="ident">
        <h1 class="name">{{ p.name[l] }}</h1>
        <p class="summary">{{ p.summary[l] }}</p>
      </div>
    </div>

    <!-- External plugin -->
    <dl v-if="ext" class="facts">
      <div>
        <dt>{{ t.version }}</dt>
        <dd><code>v{{ ext.version }}</code></dd>
      </div>
      <div>
        <dt>{{ t.interface }}</dt>
        <dd><code>v{{ ext.abi }}</code></dd>
      </div>
      <div>
        <dt>{{ t.category }}</dt>
        <dd>{{ categories[p.category][l] }}</dd>
      </div>
      <div class="wide">
        <dt>{{ t.opens }}</dt>
        <dd class="chips">
          <template v-if="ext.extensions.length">
            <code v-for="e in ext.extensions" :key="e" class="ext">.{{ e }}</code>
          </template>
          <span v-else>{{ t.toolWindow }}</span>
        </dd>
      </div>
    </dl>

    <!-- Built-in plugin or language -->
    <dl v-else class="facts">
      <div>
        <dt>{{ t.state }}</dt>
        <dd>
          <span v-if="p.activation === 'auto'" class="state auto">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9 1 3 9h4l-1 6 6-8H8z" /></svg>{{ t.auto }}
          </span>
          <span v-else class="state on"><span class="led" />{{ t.on }}</span>
        </dd>
      </div>
      <div>
        <dt>{{ t.key }}</dt>
        <dd><code>"{{ p.slug }}"</code></dd>
      </div>
      <div v-if="!isLanguage">
        <dt>{{ t.category }}</dt>
        <dd>{{ categories[p.category][l] }}</dd>
      </div>
      <div v-if="isLanguage && p.files?.length" class="wide">
        <dt>{{ t.files }}</dt>
        <dd class="chips"><code v-for="e in p.files" :key="e" class="ext">.{{ e }}</code></dd>
      </div>
      <div v-if="parent" class="wide">
        <dt>{{ t.partOf }}</dt>
        <dd class="chips">
          <a class="rel" :href="href(parent.link)">
            <img v-if="parent.icon" :src="parent.icon.light" alt="" />{{ parent.name[l] }}
          </a>
        </dd>
      </div>
      <div v-if="subs.length" class="wide">
        <dt>{{ t.subs }}</dt>
        <dd class="chips">
          <component :is="s.link ? 'a' : 'span'" v-for="s in subs" :key="s.slug" class="rel" :href="href(s.link)">
            <img v-if="s.icon" :src="s.icon.light" alt="" />{{ s.name[l] }}
          </component>
        </dd>
      </div>
    </dl>

    <div class="actions">
      <a class="action primary" :href="anchor">{{ ext ? t.install : t.activation }}</a>
      <template v-if="ext">
        <a class="action mono" :href="ext.repo" target="_blank" rel="noreferrer">
          <svg class="gh" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
            />
          </svg>
          {{ repoName }}
        </a>
        <a class="action" :href="ext.releases" target="_blank" rel="noreferrer">
          {{ t.releases }}
          <svg class="out" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3h7v7M13 3 4 12" /></svg>
        </a>
      </template>
      <a v-else-if="code" class="action mono" :href="code" target="_blank" rel="noreferrer">
        <svg class="gh" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M5.5 4 1.5 8l4 4M10.5 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        {{ p.code }}
        <svg class="out" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3h7v7M13 3 4 12" /></svg>
      </a>
    </div>
  </header>
</template>

<style scoped>
.hero {
  position: relative;
  margin: 0 0 32px;
  padding: 24px 24px 22px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--at-r-lg);
  background: var(--vp-c-bg-soft);
  overflow: hidden;
  isolation: isolate;
}

/* A wash of the colors of its category, from the top right corner. */
.glow {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--accent-b) 9%, transparent), transparent 55%),
    radial-gradient(circle at 70% -20%, color-mix(in srgb, var(--accent-a) 7%, transparent), transparent 50%);
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: linear-gradient(90deg, var(--accent-a), var(--accent-b));
}

.crumb {
  display: inline-block;
  margin-bottom: 18px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--vp-c-text-2) !important;
  text-decoration: none !important;
}

.crumb:hover {
  color: var(--vp-c-brand-1) !important;
}

.main {
  display: flex;
  align-items: center;
  gap: 18px;
}

.logo {
  flex: none;
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: var(--at-r-lg);
  background: var(--vp-c-bg);
  box-shadow:
    inset 0 0 0 1px var(--vp-c-divider),
    0 0 0 4px color-mix(in srgb, var(--accent-a) 16%, transparent),
    0 12px 30px -16px var(--accent-a);
}

.logo img {
  width: 42px;
  height: 42px;
}

.logo .dark,
:global(.dark) .logo.themed .light {
  display: none;
}

:global(.dark) .logo.themed .dark {
  display: block;
}

.initials {
  font-size: 24px;
  font-weight: 700;
}

.ident {
  min-width: 0;
}

.name {
  margin: 0 !important;
  font-size: 30px !important;
  line-height: 1.2 !important;
  font-weight: 700 !important;
  letter-spacing: -0.02em;
}

.summary {
  margin: 6px 0 0 !important;
  font-size: 16px;
  line-height: 1.55;
  color: var(--vp-c-text-2);
}

.facts {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 30px;
  margin: 22px 0 0 !important;
  padding: 16px 0 0;
  border-top: 1px solid var(--vp-c-divider);
}

.facts .wide {
  flex-basis: 100%;
}

.facts dt {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
}

.facts dd {
  margin: 5px 0 0 !important;
  font-size: 14px;
  color: var(--vp-c-text-1);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.ext {
  font-size: 12px !important;
}

.state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 500;
}

.state.on {
  color: var(--vp-c-green-1);
  background: var(--vp-c-green-soft);
}

.state.auto {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.state svg {
  width: 11px;
  height: 11px;
  fill: currentColor;
}

.led {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 20%, transparent);
}

.rel {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--at-r);
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-1) !important;
  text-decoration: none !important;
  background: var(--vp-c-bg);
}

.rel img {
  width: 14px;
  height: 14px;
}

a.rel:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1) !important;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}

.action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--at-r);
  font-size: 13.5px;
  font-weight: 500;
  color: var(--vp-c-text-1) !important;
  text-decoration: none !important;
  background: var(--vp-c-bg);
  transition: border-color 0.2s, color 0.2s, filter 0.2s;
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

.action.mono {
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
}

.gh {
  width: 14px;
  height: 14px;
  fill: currentColor;
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

@media (max-width: 640px) {
  .hero {
    padding: 20px 16px 18px;
  }

  .main {
    align-items: flex-start;
  }

  .logo {
    width: 56px;
    height: 56px;
  }

  .logo img {
    width: 32px;
    height: 32px;
  }

  .name {
    font-size: 24px !important;
  }

  .action.mono {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
