<script setup lang="ts">
// The download page: the file for the visitor's system first, then every system, each with its
// file, its kind (installer or launcher) and its size, then what to do after the download, and
// how Atelier updates itself. The version, the date and the sizes come from the latest release
// on GitHub, when the page can reach it; the links work without it.
import { computed, onMounted, ref } from 'vue'
import { useData, withBase } from 'vitepress'
import Terminal from './components/Terminal.vue'
import { base, detectOs, files, latestRelease, names, repo, systems, type Os, type Release } from './downloads'

const { lang } = useData()
const fr = computed(() => lang.value.startsWith('fr'))
const prefix = computed(() => (fr.value ? '/fr' : ''))

const t = computed(() =>
  fr.value
    ? {
        title: 'Télécharger Atelier',
        lead: 'Un IDE de bureau moderne et rapide, écrit en Rust, pour Windows, macOS et Linux.',
        download: 'Télécharger pour',
        latest: 'Dernière version',
        released: 'publiée le',
        changelog: 'Nouveautés',
        all: 'Toutes les versions',
        systems: 'Tous les systèmes',
        installer: 'Installateur',
        launcher: 'Lanceur',
        installerText: 'Pour votre utilisateur, sans droits administrateur. L’IDE est dedans.',
        launcherText: 'Un seul fichier : il télécharge l’IDE à côté de lui au premier lancement.',
        yours: 'Votre système',
        after: 'Après le téléchargement',
        smartscreen: 'L’installateur n’est pas encore signé : si Windows affiche « Windows a protégé votre PC », cliquez sur **Informations complémentaires › Exécuter quand même**. Il ajoute Atelier au menu Démarrer et la commande `atelier` au PATH.',
        mac: 'Un fichier téléchargé par le navigateur est mis en quarantaine : retirez-la et rendez le lanceur exécutable, depuis un dossier à part.',
        linux: 'Rendez le lanceur exécutable, depuis un dossier à part : il ajoute la commande `atelier` dans `~/.local/bin`.',
        updates: 'Mises à jour',
        updatesText: 'Rien à refaire : à chaque démarrage, le lanceur demande la dernière version à GitHub, la télécharge, la vérifie avec `SHA256SUMS` et remplace l’IDE d’un bloc. Sans réseau, il démarre la version installée.',
        guide: 'Le guide d’installation',
        plugins: 'Ensuite, les plugins',
        pluginsText: 'Git, Cargo, Maven, Kubernetes… sont déjà dedans. Les autres s’installent depuis l’IDE.',
        catalog: 'Le catalogue',
        source: 'Compiler depuis les sources',
      }
    : {
        title: 'Download Atelier',
        lead: 'A fast, modern desktop IDE written in Rust, for Windows, macOS and Linux.',
        download: 'Download for',
        latest: 'Latest version',
        released: 'released on',
        changelog: 'What’s new',
        all: 'All releases',
        systems: 'Every system',
        installer: 'Installer',
        launcher: 'Launcher',
        installerText: 'For your user, without admin rights. The IDE is inside.',
        launcherText: 'One file: it downloads the IDE next to it on its first start.',
        yours: 'Your system',
        after: 'After the download',
        smartscreen: 'The installer is not signed yet: if Windows shows “Windows protected your PC”, click **More info › Run anyway**. It adds Atelier to the Start menu and the `atelier` command to the PATH.',
        mac: 'A file downloaded by the browser is quarantined: lift it and make the launcher executable, from a folder of its own.',
        linux: 'Make the launcher executable, from a folder of its own: it adds the `atelier` command to `~/.local/bin`.',
        updates: 'Updates',
        updatesText: 'Nothing to do again: on every start, the launcher asks GitHub for the latest version, downloads it, checks it with `SHA256SUMS` and replaces the IDE at once. Without network, it starts the installed version.',
        guide: 'The install guide',
        plugins: 'Then, the plugins',
        pluginsText: 'Git, Cargo, Maven, Kubernetes… are already inside. The others install from the IDE.',
        catalog: 'The catalog',
        source: 'Build from source',
      },
)

const os = ref<Os>('windows')
const release = ref<Release>()

onMounted(async () => {
  os.value = await detectOs()
  release.value = await latestRelease()
})

const md = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

