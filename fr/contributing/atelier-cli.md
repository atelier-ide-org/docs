<script setup>
const files = [
  { path: "Cargo.toml", desc: "Le crate, une `cdylib` qui dépend d'[atelier-plugin-api](https://github.com/atelier-ide-org/api)" },
  { path: "plugin.json", desc: "Le manifeste : `id`, `name`, `description`, `library`, `abi` (2) et `extensions` (`[]`)" },
  { path: "src/lib.rs", desc: "Le plugin : une fenêtre d'outils, une commande et la vue de ses fichiers, un exemple à modifier" },
  { path: "src/i18n.rs", desc: "`tr!` et `trf!`, ses textes dans la langue de l'IDE" },
  { path: "locales/en_US.json", desc: "Ses textes en anglais…" },
  { path: "locales/fr_FR.json", desc: "…et en français" },
  { path: "doc/en-US.md", desc: "Sa carte et sa page dans le [catalogue](/fr/plugins/)" },
  { path: "doc/fr-FR.md", desc: "La même, en français" },
  { path: "extensions/", desc: "Les icônes de ses fichiers, un SVG par groupe d'extensions (`glb+gltf.svg`)" },
  { path: ".github/workflows/ci.yml", desc: "Le compile et le teste à chaque push" },
  { path: ".github/workflows/release.yml", desc: "Le publie, voir [Le publier](#le-publier)" },
  { path: "README.md", desc: "" },
]

const archive = [
  { path: "plugin.json", desc: "Le manifeste, avec la version du `Cargo.toml`" },
  { path: "extensions/glb+gltf.svg", desc: "Les icônes de ses fichiers" },
  { path: "windows-x86_64/ma_visionneuse.dll", desc: "Sa bibliothèque, pour chaque système pour lequel il a été compilé" },
  { path: "linux-x86_64/libma_visionneuse.so", desc: "" },
  { path: "macos-aarch64/libma_visionneuse.dylib", desc: "" },
]

const compileSteps = [
  { title: "Lit `plugin.json`", text: "et vérifie ce dont Atelier a besoin : `id`, `name` et `library` (lettres, chiffres, `_` et `-`), `abi`, et `extensions` (une liste, `[]` s'il n'y en a pas)." },
  { title: "Lance `cargo build --release`", text: "`--debug` pour une compilation de debug, `--target` pour un autre système." },
  { title: "Écrit `<id>.atelier-plugin`", text: "dans le dossier de compilation (`target/release`, ou `target/<triplet>/release`), ou dans `--out`. Sa version est celle du `Cargo.toml` : il n'y en a qu'une à monter." },
]

const publishSteps = [
  { title: "Montez la version dans `Cargo.toml`", text: "et poussez-la sur `main`. Un push sans nouvelle version ne publie rien." },
  { title: "Le workflow le compile sur quatre systèmes", text: "avec `atelier-cli plugin compile` : Windows, Linux, macOS Intel et Apple Silicon, puis réunit les quatre compilations en un fichier." },
  { title: "Il publie la release `plugins/<id>/vX.Y.Z`", text: "dans [atelier-ide-org/releases](https://github.com/atelier-ide-org/releases/releases) : `<id>.atelier-plugin`, son `plugin.json` et `<id>-SHA256SUMS`." },
  { title: "La Marketplace d'Atelier le liste", text: "avec **Installer**, et **Mettre à jour** pour ceux qui ont une version plus ancienne." },
]

const errors = [
  { message: 'plugin.json: "abi" is required', fix: "Ajoutez `\"abi\": 2`, la version de l'interface des plugins." },
  { message: 'plugin.json: "extensions" is required', fix: "Ajoutez `\"extensions\": []`, ou les extensions de ses fichiers." },
  { message: "<nom>: letters, digits, _ and - only", fix: "Renommez `id` ou `library` dans `plugin.json`." },
  { message: "Cargo.toml: no version in [package]", fix: "Ajoutez `version = \"0.1.0\"` sous `[package]`." },
  { message: "target/release/ma_visionneuse.dll: (introuvable)", fix: "`library` dans `plugin.json` doit être le nom de la bibliothèque du crate, avec `_` pour `-`." },
  { message: "<triplet>: an unknown system", fix: "Utilisez un triplet de Windows, Linux ou macOS." },
  { message: "cargo build failed", fix: "L'erreur de Cargo est affichée juste au-dessus." },
]

const createOptions = [{ flag: "--dir <dossier>", text: "Où créer son dossier, au lieu du dossier courant." }]
const compileOptions = [
  { flag: "--debug", text: "Une compilation de debug, plus rapide, dans `target/debug`." },
  { flag: "--target <triplet>", text: "La bibliothèque d'un autre système : `x86_64-pc-windows-msvc`, `x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`, `x86_64-apple-darwin`." },
  { flag: "--out <dossier>", text: "Où écrire le fichier." },
]
const mergeOptions = [{ flag: "--out <fichier>", text: "Le fichier à écrire (obligatoire)." }]

