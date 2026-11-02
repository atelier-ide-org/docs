# Atelier IDE — Documentation

The documentation of [Atelier IDE](https://github.com/atelier-ide-org/releases), in English and French: <https://atelier-ide-org.github.io/docs/>.

A [VitePress](https://vitepress.dev) site built with [Bun](https://bun.sh). The pages of the plugins and languages are not here: they live next to their code, in the `doc` folder of each plugin of the IDE (`atelier-ide-org/app`) and of each native plugin (`plugin-<name>`). Clone the IDE next to this repository, and the native plugins into its `plugins/` folder:

```bash
git clone git@github.com:atelier-ide-org/app.git
git clone git@github.com:atelier-ide-org/plugin-gltf-viewer.git app/plugins/gltf-viewer
git clone git@github.com:atelier-ide-org/docs.git
cd docs
bun install
bun run dev       # http://localhost:5173/docs/
bun run build     # checks the links too
```

`ATELIER_APP` points to the IDE elsewhere. The CI clones it into `app/` with the secret `READ_TOKEN` (it reads `app` and the private plugins), deploys `main` to GitHub Pages, and builds the site again every night to follow the code.
