<script setup lang="ts">
// The files of a folder, each with what it is for: `files` as paths from the folder (`src/lib.rs`,
// a folder ends with `/`), shown as a tree, with a dot of the color of its kind.
import { computed } from 'vue'
import { inline } from './inline'

const props = defineProps<{ root: string; files: { path: string; desc?: string }[] }>()

const colors: Record<string, string> = {
  rs: '#f97316',
  toml: '#9ca3af',
  json: '#eab308',
  md: '#38bdf8',
  yml: '#ef4444',
  svg: '#ec4899',
  dir: 'var(--at-accent)',
}

const rows = computed(() =>
  props.files.map((f) => {
    const isDir = f.path.endsWith('/')
    const parts = f.path.replace(/\/$/, '').split('/')
    const name = parts.pop()!
    const ext = isDir ? 'dir' : (name.split('.').pop() ?? '')
    return {
      dir: parts.length ? parts.join('/') + '/' : '',
      name: isDir ? name + '/' : name,
      isDir,
      color: colors[ext] ?? '#9ca3af',
      desc: f.desc ? inline(f.desc) : '',
    }
  }),
)
</script>

<template>
  <div class="tree">
    <div class="root">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h5l2 2.5h8A1.5 1.5 0 0 1 21 9v8.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" /></svg>
      {{ root }}
    </div>
    <ul>
      <li v-for="r in rows" :key="r.dir + r.name">
        <span class="file">
          <span class="dot" :class="{ folder: r.isDir }" :style="{ background: r.color }" />
          <span class="path"><span class="dir">{{ r.dir }}</span>{{ r.name }}</span>
        </span>
        <span class="desc" v-html="r.desc" />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.tree {
  margin: 20px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--at-r-md);
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}

.root {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-alt);
}

.root svg {
  width: 16px;
  height: 16px;
  fill: var(--at-accent);
}

/* One column for the paths, as wide as the longest, shared by every row. */
ul {
  display: grid;
  grid-template-columns: max-content 1fr;
  list-style: none;
  margin: 0 !important;
  padding: 6px 0 !important;
}

li {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  gap: 16px;
  align-items: baseline;
  margin: 0 !important;
  padding: 7px 16px 7px 28px;
  position: relative;
}

/* The branch of the tree. */
li::before {
  content: '';
  position: absolute;
  left: 18px;
  top: 0;
  bottom: 0;
  border-left: 1px solid var(--vp-c-divider);
}

li:last-child::before {
  bottom: 50%;
}

li + li {
  border-top: 1px solid color-mix(in srgb, var(--vp-c-divider) 50%, transparent);
}

li:hover {
  background: var(--vp-c-default-soft);
}

.file {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.folder {
  border-radius: 2px;
}

.path {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: var(--vp-c-text-1);
  white-space: nowrap;
}

.dir {
  color: var(--vp-c-text-3);
}

.desc {
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--vp-c-text-2);
}

@media (max-width: 640px) {
  ul {
    grid-template-columns: 1fr;
  }

  li {
    gap: 2px;
  }

  .path {
    white-space: normal;
    overflow-wrap: anywhere;
  }
}
</style>