const install = [
  "$ cargo install --git https://github.com/atelier-ide-org/api atelier-cli",
  "$ atelier-cli --help",
]
const quick = [
  '$ atelier-cli plugin create "Ma visionneuse"  # ./ma-visionneuse, prêt à compiler',
  "$ cd ma-visionneuse",
  "$ atelier-cli plugin compile  # le compile, puis l'empaquette",
  "target/release/ma-visionneuse.atelier-plugin",
  "In Atelier: Plugins, Install a plugin from a file (the + button).",
]
const merge = [
  "$ atelier-cli plugin compile --target x86_64-pc-windows-msvc --out parts/windows",
  "$ atelier-cli plugin compile --target x86_64-unknown-linux-gnu --out parts/linux",
  "$ atelier-cli plugin merge parts/windows/ma-visionneuse.atelier-plugin parts/linux/ma-visionneuse.atelier-plugin --out ma-visionneuse.atelier-plugin",
]
</script>

# atelier-cli

`atelier-cli` est la ligne de commande des [plugins natifs](/fr/plugins/#plugins-natifs) : elle crée un nouveau plugin prêt à compiler, le compile en un fichier qu'Atelier installe (`<plugin>.atelier-plugin`), et réunit les compilations de plusieurs systèmes en un seul fichier. La CI de chaque plugin d'Atelier l'utilise pour les publier.

Ce n'est pas la ligne de commande de l'IDE (`atelier`, voir [Ligne de commande](/fr/guide/command-line)) : `atelier-cli` ne fait que des plugins, et n'a besoin ni de l'IDE ni de son code.

## L'installer

Il faut Rust stable, depuis [rustup.rs](https://rustup.rs). Ajoutez `--tag v0.4.0` pour la version qu'utilise la CI des plugins.

<Terminal title="installation" :lines="install" />

## En trois commandes

<Terminal title="~/projets" :lines="quick" />

Dans Atelier, **Plugins › Installer un plugin depuis un fichier** (le bouton +), puis choisissez le fichier : le plugin est installé une fois, pour tous les projets, et activé. Sa fenêtre d'outils est à droite.

## Les commandes

### `plugin create`

<CommandCard
  usage="atelier-cli plugin create <nom> [--dir <dossier>]"
  summary="Écrit un nouveau plugin dans `<dossier>/<id>` (`./<id>` par défaut). L’identifiant vient du nom : `Ma visionneuse` donne `ma-visionneuse`, sa bibliothèque `ma_visionneuse` et son type `MaVisionneusePlugin`. Un nom commence par une lettre, et le dossier ne doit pas déjà exister."
  :options="createOptions"
/>

<FileTree root="ma-visionneuse/" :files="files" />

Pour ouvrir des fichiers, ajoutez leurs extensions à `extensions` dans `plugin.json` et à `file_types` dans `src/lib.rs`, avec leur icône dans `extensions/`.

### `plugin compile`

<CommandCard
  usage="atelier-cli plugin compile [<chemin>] [--debug] [--target <triplet>] [--out <dossier>]"
  summary="Compile le plugin de `<chemin>` (le dossier courant par défaut) et fabrique son `.atelier-plugin`."
  :options="compileOptions"
/>

<Steps :steps="compileSteps" />

Le fichier est un zip :

<FileTree root="ma-visionneuse.atelier-plugin" :files="archive" />

### `plugin merge`

<CommandCard
  usage="atelier-cli plugin merge <fichier>... --out <fichier>"
  summary="Un seul `.atelier-plugin` à partir de plusieurs compilations du même plugin, chacune avec la bibliothèque d’un autre système : les bibliothèques de toutes, avec le manifeste et les icônes de la première. Des fichiers de plugins différents sont refusés."
  :options="mergeOptions"
/>

<Terminal title="ma-visionneuse" :lines="merge" />

Atelier charge depuis le fichier la bibliothèque de son propre système.

## Le publier

Un plugin créé par `plugin create` se publie tout seul avec `.github/workflows/release.yml`, depuis un dépôt `plugin-<nom>` de l'[organisation](https://github.com/atelier-ide-org) :

<Steps :steps="publishSteps" />

Lancé à la main, le workflow recompile la version de `main` et remplace les fichiers de sa release. Il lui faut le secret de l'organisation `ATELIER_RELEASES`. Le plugin apparaît dans le [catalogue](/fr/plugins/#external-plugins-list) une fois sous-module de l'IDE (`plugins/<nom>`), avec la carte de son dossier `doc/`.

## Quand ça échoue

<Troubleshoot :items="errors" />
