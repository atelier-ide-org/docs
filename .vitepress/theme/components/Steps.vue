<script setup lang="ts">
// Numbered steps on a line, each with a title and a text (with a little Markdown, see inline.ts).
import { computed } from 'vue'
import { inline } from './inline'

const props = defineProps<{ steps: { title: string; text?: string }[] }>()
const items = computed(() =>
  props.steps.map((s) => ({ title: inline(s.title), text: s.text ? inline(s.text) : '' })),
)
</script>

<template>
  <ol class="steps">
    <li v-for="(s, i) in items" :key="i">
      <span class="num">{{ i + 1 }}</span>
      <div class="body">
        <div class="title" v-html="s.title" />
        <p v-if="s.text" class="text" v-html="s.text" />
      </div>
    </li>
  </ol>
</template>

<style scoped>
.steps {
  list-style: none;
  margin: 24px 0 !important;
  padding: 0 !important;
}

.steps li {
  position: relative;
  display: flex;
  gap: 16px;
  margin: 0 !important;
  padding-bottom: 22px;
}

/* The line between the numbers. */
.steps li:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 34px;
  bottom: 2px;
  width: 2px;
  border-radius: 2px;
  background: var(--at-separator);
}

.num {
  flex: none;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--at-accent);
  box-shadow: 0 0 0 3px var(--vp-c-bg-soft);
}

.body {
  padding-top: 4px;
  min-width: 0;
}

.title {
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.5;
}

.text {
  margin: 4px 0 0 !important;
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
</style>
