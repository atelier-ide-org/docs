<script setup lang="ts">
// A command: its usage, highlighted (the program, the command, the <values> and the [optional]
// parts), what it does, and its options. The texts take a little Markdown (see inline.ts).
import { computed } from 'vue'
import { inline } from './inline'

const props = defineProps<{
  usage: string
  summary?: string
  options?: { flag: string; text: string }[]
}>()

type Token = { text: string; kind: 'program' | 'verb' | 'value' | 'optional' | 'plain' }

const tokens = computed<Token[]>(() => {
  const out: Token[] = []
  // The program and the words of the command, then the arguments.
  const words = props.usage.split(' ')
  let i = 0
  out.push({ text: words[i++], kind: 'program' })
  while (i < words.length && /^[a-z-]+$/.test(words[i])) out.push({ text: words[i++], kind: 'verb' })
  for (const part of words.slice(i).join(' ').split(/(\[[^\]]*\]|<[^>]+>(?:\.\.\.)?)/)) {
    const text = part.trim()
    if (!text) continue
    out.push({ text, kind: text.startsWith('[') ? 'optional' : text.startsWith('<') ? 'value' : 'plain' })
  }
  return out
})

const summary = computed(() => (props.summary ? inline(props.summary) : ''))
const options = computed(() => (props.options ?? []).map((o) => ({ flag: o.flag, text: inline(o.text) })))
</script>

<template>
  <div class="command">
    <div class="usage">
      <span class="sigil">$</span>
      <code class="tokens"><span v-for="(t, i) in tokens" :key="i" :class="t.kind">{{ t.text }}</span></code>
    </div>
    <p v-if="summary" class="summary" v-html="summary" />
    <dl v-if="options.length" class="options">
      <template v-for="o in options" :key="o.flag">
        <dt><code>{{ o.flag }}</code></dt>
        <dd v-html="o.text" />
      </template>
    </dl>
  </div>
</template>

<style scoped>
.command {
  margin: 20px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--at-r-md);
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}

.usage {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 14px 16px;
  background: var(--vp-c-bg-alt);
  border-bottom: 1px solid var(--vp-c-divider);
}

/* The parts wrap as a whole when the line is too long, never in the middle of one. */
.usage .tokens {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 8px;
  padding: 0 !important;
  background: none !important;
  font-size: 14px !important;
  line-height: 1.6;
  color: var(--vp-c-text-2) !important;
}

.tokens span {
  white-space: nowrap;
}

.sigil {
  font-family: var(--vp-font-family-mono);
  font-weight: 700;
  color: var(--vp-c-text-3);
}

.program {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.verb {
  color: var(--vp-c-text-1);
  font-weight: 700;
}

.value {
  color: var(--at-syn-key);
}

.optional {
  color: var(--vp-c-text-3);
}

.summary {
  margin: 0 !important;
  padding: 14px 16px 0;
  font-size: 14.5px;
  line-height: 1.65;
  color: var(--vp-c-text-2);
}

.summary:last-child {
  padding-bottom: 14px;
}

.options {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 8px 16px;
  margin: 0 !important;
  padding: 14px 16px 16px;
}

.options dt {
  margin: 0;
}

.options dt code {
  font-size: 12.5px !important;
  color: var(--vp-c-brand-1) !important;
  background: var(--vp-c-brand-soft) !important;
}

.options dd {
  margin: 0 !important;
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

@media (max-width: 640px) {
  .options {
    grid-template-columns: 1fr;
    gap: 2px;
  }

  .options dd {
    margin-bottom: 8px !important;
  }
}
</style>
