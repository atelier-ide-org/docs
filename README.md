# Atelier IDE — Documentation

The documentation of [Atelier IDE](https://github.com/atelier-ide-org/releases), in English and French: <https://atelier-ide-org.github.io/docs/>.

A [VitePress](https://vitepress.dev) site built with [Bun](https://bun.sh). The pages of the plugins and languages are not here: they live next to their code, in the `doc` folder of each plugin of the IDE (`atelier-ide-org/app`) and of each native plugin (`plugin-<name>`). This repository is the submodule `docs/` of the IDE, whose submodules `plugins/<name>` are the native plugins: clone the IDE with its submodules.

```bash
git clone --recurse-submodules git@github.com:atelier-ide-org/app.git
cd app/docs
bun install
bun run dev       # http://localhost:5173/docs/
bun run build     # checks the links too
```

Alone, the site looks for the IDE in `..` (as a submodule), else in `../app`; `ATELIER_APP` points to it elsewhere. The CI clones the IDE into `app/` with its native plugins (`app/plugins/`), deploys `main` to GitHub Pages, and builds the site again every night to follow the code.
