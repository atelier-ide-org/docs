// The files of a release of Atelier, in the public repository of the downloads (the code is in
// the private `app`): the installer on Windows, the launcher elsewhere, which downloads the IDE
// next to it. `releases/latest/download/<name>` always serves the file of the latest release.
// Used by the download button and the download page.

export type Os = 'windows' | 'mac-arm' | 'mac-intel' | 'linux'

export const repo = 'atelier-ide-org/releases'
export const latest = `https://github.com/${repo}/releases/latest`
export const base = `${latest}/download/`

export const files: Record<Os, string> = {
  windows: 'atelier-setup-windows-x86_64.exe',
  'mac-arm': 'atelier-macos-aarch64',
  'mac-intel': 'atelier-macos-x86_64',
  linux: 'atelier-linux-x86_64',
}

export const names: Record<Os, string> = {
  windows: 'Windows',
  'mac-arm': 'macOS (Apple Silicon)',
  'mac-intel': 'macOS (Intel)',
  linux: 'Linux',
}

export const systems = Object.keys(files) as Os[]

/** The system of the visitor (Windows until the page knows better: it is rendered ahead of time,
 * without a browser). */
export async function detectOs(): Promise<Os> {
  const agent = navigator.userAgent
  if (/Mac/i.test(agent)) {
    // Only Chromium tells the architecture; Safari and Firefox on a Mac get Apple Silicon.
    const data = (navigator as any).userAgentData
    if (data?.getHighEntropyValues) {
      try {
        const { architecture } = await data.getHighEntropyValues(['architecture'])
        if (architecture === 'x86') return 'mac-intel'
      } catch {}
    }
    return 'mac-arm'
  }
  if (/Linux|X11/i.test(agent) && !/Android/i.test(agent)) return 'linux'
  return 'windows'
}

export interface Release {
  tag: string
  date: string
  url: string
  /** The size of each file, in bytes, by name. */
  sizes: Record<string, number>
}

/** The latest release, from the API of GitHub: undefined without network or over its limit. */
export async function latestRelease(): Promise<Release | undefined> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`)
    if (!response.ok) return
    const json = await response.json()
    const sizes: Record<string, number> = {}
    for (const asset of json.assets ?? []) sizes[asset.name] = asset.size
    // The tags of the IDE are `app/vX.Y.Z` (the plugins have theirs in the same repository).
    const tag = String(json.tag_name ?? '').replace(/^.*\//, '')
    return { tag, date: json.published_at ?? '', url: json.html_url ?? latest, sizes }
  } catch {}
}
