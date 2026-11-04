<script setup>
const files = [
  { path: "Cargo.toml", desc: "The crate, a `cdylib` that depends on [atelier-plugin-api](https://github.com/atelier-ide-org/api)" },
  { path: "plugin.json", desc: "The manifest: `id`, `name`, `description`, `library`, `abi` (2) and `extensions` (`[]`)" },
  { path: "src/lib.rs", desc: "The plugin: a tool window, a command and the view of its files, an example to change" },
  { path: "src/i18n.rs", desc: "`tr!` and `trf!`, its texts in the language of the IDE" },
  { path: "locales/en_US.json", desc: "Its texts in English…" },
  { path: "locales/fr_FR.json", desc: "…and in French" },
  { path: "doc/en-US.md", desc: "Its card and its page in the [catalog](/plugins/)" },
  { path: "doc/fr-FR.md", desc: "The same, in French" },
  { path: "extensions/", desc: "The icons of its files, one SVG per group of extensions (`glb+gltf.svg`)" },
  { path: ".github/workflows/ci.yml", desc: "Builds and tests it on every push" },
  { path: ".github/workflows/release.yml", desc: "Publishes it, see [Publish it](#publish-it)" },
  { path: "README.md", desc: "" },
]

const archive = [
  { path: "plugin.json", desc: "The manifest, with the version of `Cargo.toml`" },
  { path: "extensions/glb+gltf.svg", desc: "The icons of its files" },
  { path: "windows-x86_64/my_viewer.dll", desc: "Its library, for each system it was built for" },
  { path: "linux-x86_64/libmy_viewer.so", desc: "" },
  { path: "macos-aarch64/libmy_viewer.dylib", desc: "" },
]

const compileSteps = [
  { title: "Reads `plugin.json`", text: "and checks what Atelier needs in it: `id`, `name` and `library` (letters, digits, `_` and `-`), `abi`, and `extensions` (a list, `[]` when none)." },
  { title: "Runs `cargo build --release`", text: "`--debug` for a debug build, `--target` for another system." },
  { title: "Writes `<id>.atelier-plugin`", text: "in the build folder (`target/release`, or `target/<triple>/release`), or in `--out`. Its version is the one of `Cargo.toml`: there is only one to raise." },
]

const publishSteps = [
  { title: "Raise the version in `Cargo.toml`", text: "and push it to `main`. A push without a new version publishes nothing." },
  { title: "The workflow builds it on four systems", text: "with `atelier-cli plugin compile`: Windows, Linux, macOS Intel and Apple Silicon, then merges the four builds into one file." },
  { title: "It publishes the release `plugins/<id>/vX.Y.Z`", text: "in [atelier-ide-org/releases](https://github.com/atelier-ide-org/releases/releases): `<id>.atelier-plugin`, its `plugin.json` and `<id>-SHA256SUMS`." },
  { title: "The Marketplace of Atelier lists it", text: "with **Install**, and **Update** for those who have an older version." },
]

const errors = [
  { message: 'plugin.json: "abi" is required', fix: 'Add `"abi": 2`, the version of the plugin interface.' },
  { message: 'plugin.json: "extensions" is required', fix: 'Add `"extensions": []`, or the extensions of its files.' },
  { message: "<name>: letters, digits, _ and - only", fix: "Rename `id` or `library` in `plugin.json`." },
  { message: "Cargo.toml: no version in [package]", fix: 'Add `version = "0.1.0"` under `[package]`.' },
  { message: "target/release/my_viewer.dll: (not found)", fix: "`library` in `plugin.json` must be the name of the library of the crate, with `_` for `-`." },
  { message: "<triple>: an unknown system", fix: "Use a target triple of Windows, Linux or macOS." },
  { message: "cargo build failed", fix: "The error of Cargo is printed just above." },
]

