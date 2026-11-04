<script setup lang="ts">
// The end of the page of a built-in plugin or a language, made from its card: how it is on in a
// project (by default, or automatic), how to turn it on or off in the IDE, and the same in
// `.atelier/config.json`, with its key. Nothing on the page of an external plugin (see
// PluginInstall.vue).
import { computed } from 'vue'
import Steps from './components/Steps.vue'
import { inline } from './components/inline'
import { usePlugin } from './usePlugin'

const { plugin: p, parent, l } = usePlugin()
const isLanguage = computed(() => p.value?.category === 'languages')
const auto = computed(() => p.value?.activation === 'auto')

const t = computed(() => {
  const name = p.value?.name[l.value] ?? ''
  const files = (p.value?.files ?? []).map((e) => `\`.${e}\``)
  const someFiles = files.slice(0, 3).join(', ') + (files.length > 3 ? '…' : '')
  const parentName = parent.value?.name[l.value] ?? ''
  return l.value === 'fr'
    ? {
        title: 'Activation',
        how: auto.value
          ? isLanguage.value
            ? `**Automatique** : ${name} est activé tant que le projet contient un de ses fichiers (${someFiles}), désactivé sinon.`
            : `**Automatique** : ${name} est activé tant que le projet a un \`.git\` (un dossier, ou le fichier d’un worktree ou d’un sous-module), et s’active donc de lui-même après un \`git init\`.`
          : `**Activé par défaut** : compilé dans l’IDE, ${name} fonctionne dans tous les projets jusqu’à ce que vous le désactiviez. Sans rien à faire dans le projet, il masque ses fenêtres et ses commandes.`,
        partOf: parentName ? `Il fait partie de **${parentName}** : il ne fonctionne que tant que ${parentName} est activé, et se désactive à part.` : '',
        ide: 'Dans l’IDE',
        steps: [
          { title: isLanguage.value ? 'Ouvrez **Plugins**, puis l’onglet **Langages**' : 'Ouvrez **Plugins**' },
          { title: `Activez ou désactivez **${name}**`, text: auto.value ? 'L’activer ou le désactiver à la main en décide pour le projet : il n’est plus automatique.' : 'Le choix vaut pour le projet ouvert.' },
        ],
        project: 'Dans le projet',
        projectText: 'Le choix est écrit dans `.atelier/config.json`, et se partage avec le projet :',
        values: [
          { v: 'true', text: 'activé' },
          { v: 'false', text: 'désactivé' },
          ...(auto.value ? [{ v: '"auto"', text: 'laissé à l’IDE (par défaut)' }] : []),
        ],
      }
    : {
        title: 'Activation',
        how: auto.value
          ? isLanguage.value
            ? `**Automatic**: ${name} is on while the project has one of its files (${someFiles}), off otherwise.`
            : `**Automatic**: ${name} is on while the project has a \`.git\` (a folder, or the file of a worktree or a submodule), so it comes on by itself after a \`git init\`.`
          : `**On by default**: compiled into the IDE, ${name} works in every project until you turn it off. With nothing to do in the project, it hides its windows and its commands.`,
        partOf: parentName ? `It is part of **${parentName}**: it runs only while ${parentName} is on, and is turned off by itself.` : '',
        ide: 'In the IDE',
        steps: [
          { title: isLanguage.value ? 'Open **Plugins**, then the **Languages** tab' : 'Open **Plugins**' },
          { title: `Turn **${name}** on or off`, text: auto.value ? 'Turning it on or off by hand decides for the project: it is no longer automatic.' : 'The choice is for the open project.' },
        ],
        project: 'In the project',
        projectText: 'The choice is written in `.atelier/config.json`, and is shared with the project:',
        values: [
          { v: 'true', text: 'on' },
          { v: 'false', text: 'off' },
          ...(auto.value ? [{ v: '"auto"', text: 'left to the IDE (the default)' }] : []),
        ],
      }
})

