// The plugins of the IDE, read from the `doc` folder of each one in the code of the IDE
// (atelier-ide-org/app), so that the docs follow the code:
//
//   src/plugins/builtins/<plugin>/doc/   (or src/languages/<language>/doc/, or plugins/<plugin>/doc/
//                                         for a native plugin, cloned into the IDE)
//     en-US.md   the page of the plugin, at /plugins/<plugin> (or /languages/<language>)
//     fr-FR.md   its French page, at /fr/plugins/<plugin>
//
// The plugins of `plugins/` are external: installed from the Marketplace of the IDE, they are
// listed apart, with the version and the file extensions of their `plugin.json`.
//
// The front matter of a page is the card of the plugin: `name` and `summary` in each language
// (the IDE shows them in its Plugins page too, see build.rs), and in en-US.md only `category`,
// `icon`, `tags` and `see`. A file with only a front matter is a card without a page; `see` then
// sends the card to the page of another plugin (`git#github`).
//
// A plugin folder inside another one is a sub-plugin (git/github): it has no card of its own and
// is listed in the card of its parent.
//
// Used by the config (sidebar), the routes of the pages and the data of the catalog. Any
// mistake in a card stops the build, with the file at fault.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

/** The root of this repository. */
export const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** The code of the IDE: `ATELIER_APP`, else the IDE this repository is the submodule `docs/` of
 * (`..`), else a clone of atelier-ide-org/app next to it (`../app`). Its native plugins are its
 * submodules `plugins/<name>`. */
const parent = path.join(docsRoot, '..')
export const repoRoot = path.resolve(
  process.env.ATELIER_APP ??
    (fs.existsSync(path.join(parent, 'src/plugins/builtins')) ? parent : path.join(docsRoot, '../app')),
)
if (!fs.existsSync(path.join(repoRoot, 'src/plugins/builtins'))) {
  throw new Error(
    `The code of Atelier is not in ${repoRoot}: clone atelier-ide-org/app there ` +
      'with its submodules (the native plugins), or set ATELIER_APP to its folder.',
  )
}

export type Section = 'plugins' | 'languages'
export type Lang = 'en' | 'fr'

export const categories = ['vcs', 'build', 'viewers', 'data', 'ai', 'tools'] as const
export type Category = (typeof categories)[number] | 'languages'

export interface CatalogPlugin {
  /** The name of its folder, and of its page. */
  slug: string
  section: Section
  /** The slug of the plugin it is part of. */
  parent?: string
  category: Category
  name: Record<Lang, string>
  summary: Record<Lang, string>
  tags: string[]
  /** The SVG of the icon as data URLs, `dark` when the plugin has a dark variant. */
  icon?: { light: string; dark?: string }
  /** Where its page is, from the root of the docs (`plugins/cargo`), with an anchor for `see`. */
  link?: string
  /** The Markdown files of its pages, from the root of the repository. */
  pages: Partial<Record<Lang, string>>
  /** For an external plugin (a submodule `plugins/<plugin>`, installed from the Marketplace):
   * its version and the extensions of its files, from its `plugin.json`, and its repository. */
  external?: {
    version: string
    /** The version of the plugin interface it was built for. */
    abi: number
    extensions: string[]
    /** Its repository: `atelier-ide-org/plugin-<plugin>`. */
    repo: string
    /** Its releases, `plugins/<plugin>/vX.Y.Z` in atelier-ide-org/releases. */
    releases: string
  }
  /** How a built-in plugin or a language is on in a project: `default` (on until turned off),
   * or `auto` (`"auto"` in `.atelier/config.json`, on while the project has what it needs). */
  activation?: 'default' | 'auto'
  /** A language: the extensions of its files (`file_extensions` in its `mod.rs`), which turn it
   * on in `auto`. */
  files?: string[]
  /** Its code: the folder that holds its `doc`, from the root of its repository
   * (`src/plugins/builtins/cargo`). */
  code?: string
}

/** The built-in plugins that are `"auto"` by default, besides the languages: on while the
 * project has what they need (see `Ide::follow_auto_plugins` in src/app.rs). */
const autoPlugins = new Set(['git'])