const size = (o: Os) => {
  const bytes = release.value?.sizes[files[o]]
  return bytes ? `${(bytes / 1024 / 1024).toFixed(1)} ${fr.value ? 'Mo' : 'MB'}` : ''
}

const date = computed(() => {
  if (!release.value?.date) return ''
  return new Date(release.value.date).toLocaleDateString(fr.value ? 'fr-FR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const kind = (o: Os) => (o === 'windows' ? t.value.installer : t.value.launcher)
const kindText = (o: Os) => (o === 'windows' ? t.value.installerText : t.value.launcherText)

const macLines = computed(() => [
  `$ xattr -d com.apple.quarantine ${files[os.value === 'mac-intel' ? 'mac-intel' : 'mac-arm']}`,
  `$ chmod +x ${files[os.value === 'mac-intel' ? 'mac-intel' : 'mac-arm']}`,
  `$ ./${files[os.value === 'mac-intel' ? 'mac-intel' : 'mac-arm']}`,
])
const linuxLines = computed(() => [`$ chmod +x ${files.linux}`, `$ ./${files.linux}`])

const link = (path: string) => withBase(`${prefix.value}${path}`)
</script>

<template>
  <div class="dl">
    <section class="hero">
      <img class="logo" :src="withBase('/logo.svg')" alt="" />
      <h1>{{ t.title }}</h1>
      <p class="lead">{{ t.lead }}</p>

      <a class="primary" :href="base + files[os]">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-5-5m5 5 5-5M5 21h14" /></svg>
        {{ t.download }} {{ names[os] }}
      </a>

      <p class="meta">
        <template v-if="release">
          <span class="tag">{{ release.tag }}</span>
          <span v-if="date">{{ t.released }} {{ date }}</span>
          <span class="dot">·</span>
        </template>
        <a :href="link('/changelog')">{{ t.changelog }}</a>
        <span class="dot">·</span>
        <a :href="`https://github.com/${repo}/releases`" target="_blank" rel="noreferrer">{{ t.all }}</a>
      </p>
    </section>

    <h2 id="systems">{{ t.systems }}</h2>
    <div class="systems">
      <div v-for="o in systems" :key="o" class="system" :class="{ yours: o === os }">
        <div class="sys-head">
          <span class="sys-icon" aria-hidden="true">
            <svg v-if="o === 'windows'" viewBox="0 0 24 24"><path d="M3 5.5 10.5 4.4v7.1H3zm8.5-1.2L21 3v8.5h-9.5zM3 12.5h7.5v7.1L3 18.5zm8.5 0H21V21l-9.5-1.3z" /></svg>
            <svg v-else-if="o === 'linux'" viewBox="0 0 24 24" class="stroke"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3M12 15h5" /></svg>
            <svg v-else viewBox="0 0 24 24" class="stroke"><path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z" /></svg>
          </span>
          <div class="sys-name">
            <span class="name">{{ names[o] }}</span>
            <span class="kind">{{ kind(o) }}<template v-if="size(o)"> · {{ size(o) }}</template></span>
          </div>
          <span v-if="o === os" class="yours-badge">{{ t.yours }}</span>
        </div>
        <code class="file">{{ files[o] }}</code>
        <p class="sys-text">{{ kindText(o) }}</p>
        <a class="get" :href="base + files[o]">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-5-5m5 5 5-5M5 21h14" /></svg>
          {{ files[o].endsWith('.exe') ? '.exe' : names[o].split(' ')[0] }}
        </a>
      </div>
    </div>

    <h2 id="after">{{ t.after }}</h2>
    <div class="after">
      <div class="step">
        <span class="step-title">Windows</span>
        <p v-html="md(t.smartscreen)" />
      </div>
      <div class="step">
        <span class="step-title">macOS</span>
        <p>{{ t.mac }}</p>
        <Terminal title="macOS" :lines="macLines" />
      </div>
      <div class="step">
        <span class="step-title">Linux</span>
        <p v-html="md(t.linux)" />
        <Terminal title="Linux" :lines="linuxLines" />
      </div>
    </div>

    <div class="cards">
      <div class="card">
        <span class="card-title">{{ t.updates }}</span>
        <p v-html="md(t.updatesText)" />
        <a :href="link('/guide/getting-started')">{{ t.guide }} →</a>
      </div>
      <div class="card">
        <span class="card-title">{{ t.plugins }}</span>
        <p>{{ t.pluginsText }}</p>
        <a :href="link('/plugins/')">{{ t.catalog }} →</a>
      </div>
      <div class="card">
        <span class="card-title">{{ t.source }}</span>
        <p><code>cargo build --release</code></p>
        <a :href="link(`/guide/getting-started${fr ? '#compiler-depuis-les-sources' : '#build-from-source'}`)">{{ t.guide }} →</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dl {
  max-width: 920px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

/* Hero */
.hero {
  position: relative;
  padding: 44px 24px 36px;
  border: 1px solid var(--at-separator);
  border-radius: var(--at-r-lg);
  background:
    radial-gradient(ellipse at 50% -20%, color-mix(in srgb, var(--at-accent) 18%, transparent), transparent 60%),
    var(--vp-c-bg-soft);
  text-align: center;
}

.logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
}

.hero h1 {
  margin: 0;
  font-size: 34px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1);
}

.lead {
  margin: 10px auto 26px;
  max-width: 520px;
  font-size: 17px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

.primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 22px;
  border-radius: var(--at-r);
  font-size: 16px;
  font-weight: 600;
  color: #fff !important;
  text-decoration: none !important;
  background: var(--at-accent);
  box-shadow: 0 8px 24px -10px var(--at-accent);
  transition: background-color 0.15s;
}

.primary:hover {
  background: var(--at-accent-hover);
}

.primary svg,
.get svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 6px 8px;
  margin: 18px 0 0;
  font-size: 13.5px;
  color: var(--vp-c-text-3);
}

.meta a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.meta a:hover {
  text-decoration: underline;
}

.tag {
  padding: 1px 8px;
  border-radius: var(--at-r-sm);
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  color: var(--vp-c-text-1);
  background: var(--at-hover);
}

h2 {
  margin: 48px 0 16px;
  padding-top: 0;
  border: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

/* Systems */
.systems {
  padding-top: 10px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
  gap: 12px;
}

.system {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border: 1px solid var(--at-separator);
  border-radius: var(--at-r-md);
  background: var(--vp-c-bg-soft);
}

.system.yours {
  border-color: var(--at-accent);
  box-shadow: 0 0 0 1px var(--at-accent);
}

.sys-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sys-icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: var(--at-r);
  color: var(--vp-c-text-1);
  background: var(--at-hover);
}

.sys-icon svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.sys-icon svg.stroke {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sys-name {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.name {
  font-weight: 600;
  font-size: 14.5px;
  color: var(--vp-c-text-1);
}

.kind {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

/* On the border of the card, above it. */
.yours-badge {
  position: absolute;
  top: -10px;
  right: 12px;
  padding: 1px 8px;
  border-radius: var(--at-r-sm);
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: var(--at-accent);
  white-space: nowrap;
}

.file {
  align-self: flex-start;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px !important;
}

.sys-text {
  flex: 1;
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

.get {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--at-border);
  border-radius: var(--at-r-sm);
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-1) !important;
  text-decoration: none !important;
  background: var(--at-island);
}

.get svg {
  width: 15px;
  height: 15px;
}

.get:hover {
  border-color: var(--at-accent);
  color: var(--vp-c-brand-1) !important;
}

.system.yours .get {
  border-color: transparent;
  color: #fff !important;
  background: var(--at-accent);
}

/* After the download */
.after {
  display: grid;
  gap: 12px;
}

.step {
  padding: 16px 18px 4px;
  border: 1px solid var(--at-separator);
  border-radius: var(--at-r-md);
  background: var(--vp-c-bg-soft);
}

.step-title,
.card-title {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.step p,
.card p {
  margin: 6px 0 12px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.step :deep(.terminal) {
  margin: 0 0 14px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
  gap: 12px;
  margin-top: 32px;
}

.card {
  display: flex;
  flex-direction: column;
  padding: 16px 18px;
  border-radius: var(--at-r-md);
  background: var(--at-hover);
}

.card p {
  flex: 1;
}

.card a {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.card a:hover {
  text-decoration: underline;
}

code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.9em;
  padding: 1px 5px;
  border-radius: var(--at-r-sm);
  background: var(--vp-code-bg);
}
</style>
