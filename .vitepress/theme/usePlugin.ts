// The plugin of the page being shown (`/plugins/<plugin>` or `/languages/<language>`), from the
// catalog, with its parent and its sub-plugins, and the language of the page. Undefined on any
// other page.
import { computed } from 'vue'
import { useData } from 'vitepress'
import { data as plugins } from './catalog.data'

export function usePlugin() {
  const { params, lang } = useData()
  const l = computed<'en' | 'fr'>(() => (lang.value.startsWith('fr') ? 'fr' : 'en'))
  const prefix = computed(() => (l.value === 'fr' ? '/fr' : ''))
  const slug = computed(() => params.value?.plugin ?? params.value?.language)
  const plugin = computed(() => plugins.find((p) => p.slug === slug.value))
  const parent = computed(() => plugins.find((p) => p.slug === plugin.value?.parent))
  const subs = computed(() => plugins.filter((p) => plugin.value && p.parent === plugin.value.slug))
  return { plugin, parent, subs, l, prefix }
}
