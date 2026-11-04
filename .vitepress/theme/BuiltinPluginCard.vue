<script setup lang="ts">
// The card of a built-in plugin or of a language in the catalog: its logo, name and category,
// what it does, the files of a language or the sub-plugins of a plugin, and how it is on in a
// project (on by default, or automatic: Git with a `.git`, a language with one of its files).
// The name links to its page and covers the card; the sub-plugins sit above it.
import { computed } from 'vue'
import { withBase } from 'vitepress'
import type { Plugin } from './catalog.data'
import { categories } from './categories'

const props = defineProps<{ plugin: Plugin; subs: Plugin[]; lang: 'en' | 'fr'; prefix: string }>()

const t = computed(() =>
  props.lang === 'fr'
    ? {
        files: 'Fichiers',
        subs: 'Sous-plugins',
        on: 'Activé par défaut',
        auto: 'Automatique',
        withGit: 'avec un .git',
        withFile: (ext: string) => `dès qu’un .${ext}`,
        docs: 'Documentation',
        more: (n: number) => `+${n}`,
      }
    : {
        files: 'Files',
        subs: 'Sub-plugins',
        on: 'On by default',
        auto: 'Automatic',
        withGit: 'with a .git',
        withFile: (ext: string) => `with a .${ext}`,
        docs: 'Documentation',
        more: (n: number) => `+${n}`,
      },
)

const p = computed(() => props.plugin)
const isLanguage = computed(() => p.value.category === 'languages')

const accent = computed(() => {
  const [a, b] = categories[p.value.category].color
  return { '--accent-a': a, '--accent-b': b }
})

const shown = 7
const files = computed(() => p.value.files?.slice(0, shown) ?? [])
const more = computed(() => Math.max(0, (p.value.files?.length ?? 0) - shown))
const allFiles = computed(() => (p.value.files ?? []).map((e) => `.${e}`).join(' '))

// What turns an automatic plugin on, said in a few words.
const autoHint = computed(() => {
  if (p.value.activation !== 'auto') return ''
  if (isLanguage.value && p.value.files?.length) return t.value.withFile(p.value.files[0])
  return p.value.slug === 'git' ? t.value.withGit : ''
})

const href = (link?: string) => (link ? withBase(`${props.prefix}/${link}`) : undefined)

const initials = computed(() => {
  const words = p.value.name[props.lang].replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean)
  return words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : p.value.name[props.lang].slice(0, 2)
})
</script>

<template>
  <article class="b-card" :class="{ linked: p.link, language: isLanguage }" :style="accent">
    <header class="head">
      <div class="logo" :class="{ themed: p.icon?.dark, initials: !p.icon }">
        <template v-if="p.icon">
          <img class="light" :src="p.icon.light" alt="" />
          <img v-if="p.icon.dark" class="dark" :src="p.icon.dark" alt="" />
        </template>
        <span v-else>{{ initials }}</span>
      </div>
      <div class="ident">
        <a v-if="p.link" class="name stretched" :href="href(p.link)">{{ p.name[lang] }}</a>
        <span v-else class="name">{{ p.name[lang] }}</span>
        <span class="category"><span class="dot" />{{ categories[p.category][lang] }}</span>
      </div>
    </header>

    <p class="summary">{{ p.summary[lang] }}</p>

    <div v-if="isLanguage && files.length" class="files">
      <code v-for="e in files" :key="e" class="ext">.{{ e }}</code>
      <span v-if="more" class="ext-more" :title="allFiles">{{ t.more(more) }}</span>
    </div>

    <div v-if="subs.length" class="subs">
      <span class="label">{{ t.subs }}</span>
      <component
        :is="s.link ? 'a' : 'span'"
        v-for="s in subs"
        :key="s.slug"
        class="sub"
        :href="href(s.link)"
        :title="s.summary[lang]"
      >
        <img v-if="s.icon" :src="s.icon.light" alt="" />
        {{ s.name[lang] }}
      </component>
    </div>

    <footer class="foot">
      <span v-if="p.activation === 'auto'" class="state auto" :title="autoHint">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9 1 3 9h4l-1 6 6-8H8z" /></svg>
        {{ t.auto }}<span v-if="autoHint" class="hint">· {{ autoHint }}</span>
      </span>
      <span v-else class="state on"><span class="led" />{{ t.on }}</span>
      <span v-if="p.link" class="more">{{ t.docs }} →</span>
    </footer>
  </article>
</template>

<style scoped>
.b-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--at-r-lg);
  background: var(--vp-c-bg-soft);
  overflow: hidden;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}

/* A thin line of the color of its category on top, fuller on hover. */
.b-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 2px;
  background: linear-gradient(90deg, var(--accent-a), var(--accent-b));
  opacity: 0.55;
  transition: opacity 0.2s, height 0.2s;
}

.b-card.linked:hover {
  border-color: color-mix(in srgb, var(--accent-a) 50%, var(--vp-c-divider));
  transform: translateY(-2px);
  box-shadow: 0 10px 26px -16px var(--accent-a);
}

.b-card.linked:hover::before {
  opacity: 1;
  height: 3px;
}

.head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--at-r-md);
  background: var(--vp-c-bg);
  box-shadow:
    inset 0 0 0 1px var(--vp-c-divider),
    0 0 0 3px color-mix(in srgb, var(--accent-a) 10%, transparent);
}

.logo img {
  width: 26px;
  height: 26px;
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
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-a), var(--accent-b));
}

.ident {
  min-width: 0;
}

.name {
  display: block;
  font-size: 15.5px;
  line-height: 1.3;
  font-weight: 600;
  color: var(--vp-c-text-1) !important;
  text-decoration: none !important;
}

.stretched::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.category {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-a), var(--accent-b));
}

.summary {
  flex: 1;
  margin: 0 !important;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--vp-c-text-2);
}

.files {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.ext {
  padding: 1px 6px !important;
  border-radius: var(--at-r-sm);
  font-size: 11.5px !important;
  color: var(--vp-c-text-1) !important;
  background: color-mix(in srgb, var(--accent-a) 12%, var(--vp-c-default-soft)) !important;
}

.ext-more {
  padding: 1px 6px;
  font-size: 11.5px;
  color: var(--vp-c-text-3);
  cursor: help;
}

.subs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px dashed var(--vp-c-divider);
}

.label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
}

.sub {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--at-r);
  font-size: 12.5px;
  font-weight: 500;
  color: var(--vp-c-text-1) !important;
  background: var(--vp-c-bg);
  text-decoration: none !important;
}

.sub img {
  width: 13px;
  height: 13px;
}

a.sub:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1) !important;
}

.foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
  white-space: nowrap;
}

.state.on {
  color: var(--vp-c-green-1);
  background: var(--vp-c-green-soft);
}

.state.auto {
  color: var(--vp-c-indigo-1, var(--vp-c-brand-1));
  background: var(--vp-c-brand-soft);
}

.state svg {
  width: 11px;
  height: 11px;
  fill: currentColor;
}

.hint {
  font-weight: 400;
  opacity: 0.85;
}

.led {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 20%, transparent);
}

.more {
  margin-left: auto;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  opacity: 0;
  transition: opacity 0.2s;
}

.b-card.linked:hover .more,
.b-card.linked:focus-within .more {
  opacity: 1;
}

@media (hover: none) {
  .more {
    opacity: 1;
  }
}
</style>