// The value shown in the example: what a project writes to change it.
const example = computed(() => (auto.value ? '"auto"' : 'false'))
</script>

<template>
  <section v-if="p && !p.external" class="activation">
    <h2 id="activation" tabindex="-1">
      {{ t.title }}
      <a class="header-anchor" href="#activation" aria-hidden="true">&#8203;</a>
    </h2>

    <div class="how" :class="{ auto }">
      <span class="icon" aria-hidden="true">
        <svg v-if="auto" viewBox="0 0 16 16"><path d="M9 1 3 9h4l-1 6 6-8H8z" /></svg>
        <svg v-else viewBox="0 0 16 16"><path d="M3 8.5 6.5 12 13 4.5" /></svg>
      </span>
      <div>
        <p v-html="inline(t.how)" />
        <p v-if="t.partOf" class="part" v-html="inline(t.partOf)" />
      </div>
    </div>

    <div class="ways">
      <div class="way">
        <span class="way-title">{{ t.ide }}</span>
        <Steps :steps="t.steps" />
      </div>

      <div class="way">
        <span class="way-title">{{ t.project }}</span>
        <p class="way-text" v-html="inline(t.projectText)" />
        <div class="json">
          <div class="json-bar">.atelier/config.json</div>
          <pre><span class="p">{</span>
  <span class="k">"plugins"</span><span class="p">: {</span>
    <span class="k">"builtin"</span><span class="p">: {</span> <span class="k">"{{ p.slug }}"</span><span class="p">:</span> <span class="v">{{ example }}</span> <span class="p">}</span>
  <span class="p">}</span>
<span class="p">}</span></pre>
        </div>
        <ul class="values">
          <li v-for="v in t.values" :key="v.v"><code>{{ v.v }}</code> {{ v.text }}</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.activation {
  margin-top: 40px;
}

.how {
  display: flex;
  gap: 14px;
  margin: 18px 0;
  padding: 14px 16px;
  border-radius: var(--at-r-md);
  border: 1px solid color-mix(in srgb, var(--vp-c-green-1) 35%, var(--vp-c-divider));
  background: var(--vp-c-green-soft);
}

.how.auto {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 35%, var(--vp-c-divider));
  background: var(--vp-c-brand-soft);
}

.icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: #fff;
  background: var(--vp-c-green-1);
}

.how.auto .icon {
  background: var(--vp-c-brand-1);
}

.icon svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.how.auto .icon svg {
  fill: currentColor;
  stroke: none;
}

.how p {
  margin: 3px 0 0 !important;
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--vp-c-text-1);
}

.how p.part {
  margin-top: 6px !important;
  color: var(--vp-c-text-2);
}

.ways {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.way {
  padding: 18px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--at-r-lg);
  background: var(--vp-c-bg-soft);
}

.way-title {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.way :deep(.steps) {
  margin: 16px 0 0 !important;
}

.way :deep(.steps li:last-child) {
  padding-bottom: 0;
}

.way-text {
  margin: 10px 0 12px !important;
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.json {
  border-radius: var(--at-r-md);
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-code-block-bg);
}

.json-bar {
  padding: 6px 12px;
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  color: var(--vp-c-text-3);
  border-bottom: 1px solid var(--vp-c-divider);
}

.json pre {
  margin: 0;
  padding: 12px 14px;
  overflow-x: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  background: transparent;
}

.p {
  color: var(--vp-c-text-2);
}

.k {
  color: var(--at-syn-key);
}

.v {
  color: var(--at-syn-keyword);
  font-weight: 600;
}

.values {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin: 12px 0 0 !important;
  padding: 0 !important;
  list-style: none;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.values li {
  margin: 0 !important;
}

.values code {
  font-size: 12px !important;
}

@media (max-width: 760px) {
  .ways {
    grid-template-columns: 1fr;
  }
}
</style>
