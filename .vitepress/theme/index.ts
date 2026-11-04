import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import DownloadButton from './DownloadButton.vue'
import DownloadPage from './DownloadPage.vue'
import ChangelogPage from './ChangelogPage.vue'
import PluginMarketplace from './PluginMarketplace.vue'
import PluginHero from './PluginHero.vue'
import PluginInstall from './PluginInstall.vue'
import PluginActivation from './PluginActivation.vue'
import CommandCard from './components/CommandCard.vue'
import FileTree from './components/FileTree.vue'
import Steps from './components/Steps.vue'
import Terminal from './components/Terminal.vue'
import Troubleshoot from './components/Troubleshoot.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  // The download button sits under the actions of the home page, and is `<DownloadButton />` in
  // any page.
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'home-hero-actions-after': () => h(DownloadButton, { guide: true }),
    }),
  enhanceApp({ app }) {
    app.component('DownloadButton', DownloadButton)
    // The pages of the downloads and of the changelog (download.md, changelog.md).
    app.component('DownloadPage', DownloadPage)
    app.component('ChangelogPage', ChangelogPage)
    app.component('PluginMarketplace', PluginMarketplace)
    // The header of the page of a plugin or a language, and its end: how to install an external
    // plugin, how to turn on or off a built-in one or a language (plugins/[plugin].md…).
    app.component('PluginHero', PluginHero)
    app.component('PluginInstall', PluginInstall)
    app.component('PluginActivation', PluginActivation)
    // The components of the pages (theme/components/): commands, files, steps, errors.
    app.component('CommandCard', CommandCard)
    app.component('FileTree', FileTree)
    app.component('Steps', Steps)
    app.component('Terminal', Terminal)
    app.component('Troubleshoot', Troubleshoot)
  },
} satisfies Theme
