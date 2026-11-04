<script setup lang="ts">
// A terminal window: `$ ` starts a command (with its comment after `  # `), `# ` a comment line,
// anything else is output. The button copies the commands only.
import { computed, ref } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{ lines: string[]; title?: string }>()
const { lang } = useData()

type Line = { kind: 'cmd' | 'comment' | 'out'; text: string; note?: string }

const parsed = computed<Line[]>(() =>
  props.lines.map((line) => {
    if (line.startsWith('$ ')) {
      const [cmd, ...note] = line.slice(2).split(/\s{2,}# /)
      return { kind: 'cmd', text: cmd, note: note.join(' # ') || undefined }
    }
    if (line.startsWith('# ')) return { kind: 'comment', text: line.slice(2) }
    return { kind: 'out', text: line }
  }),
)

const copied = ref(false)
async function copy() {
  const commands = parsed.value.filter((l) => l.kind === 'cmd').map((l) => l.text)
  try {
    await navigator.clipboard.writeText(commands.join('\n'))
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  } catch {}
}

const label = computed(() =>
  lang.value.startsWith('fr') ? (copied.value ? 'Copié' : 'Copier') : copied.value ? 'Copied' : 'Copy',
)
</script>

<template>
  <div class="terminal">
    <div class="bar">
      <span class="dots"><i /><i /><i /></span>
      <span class="title">{{ title ?? 'terminal' }}</span>
      <button type="button" class="copy" :class="{ done: copied }" @click="copy">{{ label }}</button>
    </div>
    <pre class="screen"><template v-for="(l, i) in parsed" :key="i"><span v-if="l.kind === 'cmd'" class="line"><span class="prompt">❯</span> <span class="cmd">{{ l.text }}</span><span v-if="l.note" class="note">  # {{ l.note }}</span></span><span v-else-if="l.kind === 'comment'" class="line note"># {{ l.text }}</span><span v-else class="line out">{{ l.text }}</span></template></pre>
  </div>
</template>

<style scoped>
.terminal {
  margin: 20px 0;
  border-radius: var(--at-r-md);
  overflow: hidden;
  border: 1px solid var(--term-border);
  background: var(--term-bg);
  box-shadow: 0 16px 40px -24px rgba(0, 0, 0, 0.55);
  --term-bg: #191a1c;
  --term-bar: #26282c;
  --term-border: #40434a;
  --term-text: #dfe1e5;
  --term-dim: #868a91;
  --term-accent: #548af7;
  --term-ok: #73bd79;
}

.bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  background: var(--term-bar);
  border-bottom: 1px solid var(--term-border);
}

.dots {
  display: inline-flex;
  gap: 6px;
}

.dots i {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #ff5f57;
}

.dots i:nth-child(2) {
  background: #febc2e;
}

.dots i:nth-child(3) {
  background: #28c840;
}

.title {
  flex: 1;
  text-align: center;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--term-dim);
}

.copy {
  padding: 2px 10px;
  border-radius: var(--at-r-sm);
  font-size: 12px;
  color: var(--term-dim);
  border: 1px solid var(--term-border);
  transition: color 0.2s, border-color 0.2s;
}

.copy:hover {
  color: var(--term-text);
  border-color: var(--term-dim);
}

.copy.done {
  color: var(--term-ok);
  border-color: var(--term-ok);
}

.screen {
  margin: 0;
  padding: 16px 18px;
  overflow-x: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--term-text);
  background: transparent;
}

.line {
  display: block;
}

.prompt {
  color: var(--term-accent);
  font-weight: 700;
}

.note {
  color: var(--term-dim);
}

.out {
  color: var(--term-ok);
}
</style>
