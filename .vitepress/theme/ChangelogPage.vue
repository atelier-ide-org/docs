<script setup lang="ts">
// The changelog page: every version of Atelier on a line, newest first, from CHANGELOG.md in the
// code of the IDE (changelog.data.ts). Each version has its date and its changes by kind (breaking
// changes, features, fixes), each a title and its text; chips filter by kind. The headings of the
// versions are those of "On this page".
import { computed, ref } from 'vue'
import { useData, withBase } from 'vitepress'
import { data as versions } from './changelog.data'

const { lang } = useData()
const fr = computed(() => lang.value.startsWith('fr'))

const t = computed(() =>
  fr.value
    ? {
        title: 'Changelog',
        lead: 'Toutes les versions d’Atelier, la plus récente en premier. L’IDE se met à jour tout seul au démarrage.',
        latest: 'Dernière',
        download: 'Télécharger',
        all: 'Tout',
        kinds: { breaking: 'Changements majeurs', features: 'Nouveautés', fixes: 'Corrections', other: 'Autres' } as Record<string, string>,
        none: 'Aucun changement de ce type dans cette version.',
        changes: (n: number) => `${n} changement${n > 1 ? 's' : ''}`,
      }
    : {
        title: 'Changelog',
        lead: 'Every version of Atelier, newest first. The IDE updates itself when it starts. The entries are written in French.',
        latest: 'Latest',
        download: 'Download',
        all: 'All',
        kinds: { breaking: 'Breaking changes', features: 'Features', fixes: 'Fixes', other: 'Other' } as Record<string, string>,
        none: 'No change of this kind in this version.',
        changes: (n: number) => `${n} change${n > 1 ? 's' : ''}`,
      },
)

const kinds = computed(() => {
  const seen = new Set<string>()
  for (const v of versions) for (const s of v.sections) seen.add(s.kind)
  return ['breaking', 'features', 'fixes', 'other'].filter((k) => seen.has(k))
})

const filter = ref<string | null>(null)

const shown = computed(() =>
  versions.map((v) => ({
    ...v,
    id: `v${v.version.replace(/\./g, '-')}`,
    count: v.sections.reduce((n, s) => n + s.changes.length, 0),
    sections: v.sections.filter((s) => !filter.value || s.kind === filter.value),
  })),
)

const date = (d: string) => {
  const parsed = new Date(d)
  return isNaN(parsed.getTime())
    ? d
    : parsed.toLocaleDateString(fr.value ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="changelog">
    <header class="head">
      <h1>{{ t.title }}</h1>
      <p class="lead">{{ t.lead }}</p>
      <div class="chips" role="toolbar">
        <button type="button" class="chip" :class="{ active: !filter }" @click="filter = null">{{ t.all }}</button>
        <button
          v-for="k in kinds"
          :key="k"
          type="button"
          class="chip"
          :class="[k, { active: filter === k }]"
          @click="filter = filter === k ? null : k"
        >
          <span class="dot" />{{ t.kinds[k] }}
        </button>
      </div>
    </header>

    <ol class="timeline">
      <li v-for="(v, i) in shown" :key="v.version" class="version">
        <div class="rail" aria-hidden="true"><span class="node" :class="{ first: i === 0 }" /></div>
        <div class="body">
          <div class="v-head">
            <h2 :id="v.id" tabindex="-1">
              {{ v.version }}
              <a class="header-anchor" :href="`#${v.id}`" aria-hidden="true">&#8203;</a>
            </h2>
            <span v-if="i === 0" class="latest">{{ t.latest }}</span>
            <span class="date">{{ date(v.date) }}</span>
            <span class="count">{{ t.changes(v.count) }}</span>
            <a v-if="i === 0" class="download" :href="withBase(fr ? '/fr/download' : '/download')">{{ t.download }} →</a>
          </div>

          <div v-for="s in v.sections" :key="s.label" class="section">
            <span class="kind" :class="s.kind"><span class="dot" />{{ t.kinds[s.kind] ?? s.label }}</span>
            <article v-for="c in s.changes" :key="c.title" class="change">
              <h3>{{ c.title }}</h3>
              <div class="vp-doc text" v-html="c.html" />
            </article>
          </div>
          <p v-if="!v.sections.length" class="none">{{ t.none }}</p>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.head h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.lead {
  margin: 8px 0 18px !important;
  font-size: 16px;
  color: var(--vp-c-text-2);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border: 1px solid var(--at-border);
  border-radius: var(--at-r-sm);
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background: var(--at-island);
}

.chip:hover {
  color: var(--vp-c-text-1);
}

.chip.active {
  color: var(--vp-c-text-1);
  border-color: var(--at-accent);
  background: var(--at-selection);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-text-3);
}

.breaking .dot {
  background: var(--vp-c-danger-1);
}

.features .dot {
  background: var(--vp-c-green-1);
}

.fixes .dot {
  background: var(--vp-c-brand-1);
}

/* The line of the versions. */
.timeline {
  list-style: none;
  margin: 36px 0 0 !important;
  padding: 0 !important;
}

.version {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 16px;
  margin: 0 !important;
}

.rail {
  position: relative;
  display: flex;
  justify-content: center;
}

.rail::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--at-separator);
}

.version:last-child .rail::before {
  bottom: auto;
  height: 22px;
}

.node {
  position: relative;
  margin-top: 14px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--at-border);
  background: var(--at-island);
}

.node.first {
  border-color: var(--at-accent);
  background: var(--at-accent);
  box-shadow: 0 0 0 4px var(--vp-c-brand-soft);
}

.body {
  padding-bottom: 40px;
  min-width: 0;
}

.v-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 12px;
  margin-bottom: 14px;
}

.v-head h2 {
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  font-family: var(--vp-font-family-mono);
  font-size: 22px !important;
  font-weight: 600;
  line-height: 1.6 !important;
}

.latest {
  padding: 1px 8px;
  border-radius: var(--at-r-sm);
  font-size: 11.5px;
  font-weight: 600;
  color: #fff;
  background: var(--at-accent);
}

.date,
.count {
  font-size: 13.5px;
  color: var(--vp-c-text-3);
}

.count::before {
  content: '·';
  margin-right: 12px;
}

.download {
  margin-left: auto;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.download:hover {
  text-decoration: underline;
}

.section {
  margin-top: 12px;
}

.kind {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 8px;
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-2);
}

.change {
  margin-bottom: 10px;
  padding: 16px 18px;
  border: 1px solid var(--at-separator);
  border-radius: var(--at-r-md);
  background: var(--vp-c-bg-soft);
}

.change h3 {
  margin: 0 0 8px !important;
  padding: 0 !important;
  font-size: 16px !important;
  font-weight: 600;
  line-height: 1.4 !important;
  color: var(--vp-c-text-1);
}

.text {
  font-size: 14.5px;
}

.text :deep(p) {
  margin: 8px 0 !important;
  line-height: 1.65;
}

.text :deep(p:first-child) {
  margin-top: 0 !important;
}

.text :deep(p:last-child) {
  margin-bottom: 0 !important;
}

.none {
  font-size: 14px;
  color: var(--vp-c-text-3);
}

@media (max-width: 640px) {
  .version {
    grid-template-columns: 14px 1fr;
    gap: 10px;
  }

  .download {
    margin-left: 0;
  }
}
</style>
