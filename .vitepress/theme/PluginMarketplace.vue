<script setup lang="ts">
// The plugins as a marketplace, from their doc folders (see ../catalog.ts): a search bar and the
// categories, then three lists: the built-in plugins, the external plugins (installed from the
// Marketplace of the IDE, with their version and the files they open) and the languages, a card
// per plugin with its logo and a link to its page. The categories filter the two lists of
// plugins. The search ignores case and accents, and every word typed must be found in the name,
// the description, the category, the tags or the file extensions.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useData, withBase } from 'vitepress'
import { data as plugins, type Plugin } from './catalog.data'
import { categories } from './categories'
import ExternalPluginCard from './ExternalPluginCard.vue'
import BuiltinPluginCard from './BuiltinPluginCard.vue'
import type { Category } from '../catalog'

const { lang } = useData()
const l = computed<'en' | 'fr'>(() => (lang.value.startsWith('fr') ? 'fr' : 'en'))
const prefix = computed(() => (l.value === 'fr' ? '/fr' : ''))

const t = computed(() =>
  l.value === 'fr'
    ? {
        search: 'Rechercher un plugin, une extension, un outil…',
        all: 'Tous',
        languages: 'Langages',
        plugins: 'Plugins intégrés',
        externals: 'Plugins externes',
        externalsHint: 'Chacun dans son dépôt, à installer depuis l’IDE.',
        makeOne: 'Créer le vôtre avec atelier-cli',
        builtinsHint: 'Compilés dans l’IDE, dans tous les projets.',
        languagesHint: 'Activés dès que le projet a un de leurs fichiers.',
        noneHere: 'Aucun plugin dans cette catégorie pour cette recherche.',
        docs: 'Documentation',
        empty: 'Aucun plugin ne correspond à',
        reset: 'Effacer la recherche',
        clear: 'Effacer',
      }
    : {
        search: 'Search a plugin, a file extension, a tool…',
        all: 'All',
        languages: 'Languages',
        plugins: 'Built-in plugins',
        externals: 'External plugins',
        externalsHint: 'Each in its own repository, installed from the IDE.',
        makeOne: 'Make yours with atelier-cli',
        builtinsHint: 'Compiled into the IDE, in every project.',
        languagesHint: 'On as soon as the project has one of their files.',
        noneHere: 'No plugin in this category for this search.',
        docs: 'Documentation',
        empty: 'No plugin matches',
        reset: 'Clear the search',
        clear: 'Clear',
      },
)

const query = ref('')
const category = ref<Category | null>(null)
const input = ref<HTMLInputElement | null>(null)

const fold = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Sub-plugins are not cards of their own: they are listed in the card of their parent, and
// what they do is found by the search of their parent.
const subs = (p: Plugin) => plugins.filter((s) => s.parent === p.slug)
const top = plugins.filter((p) => !p.parent)

const text = (p: Plugin) =>
  [
    p.name.en,
    p.name.fr,
    p.summary[l.value],
    categories[p.category][l.value],
    ...p.tags,
    ...(p.external?.extensions ?? []),
    ...(p.files ?? []),
    p.slug,
  ].join(' ')

const haystacks = computed(() =>
  top.map((p) => fold([text(p), ...subs(p).map(text)].join(' '))),
)

const matching = computed(() => {
  const words = fold(query.value).split(/\s+/).filter(Boolean)
  return top.filter((_, i) => words.every((w) => haystacks.value[i].includes(w)))
})

// Built-in plugins, external plugins and languages are three lists; the categories filter the
// two lists of plugins.
const languages = computed(() => matching.value.filter((p) => p.category === 'languages'))
const others = computed(() => matching.value.filter((p) => p.category !== 'languages'))
const filtered = computed(() =>
  category.value ? others.value.filter((p) => p.category === category.value) : others.value,
)
const builtins = computed(() => filtered.value.filter((p) => !p.external))
const externals = computed(() => filtered.value.filter((p) => p.external))

const pluginCategories = (Object.keys(categories) as Category[]).filter((c) => c !== 'languages')

// The count of each category follows the search, so that a chip at 0 says where not to look.
const counts = computed(() => {
  const c = {} as Record<Category, number>
  for (const key of pluginCategories) c[key] = 0
  for (const p of others.value) c[p.category]++
  return c
})

const href = (link?: string) => (link ? withBase(`${prefix.value}/${link}`) : undefined)

// A list of plugins stays while the category hides its cards, to say so; a list without any
// plugin for the search is hidden.
const sections = computed(() => [
  {
    key: 'builtins',
    title: t.value.plugins,
    items: builtins.value,
    shown: others.value.some((p) => !p.external),
  },
  {
    key: 'externals',
    title: t.value.externals,
    items: externals.value,
    shown: others.value.some((p) => p.external),
  },
  { key: 'languages', title: t.value.languages, items: languages.value, shown: languages.value.length > 0 },
])

const tile = (c: Category) => {
  const [a, b] = categories[c].color
  return { background: `linear-gradient(135deg, ${a}, ${b})` }
}

const reset = () => {
  query.value = ''
  category.value = null
  input.value?.focus()
}

