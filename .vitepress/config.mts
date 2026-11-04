import { defineConfig, type DefaultTheme } from 'vitepress'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { loadCatalog, repoRoot, type Lang, type Section } from './catalog'

// The documentation of Atelier IDE, in English (root) and French (`/fr/`). Each page exists in
// both languages, at the same path. The pages of the plugins and languages live in the source
// code of the IDE (atelier-ide-org/app), in the `doc` folder of each one (see catalog.ts).

const repo = 'https://github.com/atelier-ide-org/docs'
const catalog = loadCatalog()

/** The pages of the plugins (or languages) that have one, by name: the built-in plugins, or the
 * external ones with `external`. */
function pages(section: Section, prefix: string, external = false): DefaultTheme.SidebarItem[] {
  const lang: Lang = prefix ? 'fr' : 'en'
  // A sub-plugin is external when its parent is.
  const isExternal = (p: (typeof catalog)[number]): boolean =>
    !!p.external || (!!p.parent && isExternal(catalog.find((q) => q.slug === p.parent)!))
  return catalog
    .filter((p) => p.section === section && p.pages[lang] && isExternal(p) === external)
    .map((p) => ({ text: p.name[lang], link: `${prefix}/${section}/${p.slug}` }))
    .sort((a, b) => a.text.localeCompare(b.text, lang))
}

/** "Edit this page" opens the file of the page: in this repository, in the repository of a
 * native plugin (`plugins/<plugin>/…`, cloned into the IDE), or in the code of the IDE. The
 * pattern is sent to the browser on its own: it cannot use `repo`. */
function editLink(text: string): DefaultTheme.EditLink {
  return {
    text,
    pattern: ({ filePath, params }) => {
      const source: string | undefined = params?.source
      if (!source) return `https://github.com/atelier-ide-org/docs/edit/main/${filePath}`
      const plugin = source.match(/^plugins\/([^/]+)\/(.*)$/)
      if (plugin) return `https://github.com/atelier-ide-org/plugin-${plugin[1]}/edit/main/${plugin[2]}`
      return `https://github.com/atelier-ide-org/app/edit/main/${source}`
    },
  }
}

function sidebar(prefix: string, t: Record<string, string>): DefaultTheme.SidebarItem[] {
  return [
    // The catalog first, as a large link (styled by `.sidebar-catalog` in theme/style.css).
    {
      text: `<span class="sidebar-catalog"><span class="title">${t.catalog}</span><span class="hint">${t.catalogHint}</span></span>`,
      link: `${prefix}/plugins/`,
    },
    {
      text: t.guide,
      items: [
        { text: t.install, link: `${prefix}/guide/getting-started` },
        { text: t.interface, link: `${prefix}/guide/interface` },
        { text: t.run, link: `${prefix}/guide/running` },
        { text: t.shortcuts, link: `${prefix}/guide/shortcuts` },
        { text: t.cli, link: `${prefix}/guide/command-line` },
        // Making plugins: the command line, then the interface.
        {
          text: t.development,
          collapsed: false,
          items: [
            { text: 'atelier-cli', link: `${prefix}/contributing/atelier-cli` },
            { text: t.pluginApi, link: `${prefix}/contributing/plugin-api` },
          ],
        },
      ],
    },
    {
      text: t.languages,
      items: [
        ...pages('languages', prefix),
        { text: t.schemas, link: `${prefix}/languages/json` },
        { text: t.format, link: `${prefix}/languages/formatting` },
      ],
    },
    {
      text: 'Plugins',
      collapsed: false,
      items: pages('plugins', prefix),
    },
    // Only when an external plugin has a page.
    ...(pages('plugins', prefix, true).length
      ? [{ text: t.externals, collapsed: false, items: pages('plugins', prefix, true) }]
      : []),
    {
      text: t.ai,
      items: [
        { text: t.mcp, link: `${prefix}/plugins/mcp` },
        { text: t.graph, link: `${prefix}/ai/context-graph` },
        { text: t.commits, link: `${prefix}/ai/commits` },
      ],
    },
    {
      text: t.contributing,
      items: [
        { text: t.development, link: `${prefix}/contributing/development` },
        { text: t.releases, link: `${prefix}/contributing/releases` },
      ],
    },
  ]
}

const en = {
  guide: 'Guide',
  install: 'Installation',
  interface: 'Interface',
  run: 'Running code',
  shortcuts: 'Keyboard shortcuts',
  cli: 'Command line',
  languages: 'Languages',
  format: 'Reformat code',
  schemas: 'JSON & YAML schemas',
  catalog: 'Plugin catalog',
  catalogHint: 'Every plugin and language',
  externals: 'External plugins',
  ai: 'AI',
  mcp: 'MCP server & sessions',
  graph: 'Context graph',
  commits: 'Commits by AI',
  contributing: 'Contributing',
  development: 'Development',
  pluginApi: 'Plugin API',
  releases: 'Versions & releases',
}

