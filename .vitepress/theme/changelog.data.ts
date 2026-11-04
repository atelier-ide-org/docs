// The changelog of Atelier for the changelog page, read at build time from `CHANGELOG.md` in the
// code of the IDE (written from the files of `.changeset/`, see contributing/releases):
//
//   ## 0.4.0 (2026-11-04)        a version and its date
//   ### Breaking Changes         a kind of change: Breaking Changes, Features, Fixes…
//   #### Title                   a change, with its text in Markdown below
//
// Each text is rendered to HTML here, with the Markdown of VitePress.
import fs from 'node:fs'
import path from 'node:path'
import { createMarkdownRenderer } from 'vitepress'
import { docsRoot, repoRoot } from '../catalog'

export interface Change {
  title: string
  html: string
}

export interface Section {
  /** `breaking`, `features`, `fixes`, or `other`. */
  kind: string
  label: string
  changes: Change[]
}

export interface Version {
  version: string
  date: string
  sections: Section[]
}

declare const data: Version[]
export { data }

const file = path.join(repoRoot, 'CHANGELOG.md')

function kindOf(label: string): string {
  const l = label.toLowerCase()
  if (l.includes('breaking')) return 'breaking'
  if (l.includes('feature')) return 'features'
  if (l.includes('fix')) return 'fixes'
  return 'other'
}

export default {
  watch: [file.replace(/\\/g, '/')],
  async load(): Promise<Version[]> {
    if (!fs.existsSync(file)) return []
    const md = await createMarkdownRenderer(docsRoot)
    const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
    const versions: Version[] = []
    let version: Version | undefined
    let section: Section | undefined
    let change: { title: string; lines: string[] } | undefined

    const closeChange = () => {
      if (change && section) {
        section.changes.push({ title: change.title, html: md.render(change.lines.join('\n').trim()) })
      }
      change = undefined
    }

    for (const line of text.split('\n')) {
      const v = line.match(/^## (\S+)(?: \(([^)]+)\))?\s*$/)
      const s = line.match(/^### (.+)$/)
      const c = line.match(/^#### (.+)$/)
      if (v) {
        closeChange()
        version = { version: v[1], date: v[2] ?? '', sections: [] }
        versions.push(version)
        section = undefined
      } else if (s && version) {
        closeChange()
        section = { kind: kindOf(s[1]), label: s[1].trim(), changes: [] }
        version.sections.push(section)
      } else if (c && section) {
        closeChange()
        change = { title: c[1].trim(), lines: [] }
      } else if (change) {
        change.lines.push(line)
      }
    }
    closeChange()
    return versions
  },
}