const createOptions = [{ flag: "--dir <folder>", text: "Where to make its folder, instead of the current one." }]
const compileOptions = [
  { flag: "--debug", text: "A debug build, faster to make, in `target/debug`." },
  { flag: "--target <triple>", text: "The library of another system: `x86_64-pc-windows-msvc`, `x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`, `x86_64-apple-darwin`." },
  { flag: "--out <folder>", text: "Where to write the file." },
]
const mergeOptions = [{ flag: "--out <file>", text: "The file to write (required)." }]

const install = [
  "$ cargo install --git https://github.com/atelier-ide-org/api atelier-cli",
  "$ atelier-cli --help",
]
const quick = [
  '$ atelier-cli plugin create "My viewer"  # ./my-viewer, ready to build',
  "$ cd my-viewer",
  "$ atelier-cli plugin compile  # builds it, then packs it",
  "target/release/my-viewer.atelier-plugin",
  "In Atelier: Plugins, Install a plugin from a file (the + button).",
]
const merge = [
  "$ atelier-cli plugin compile --target x86_64-pc-windows-msvc --out parts/windows",
  "$ atelier-cli plugin compile --target x86_64-unknown-linux-gnu --out parts/linux",
  "$ atelier-cli plugin merge parts/windows/my-viewer.atelier-plugin parts/linux/my-viewer.atelier-plugin --out my-viewer.atelier-plugin",
]
</script>

# atelier-cli

`atelier-cli` is the command line of the [native plugins](/plugins/#native-plugins): it makes a new plugin ready to build, compiles it into the file Atelier installs (`<plugin>.atelier-plugin`), and merges the builds of several systems into one file. The CI of every plugin of Atelier runs it to publish them.

It is not the command line of the IDE (`atelier`, see [Command line](/guide/command-line)): `atelier-cli` only makes plugins, and needs neither the IDE nor its code.

## Install it

It needs stable Rust, from [rustup.rs](https://rustup.rs). Add `--tag v0.4.0` for the version the CI of the plugins uses.

<Terminal title="install" :lines="install" />

## In three commands

<Terminal title="~/projects" :lines="quick" />

In Atelier, **Plugins › Install a plugin from a file** (the + button), then pick the file: the plugin is installed once, for every project, and turned on. Its tool window is on the right.

## The commands

### `plugin create`

<CommandCard
  usage="atelier-cli plugin create <name> [--dir <folder>]"
  summary="Writes a new plugin in `<folder>/<id>` (`./<id>` by default). The identifier comes from the name: `My viewer` gives `my-viewer`, its library `my_viewer` and its type `MyViewerPlugin`. A name starts with a letter, and the folder must not exist yet."
  :options="createOptions"
/>

<FileTree root="my-viewer/" :files="files" />

To open files, add their extensions to `extensions` in `plugin.json` and to `file_types` in `src/lib.rs`, with their icon in `extensions/`.

### `plugin compile`

<CommandCard
  usage="atelier-cli plugin compile [<path>] [--debug] [--target <triple>] [--out <folder>]"
  summary="Builds the plugin of `<path>` (the current folder by default) and makes its `.atelier-plugin`."
  :options="compileOptions"
/>

<Steps :steps="compileSteps" />

The file is a zip:

<FileTree root="my-viewer.atelier-plugin" :files="archive" />

### `plugin merge`

<CommandCard
  usage="atelier-cli plugin merge <file>... --out <file>"
  summary="One `.atelier-plugin` from several builds of the same plugin, each with the library of another system: the libraries of all of them, with the manifest and the icons of the first. Files of different plugins are refused."
  :options="mergeOptions"
/>

<Terminal title="my-viewer" :lines="merge" />

Atelier loads the library of its own system from the file.

## Publish it

A plugin made by `plugin create` publishes itself with `.github/workflows/release.yml`, from a repository `plugin-<name>` of the [organization](https://github.com/atelier-ide-org):

<Steps :steps="publishSteps" />

Started by hand, the workflow builds the version of `main` again and replaces the files of its release. It needs the organization secret `ATELIER_RELEASES`. The plugin shows in the [catalog](/plugins/#external-plugins-list) once it is a submodule of the IDE (`plugins/<name>`), with the card of its `doc/` folder.

## When it fails

<Troubleshoot :items="errors" />