/** The extensions of the files of a language, from `fn file_extensions` in its `mod.rs`. */
function languageFiles(folder: string): string[] {
  const file = path.join(folder, 'mod.rs')
  if (!fs.existsSync(file)) return []
  const match = fs
    .readFileSync(file, 'utf8')
    .match(/fn file_extensions\(&self\)[^{]*\{\s*&\[([^\]]*)\]/)
  return match ? [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : []
}

const roots: { dir: string; section: Section; external?: true }[] = [
  { dir: 'src/plugins/builtins', section: 'plugins' },
  { dir: 'plugins', section: 'plugins', external: true },
  { dir: 'src/languages', section: 'languages' },
]

const files: Record<Lang, string> = { en: 'en-US.md', fr: 'fr-FR.md' }

/** Globs of every file the catalog is read from, for the watchers of `vitepress dev`. */
export const watched = [
  ...roots.map((r) => `${repoRoot}/${r.dir}/**/doc/*.md`),
  `${repoRoot}/plugins/*/plugin.json`,
  `${repoRoot}/src/languages/*/mod.rs`,
].map((g) => g.replace(/\\/g, '/'))

/** The manifest of an external plugin: its version and the extensions of its files. */
function manifest(folder: string, slug: string): NonNullable<CatalogPlugin['external']> {
  const file = path.join(folder, 'plugin.json')
  if (!fs.existsSync(file)) fail(file, 'missing: an external plugin needs its manifest')
  let json: any
  try {
    json = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    fail(file, `not valid JSON (${(e as Error).message})`)
  }
  if (typeof json.version !== 'string') fail(file, '"version" is required')
  if (typeof json.abi !== 'number') fail(file, '"abi" is required')
  return {
    version: json.version,
    abi: json.abi,
    extensions: Array.isArray(json.extensions) ? json.extensions.map(String) : [],
    repo: `https://github.com/atelier-ide-org/plugin-${slug}`,
    releases: `https://github.com/atelier-ide-org/releases/releases?q=${encodeURIComponent(`plugins/${slug}/`)}&expanded=true`,
  }
}

/** Every `doc` folder under `dir`, with the plugin folders that hold it, outermost first. */
function docFolders(dir: string, chain: string[] = []): { folder: string; chain: string[] }[] {
  const out: { folder: string; chain: string[] }[] = []
  // `plugins/` holds the native plugins (submodules), and their builds.
  if (!fs.existsSync(dir) || ['target', 'node_modules', '.git'].includes(path.basename(dir))) {
    return out
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const sub = path.join(dir, entry.name)
    if (entry.name === 'doc') {
      out.push({ folder: dir, chain })
    } else {
      const own = fs.existsSync(path.join(sub, 'doc')) ? [...chain, entry.name] : chain
      out.push(...docFolders(sub, own))
    }
  }
  return out
}

function svg(file: string) {
  return `data:image/svg+xml;base64,${fs.readFileSync(file).toString('base64')}`
}

function fail(file: string, message: string): never {
  throw new Error(`${path.relative(repoRoot, file)}: ${message}`)
}

/** The front matter (the card) and the body (the page, empty without one) of a file. */
function read(file: string): { card: Record<string, any>; body: string } {
  if (!fs.existsSync(file)) fail(file, 'missing')
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
  const match = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/)
  if (!match) fail(file, 'no front matter')
  const card = parse(match[1])
  if (!card || typeof card !== 'object') fail(file, 'the front matter is not a YAML mapping')
  for (const key of ['name', 'summary']) {
    if (typeof card[key] !== 'string' || !card[key].trim()) fail(file, `"${key}" is required`)
  }
  return { card, body: text.slice(match[0].length).trim() }
}

const relative = (file: string) => path.relative(repoRoot, file).replace(/\\/g, '/')

export function loadCatalog(): CatalogPlugin[] {
  const plugins: CatalogPlugin[] = []
  for (const root of roots) {
    for (const { folder, chain } of docFolders(path.join(repoRoot, root.dir))) {
      const doc = path.join(folder, 'doc')
      const enFile = path.join(doc, files.en)
      const frFile = path.join(doc, files.fr)
      const { card: en, body: enBody } = read(enFile)
      const { card: fr, body: frBody } = read(frFile)
      const slug = chain[chain.length - 1]

      const category = (root.section === 'languages' ? 'languages' : en.category) as Category
      if (root.section === 'plugins' && !categories.includes(category as any)) {
        fail(enFile, `"category" must be one of ${categories.join(', ')}`)
      }

      let icon: CatalogPlugin['icon']
      const iconFile = path.resolve(folder, typeof en.icon === 'string' ? en.icon : 'icon.svg')
      if (fs.existsSync(iconFile)) {
        const dark = iconFile.replace(/\.svg$/, '.dark.svg')
        icon = { light: svg(iconFile), dark: fs.existsSync(dark) ? svg(dark) : undefined }
      } else if (en.icon) {
        fail(enFile, `the icon ${en.icon} does not exist`)
      }

      if (!enBody !== !frBody) fail(doc, 'a page in one language only')
      const pages: CatalogPlugin['pages'] = enBody ? { en: relative(enFile), fr: relative(frFile) } : {}

      const tags = (v: unknown) => (Array.isArray(v) ? v.map(String) : [])
      plugins.push({
        slug,
        section: root.section,
        parent: chain.length > 1 ? chain[chain.length - 2] : undefined,
        category,
        name: { en: en.name, fr: fr.name },
        summary: { en: en.summary.trim(), fr: fr.summary.trim() },
        tags: [...tags(en.tags), ...tags(fr.tags)],
        icon,
        link: enBody
          ? `${root.section}/${slug}`
          : typeof en.see === 'string'
            ? `${root.section}/${en.see}`
            : undefined,
        pages,
        external: root.external && chain.length === 1 ? manifest(folder, slug) : undefined,
        ...(root.external
          ? {}
          : {
              activation:
                root.section === 'languages' || autoPlugins.has(slug) ? 'auto' : 'default',
              files: root.section === 'languages' ? languageFiles(folder) : undefined,
              code: relative(folder),
            }),
      })
    }
  }

  const slugs = new Set<string>()
  for (const p of plugins) {
    if (slugs.has(p.slug)) throw new Error(`two plugins have the folder name ${p.slug}`)
    slugs.add(p.slug)
  }
  return plugins.sort((a, b) => a.name.en.localeCompare(b.name.en))
}

/** The routes of the pages of one section in one language, for a `[name].paths.ts` file: the
 * body of the page, without its front matter (the card). Every page starts with a header made
 * from its card (theme/PluginHero.vue), which gives its title: its own `# Title` is left out. */
export function pageRoutes(section: Section, lang: Lang, param: string) {
  return loadCatalog()
    .filter((p) => p.section === section && p.pages[lang])
    .map((p) => {
      const body = read(path.join(repoRoot, p.pages[lang]!)).body
      return {
        params: { [param]: p.slug, source: p.pages[lang], title: p.name[lang] },
        content: body.replace(/^# .*\n+/, ''),
      }
    })
}
