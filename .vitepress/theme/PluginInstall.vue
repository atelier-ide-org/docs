<script setup lang="ts">
// The end of the page of an external plugin, the same for all of them: how to install it (from
// the Marketplace, or from a file), what it can run in, and where its code is. Nothing on the
// page of a built-in plugin.
import { computed } from 'vue'
import { withBase } from 'vitepress'
import Steps from './components/Steps.vue'
import { usePlugin } from './usePlugin'

const { plugin: p, l, prefix } = usePlugin()
const ext = computed(() => p.value?.external)

const t = computed(() => {
  const id = p.value?.slug ?? ''
  const abi = ext.value?.abi ?? 2
  return l.value === 'fr'
    ? {
        title: 'Installation',
        id: 'installation',
        intro: 'Un plugin externe ne fait pas partie de l’IDE : il s’installe une fois, pour tous les projets, puis peut être désactivé dans un projet.',
        marketplace: 'Depuis la Marketplace',
        recommended: 'recommandé',
        steps: [
          { title: 'Ouvrez **Plugins**, puis l’onglet **Marketplace**' },
          { title: `Cliquez sur **Installer** à côté de ${p.value?.name.fr ?? ''}`, text: 'Il est téléchargé, installé et activé. **Mettre à jour** apparaît quand une nouvelle version sort.' },
        ],
        file: 'Depuis un fichier',
        fileText: `Téléchargez \`${id}.atelier-plugin\` dans la release \`plugins/${id}/vX.Y.Z\`, puis dans **Plugins**, cliquez sur **Installer un plugin depuis un fichier** (le bouton +).`,
        compat: 'Compatibilité',
        compatText: `Compilé pour l’interface des plugins **v${abi}** : il se charge dans toutes les versions d’Atelier qui la lisent (depuis Atelier 0.3), sous Windows, Linux et macOS.`,
        trust: 'Un plugin natif s’exécute dans l’IDE avec vos droits : n’installez que des plugins de confiance.',
        source: 'Son code',
        sourceText: 'Il vit dans son propre dépôt, compilé et publié à part avec',
        colon: ' :',
        downloads: 'Téléchargements',
        uninstall: 'Sa page dans **Plugins** a un bouton **Désinstaller**.',
      }
    : {
        title: 'Install',
        id: 'install',
        intro: 'An external plugin is not part of the IDE: it is installed once, for every project, and can then be turned off in a project.',
        marketplace: 'From the Marketplace',
        recommended: 'recommended',
        steps: [
          { title: 'Open **Plugins**, then the **Marketplace** tab' },
          { title: `Click **Install** next to ${p.value?.name.en ?? ''}`, text: 'It is downloaded, installed and turned on. **Update** shows when a new version is out.' },
        ],
        file: 'From a file',
        fileText: `Download \`${id}.atelier-plugin\` from the release \`plugins/${id}/vX.Y.Z\`, then in **Plugins**, click **Install a plugin from a file** (the + button).`,
        compat: 'Compatibility',
        compatText: `Built for the plugin interface **v${abi}**: it loads in every version of Atelier that reads it (since Atelier 0.3), on Windows, Linux and macOS.`,
        trust: 'A native plugin runs inside the IDE with your rights: only install plugins you trust.',
        source: 'Its code',
        sourceText: 'It lives in a repository of its own, built and published apart with',
        colon: ':',
        downloads: 'Downloads',
        uninstall: 'Its page in **Plugins** has an **Uninstall** button.',
      }
})

// The same little Markdown as the components (`code` and **bold**), on texts of this file.
const md = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

const cli = computed(() => withBase(`${prefix.value}/contributing/atelier-cli`))
</script>

<template>
  <section v-if="p && ext" class="install">
    <h2 :id="t.id" tabindex="-1">
      {{ t.title }}
      <a class="header-anchor" :href="`#${t.id}`" aria-hidden="true">&#8203;</a>
    </h2>
    <p>{{ t.intro }}</p>

    <div class="ways">
      <div class="way main">
        <div class="way-head">
          <span class="way-title">{{ t.marketplace }}</span>
          <span class="pill">{{ t.recommended }}</span>
        </div>
        <Steps :steps="t.steps" />
      </div>

      <div class="way">
        <div class="way-head">
          <span class="way-title">{{ t.file }}</span>
        </div>
        <p class="way-text" v-html="md(t.fileText)" />
        <a class="download" :href="ext.releases" target="_blank" rel="noreferrer">
          {{ t.downloads }}
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3h7v7M13 3 4 12" /></svg>
        </a>
      </div>
    </div>

    <div class="notes">
      <div class="note">
        <span class="note-title">{{ t.compat }}</span>
        <p v-html="md(t.compatText)" />
        <p v-html="md(t.uninstall)" />
      </div>
      <div class="note">
        <span class="note-title">{{ t.source }}</span>
        <p>
          {{ t.sourceText }} <a :href="cli">atelier-cli</a>{{ t.colon }}
          <a :href="ext.repo" target="_blank" rel="noreferrer"><code>{{ ext.repo.replace('https://github.com/', '') }}</code></a>
        </p>
      </div>
    </div>

    <p class="trust">{{ t.trust }}</p>
  </section>
</template>

<style scoped>
.install {
  margin-top: 40px;
}

.ways {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 14px;
  margin: 20px 0;
}

.way {
  padding: 18px 18px 4px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--at-r-lg);
  background: var(--vp-c-bg-soft);
}

.way.main {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 45%, var(--vp-c-divider));
  background:
    linear-gradient(var(--vp-c-brand-soft), transparent 70%),
    var(--vp-c-bg-soft);
}

.way-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.way-title {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.pill {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.way :deep(.steps) {
  margin: 16px 0 0 !important;
}

.way-text {
  margin: 12px 0 !important;
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.download {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  padding: 6px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--at-r);
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-1) !important;
  text-decoration: none !important;
  background: var(--vp-c-bg);
}

.download:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1) !important;
}

.download svg {
  width: 11px;
  height: 11px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.notes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.note {
  padding: 14px 16px;
  border-radius: var(--at-r-md);
  background: var(--vp-c-default-soft);
}

.note-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
}

.note p {
  margin: 6px 0 0 !important;
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.trust {
  margin: 16px 0 0 !important;
  padding-left: 12px;
  border-left: 3px solid var(--vp-c-warning-1);
  font-size: 13.5px;
  color: var(--vp-c-text-2);
}

@media (max-width: 760px) {
  .ways,
  .notes {
    grid-template-columns: 1fr;
  }
}
</style>
