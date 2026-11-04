<script setup lang="ts">
// Error messages and what to do about each: the message as printed, then the fix (with a little
// Markdown, see inline.ts).
import { computed } from 'vue'
import { inline } from './inline'

const props = defineProps<{ items: { message: string; fix: string }[] }>()
const rows = computed(() => props.items.map((i) => ({ message: i.message, fix: inline(i.fix) })))
</script>

<template>
  <div class="trouble">
    <div v-for="r in rows" :key="r.message" class="row">
      <div class="message">
        <span class="badge">error</span>
        <code>{{ r.message }}</code>
      </div>
      <div class="fix">
        <span class="arrow">→</span>
        <span v-html="r.fix" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.trouble {
  display: grid;
  gap: 10px;
  margin: 20px 0;
}

.row {
  border: 1px solid var(--vp-c-divider);
  border-left: 3px solid var(--vp-c-danger-1);
  border-radius: var(--at-r-md);
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}

.message {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 10px 14px;
  background: var(--vp-c-danger-soft);
  overflow-x: auto;
}

.badge {
  flex: none;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--vp-c-danger-1);
}

.message code {
  padding: 0 !important;
  background: none !important;
  white-space: pre;
  font-size: 13px !important;
  color: var(--vp-c-text-1) !important;
}

.fix {
  display: flex;
  gap: 10px;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.arrow {
  color: var(--vp-c-green-1);
  font-weight: 700;
}
</style>