// `/` focuses the search, as on most marketplaces, unless the visitor is typing elsewhere.
const onKey = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement
  if (e.key !== '/' || target.closest('input, textarea, [contenteditable="true"]')) return
  e.preventDefault()
  input.value?.focus()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <section class="marketplace">
    <div class="search">
      <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        ref="input"
        v-model="query"
        type="search"
        :placeholder="t.search"
        :aria-label="t.search"
        autocomplete="off"
        spellcheck="false"
      />
      <button v-if="query" class="clear" type="button" :aria-label="t.clear" @click="reset">×</button>
      <kbd v-else class="hint">/</kbd>
    </div>

    <div v-if="others.length" class="chips" role="toolbar">
      <button type="button" class="chip" :class="{ active: !category }" @click="category = null">
        {{ t.all }} <span class="count">{{ others.length }}</span>
      </button>
      <button
        v-for="key in pluginCategories"
        :key="key"
        type="button"
        class="chip"
        :class="{ active: category === key, empty: !counts[key] }"
        @click="category = category === key ? null : key"
      >
        <span class="dot" :style="tile(key)" />
        {{ categories[key][l] }} <span class="count">{{ counts[key] }}</span>
      </button>
    </div>

    <template v-for="s in sections" :key="s.key">
      <div v-if="s.shown" :id="s.key === 'externals' ? 'external-plugins-list' : undefined" class="section">
        <div class="section-head">
          <span class="section-title">{{ s.title }}</span>
          <span class="section-count" aria-live="polite">{{ s.items.length }}</span>
          <span v-if="s.key === 'externals'" class="section-hint">
            {{ t.externalsHint }}
            <a :href="href('contributing/atelier-cli')">{{ t.makeOne }} →</a>
          </span>
          <span v-else class="section-hint">{{ s.key === 'languages' ? t.languagesHint : t.builtinsHint }}</span>
        </div>

        <!-- External plugins: a card of their own (see ExternalPluginCard.vue). -->
        <div v-if="s.key === 'externals' && s.items.length" class="grid ext-grid">
          <ExternalPluginCard v-for="p in s.items" :key="p.slug" :plugin="p" :lang="l" :prefix="prefix" />
        </div>

        <!-- Built-in plugins and languages (see BuiltinPluginCard.vue). -->
        <div v-else-if="s.items.length" class="grid" :class="{ 'lang-grid': s.key === 'languages' }">
          <BuiltinPluginCard
            v-for="p in s.items"
            :key="p.slug"
            :plugin="p"
            :subs="subs(p)"
            :lang="l"
            :prefix="prefix"
          />
        </div>
        <p v-else class="none-here">{{ t.noneHere }}</p>
      </div>
    </template>

    <div v-if="!matching.length" class="none">
      <p>{{ t.empty }} « {{ query }} ».</p>
      <button type="button" class="chip active" @click="reset">{{ t.reset }}</button>
    </div>
  </section>
</template>

<style scoped>
.marketplace {
  margin: 24px 0 40px;
}

/* Search bar */
.search {
  position: relative;
  display: flex;
  align-items: center;
}

.search input {
  width: 100%;
  height: 52px;
  padding: 0 52px 0 48px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--at-r-lg);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 16px;
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}

.search input::placeholder {
  color: var(--vp-c-text-3);
}

.search input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  box-shadow: 0 0 0 4px var(--vp-c-brand-soft);
}

.search input::-webkit-search-cancel-button {
  display: none;
}

.search-icon {
  position: absolute;
  left: 16px;
  width: 20px;
  height: 20px;
  fill: none;
  stroke: var(--vp-c-text-3);
  stroke-width: 2;
  stroke-linecap: round;
  pointer-events: none;
}

.hint,
.clear {
  position: absolute;
  right: 14px;
}

.hint {
  padding: 1px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--at-r-sm);
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.clear {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 18px;
  line-height: 1;
  color: var(--vp-c-text-2);
  background: var(--vp-c-default-soft);
}

.clear:hover {
  color: var(--vp-c-text-1);
}

/* Categories */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  transition: color 0.2s, border-color 0.2s, background-color 0.2s, opacity 0.2s;
}

.chip:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-brand-1);
}

.chip.active {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.chip.empty:not(.active) {
  opacity: 0.45;
}

.chip .count {
  font-size: 11px;
  color: var(--vp-c-text-3);
}

.chip .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.section {
  margin-top: 36px;
}

.section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.section-count {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  background: var(--vp-c-default-soft);
}

.section-hint {
  margin-left: auto;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.section .grid {
  margin-top: 16px;
}

.section-hint a {
  font-weight: 500;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.section-hint a:hover {
  text-decoration: underline;
}

/* External plugins have more to show: wider cards. */
.grid.ext-grid {
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
  gap: 16px;
}

.none-here {
  margin: 16px 0 0 !important;
  font-size: 14px;
  color: var(--vp-c-text-3);
}

/* Cards */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr));
  gap: 14px;
}

/* Languages show their files: a little wider. */
.grid.lang-grid {
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 290px), 1fr));
}

.none {
  margin-top: 24px;
  padding: 40px 16px;
  border: 1px dashed var(--vp-c-divider);
  border-radius: var(--at-r-lg);
  text-align: center;
  color: var(--vp-c-text-2);
}

.none p {
  margin: 0 0 12px !important;
}
</style>
