// A little Markdown for the texts given to the components as data: `code`, **bold** and
// [links](/path). The text is escaped first; a link from the root of the site gets its base.
import { withBase } from 'vitepress'

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function inline(text: string): string {
  return escape(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, href: string) => {
      const external = /^https?:/.test(href)
      const url = href.startsWith('/') ? withBase(href) : href
      return external
        ? `<a href="${url}" target="_blank" rel="noreferrer">${label}</a>`
        : `<a href="${url}">${label}</a>`
    })
}