const fr = {
  guide: 'Guide',
  install: 'Installation',
  interface: 'Interface',
  run: 'Exécuter du code',
  shortcuts: 'Raccourcis clavier',
  cli: 'Ligne de commande',
  languages: 'Langages',
  format: 'Reformater le code',
  schemas: 'Schémas JSON et YAML',
  catalog: 'Catalogue des plugins',
  catalogHint: 'Tous les plugins et langages',
  externals: 'Plugins externes',
  ai: 'IA',
  mcp: 'Serveur MCP et sessions',
  graph: 'Graphe de contexte',
  commits: 'Commits par l’IA',
  contributing: 'Contribuer',
  development: 'Développement',
  pluginApi: 'API des plugins',
  releases: 'Versions et releases',
}

export default defineConfig({
  title: 'Atelier IDE',
  base: '/docs/',
  // The code of the IDE may be cloned inside this repository (the CI does): its Markdown files
  // are not pages.
  srcExclude: ['app/**', 'README.md'],
  cleanUrls: true,
  lastUpdated: true,
  // The date of a page of a plugin is the one of its file in the plugin, not of the route file.
  transformPageData(page) {
    const source = page.params?.source
    if (!source) return
    // The title of the page of a plugin is its name (the header of an external plugin has no
    // `# Title` in the Markdown to take it from).
    if (page.params?.title) page.title = page.params.title
    try {
      // From the folder of the file: a native plugin is a repository of its own.
      const file = path.join(repoRoot, source)
      const out = execFileSync('git', ['log', '-1', '--format=%at', '--', path.basename(file)], {
        cwd: path.dirname(file),
      })
      const seconds = Number(out.toString().trim())
      if (seconds) page.lastUpdated = seconds * 1000
    } catch {}
  },
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/docs/logo.svg' }]],
  themeConfig: {
    logo: '/logo.svg',
    socialLinks: [{ icon: 'github', link: repo }],
    footer: {
      message: `Released under the <a href="${repo}/blob/main/LICENSE">MIT License</a>.`,
      copyright: 'Copyright © 2026 Thomas Farineau',
    },
    search: {
      provider: 'local',
      options: {
        locales: {
          fr: {
            translations: {
              button: { buttonText: 'Rechercher', buttonAriaLabel: 'Rechercher' },
              modal: {
                noResultsText: 'Aucun résultat pour',
                resetButtonTitle: 'Effacer la recherche',
                footer: { selectText: 'choisir', navigateText: 'naviguer', closeText: 'fermer' },
              },
            },
          },
        },
      },
    },
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      description: 'A fast, modern desktop IDE written in Rust.',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/getting-started', activeMatch: '^/guide/' },
          { text: 'Plugins', link: '/plugins/', activeMatch: '^/(plugins|languages)/' },
          { text: 'Download', link: '/download' },
          { text: 'Changelog', link: '/changelog' },
        ],
        sidebar: sidebar('', en),
        editLink: editLink('Edit this page on GitHub'),
      },
    },
    fr: {
      label: 'Français',
      lang: 'fr',
      link: '/fr/',
      description: 'Un IDE de bureau moderne et rapide, écrit en Rust.',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/fr/guide/getting-started', activeMatch: '^/fr/guide/' },
          { text: 'Plugins', link: '/fr/plugins/', activeMatch: '^/fr/(plugins|languages)/' },
          { text: 'Télécharger', link: '/fr/download' },
          { text: 'Changelog', link: '/fr/changelog' },
        ],
        sidebar: sidebar('/fr', fr),
        editLink: editLink('Modifier cette page sur GitHub'),
        outline: { label: 'Sur cette page' },
        footer: {
          message: `Publié sous <a href="${repo}/blob/main/LICENSE">licence MIT</a>.`,
          copyright: 'Copyright © 2026 Thomas Farineau',
        },
        docFooter: { prev: 'Page précédente', next: 'Page suivante' },
        lastUpdated: { text: 'Mis à jour le' },
        returnToTopLabel: 'Retour en haut',
        sidebarMenuLabel: 'Menu',
        darkModeSwitchLabel: 'Apparence',
        lightModeSwitchTitle: 'Passer au thème clair',
        darkModeSwitchTitle: 'Passer au thème sombre',
        langMenuLabel: 'Changer de langue',
      },
    },
  },
})
