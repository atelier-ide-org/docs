---
aside: false
---

# Plugins

Atelier est livré avec un catalogue de plugins intégrés : compilés dans l'IDE, disponibles dans tous les projets et **activés par défaut**, sauf Git, activé tant que le projet a un `.git` (il s'active de lui-même après un `git init`), et les langages, activés tant que le projet contient un de leurs fichiers. Les [plugins externes](#plugins-externes) s'installent depuis l'IDE, par ceux qui en ont besoin. Recherchez-les tous ci-dessous par nom, extension de fichier ou outil (`docx`, `kubectl`, `pnpm`…), ou filtrez par catégorie.

<PluginMarketplace />

## Fonctionnement des plugins intégrés

Chaque plugin s'active ou se désactive dans la fenêtre **Plugins**, pour le projet ouvert : l'état de chaque plugin est écrit dans le projet, dans la section `plugins` de `.atelier/config.json`, et peut se partager avec lui. `"auto"` laisse un plugin à l'IDE (Git, tant qu'on ne l'active ou ne le désactive pas à la main) :

```json
{
  "plugins": {
    "builtin": { "git": "auto", "k8s": false, "markdown": true },
    "external": { "rust-tools": true }
  }
}
```

Les plugins étendent l'interface elle-même : fenêtres d'outils, widgets de la barre de titre et de la barre d'état, gouttière de l'éditeur, couleurs de l'arborescence, raccourcis et commandes de Rechercher partout. Un plugin sans rien à faire dans le projet ouvert (Maven sans `pom.xml`…) masque ses fenêtres et ses commandes.

Un plugin peut avoir des **sous-plugins**, affichés sous lui dans la fenêtre **Plugins** : un sous-plugin ne fonctionne que quand son parent est activé, et se désactive à part (GitHub, sous Git).

La coloration d'un langage vient de son plugin (JavaScript, Rust, Java, Markdown, YAML / TOML, et Cargo pour `Cargo.lock`) : plugin désactivé, ses fichiers s'ouvrent en texte brut. Les autres langages (HTML, CSS, JSON, Python, shell…) sont colorés par Atelier lui-même.

## Plugins externes

Les plugins intégrés sont compilés dans l'IDE : tout ce dont ils dépendent est dans son `Cargo.toml`, téléchargé et compilé avec lui, et livré à chaque utilisateur, qu'il en ait besoin ou non. Un explorateur de bases de données apporte les pilotes de MongoDB, PostgreSQL et MySQL et leur TLS ; un lecteur multimédia, une pile audio et de quoi installer ffmpeg ; une visionneuse Office, des lecteurs de zip, de XML et d'images. Ce dont seuls certains ont besoin est donc un **plugin externe** : un dépôt à part (`plugin-<nom>`), compilé seul avec ses propres dépendances, publié à part de l'IDE, et installé par ceux qui le veulent. L'IDE reste petit, se compile plus vite, et ne dépend d'aucun d'eux.

| Plugin | Fichiers | Ses propres dépendances |
| --- | --- | --- |
| [Database](https://github.com/atelier-ide-org/plugin-database) (`database`) | une fenêtre d'outils | les pilotes MongoDB, PostgreSQL et MySQL, TLS |
| [Microsoft Office](https://github.com/atelier-ide-org/plugin-msoffice-viewer) (`msoffice-viewer`) | `.docx`, `.xlsx`, `.pptx` et leurs variantes | zip, quick-xml, image, flate2 (PDF), rfd |
| [Lecteur multimédia](https://github.com/atelier-ide-org/plugin-media-viewer) (`media-viewer`) | `.mp3`, `.wav`, `.flac`, `.ogg`, `.mp4`, `.mkv`, `.webm`… | rodio, et de quoi télécharger ffmpeg |
| [Visionneuse de modèles 3D](https://github.com/atelier-ide-org/plugin-gltf-viewer) (`gltf-viewer`) | `.glb`, `.gltf` | gltf, glam, glow (OpenGL) |

Un plugin externe est soit un manifeste JSON de commandes, soit un plugin natif, une bibliothèque qui dessine dans l'IDE.

### Plugins de commandes

Un manifeste JSON propre à un projet, qui apporte des commandes. Il s'active projet par projet, et rien ne s'exécute à son chargement.

Pour en essayer un, enregistrez ce manifeste sous `.atelier/plugins/rust-tools.json` dans votre projet, cliquez sur **Plugins**, puis **Recharger**, et activez l'extension :

```json
{
  "id": "rust-tools",
  "name": "Rust Tools",
  "version": "1.0.0",
  "description": "Commandes Cargo pour le projet courant",
  "commands": [
    { "name": "Vérifier", "program": "cargo", "args": ["check"] },
    { "name": "Tester", "program": "cargo", "args": ["test"] }
  ]
}
```

Les arguments sont transmis comme des valeurs littérales, échappées pour le shell. Les commandes s'exécutent avec les droits de l'utilisateur : n'activez que des manifestes de confiance.

### Plugins natifs

Un plugin natif est une bibliothèque dynamique qui dessine dans l'IDE comme un plugin intégré : il ouvre des fichiers dans un onglet de l'éditeur ou apporte une fenêtre d'outils. Il se présente comme **un fichier à installer**, `<plugin>.atelier-plugin`.

**Pour en installer un**, cliquez sur **Plugins**, puis sur l'onglet **Marketplace** : il liste les plugins du [dépôt des téléchargements](https://github.com/atelier-ide-org/releases/releases) que cet Atelier sait charger, avec les fichiers qu'ils ouvrent, un bouton **Installer**, et **Mettre à jour** quand une version plus récente est sortie. Un fichier téléchargé à la main (la release `plugins/<plugin>/vX.Y.Z`) s'installe avec **Installer un plugin depuis un fichier** (le bouton +). Le plugin est installé une fois, dans l'IDE, pour tous les projets, et activé ; il peut toujours être désactivé dans un projet. Sa page a un bouton **Désinstaller**.

Un plugin natif s'exécute dans l'IDE avec les droits de l'utilisateur : n'installez que des plugins de confiance. Sa bibliothèque n'est chargée qu'une fois le plugin activé, jamais avant.

Le fichier est un zip de son manifeste, des icônes de ses fichiers et de la bibliothèque de chaque système :

```
plugin.json
extensions/glb+gltf.svg
windows-x86_64/gltf_viewer.dll
linux-x86_64/libgltf_viewer.so
macos-aarch64/libgltf_viewer.dylib
macos-x86_64/libgltf_viewer.dylib
```

```json
{
  "id": "gltf-viewer",
  "name": "3D Model Viewer",
  "version": "0.4.0",
  "description": "glTF and GLB models shown in 3D, with their animations.",
  "library": "gltf_viewer",
  "abi": 2,
  "extensions": ["glb", "gltf"]
}
```

`library` est le nom de la bibliothèque, sans le préfixe ni l'extension du système, `abi` la version de l'interface des plugins pour laquelle elle a été compilée, `extensions` les extensions des fichiers qu'il prend en charge (`[]` s'il n'y en a pas). L'icône de ces fichiers est dans `extensions/`, un SVG par groupe d'extensions nommé d'après elles, jointes par `+` (`glb+gltf.svg`, avec `glb+gltf.dark.svg` pour les thèmes sombres). Un plugin installé dans l'IDE va dans son dossier de données (`plugins/<plugin>/`) ; un projet peut aussi en contenir un dans `.atelier/plugins/<plugin>/`, les mêmes fichiers décompressés.

Un plugin natif ne parle à l'IDE qu'au travers d'une interface C, le crate [`atelier-plugin-api`](https://github.com/atelier-ide-org/api) : il implémente son trait `Plugin` et l'exporte avec `export_plugin!`. Il dessine avec **son propre egui** : pour chacune de ses surfaces (l'aperçu d'un fichier, une fenêtre d'outils), l'IDE lui envoie les entrées de l'image et peint les maillages et les textures qu'il rend, avec l'apparence, les polices et les icônes de l'IDE ; une surface peut aussi peindre en OpenGL. Un plugin se compile donc seul, avec n'importe quel compilateur Rust, et se charge dans toutes les versions d'Atelier qui lisent la version de l'interface pour laquelle il a été compilé (2 depuis Atelier 0.3).

### Créer un plugin natif

`atelier-cli`, la ligne de commande des plugins, en crée un prêt à compiler, puis le fichier à installer :

```sh
cargo install --git https://github.com/atelier-ide-org/api atelier-cli
atelier-cli plugin create "Ma visionneuse"   # ./ma-visionneuse : Cargo.toml, plugin.json, code, textes, page, CI et release
cd ma-visionneuse
atelier-cli plugin compile                   # target/release/ma-visionneuse.atelier-plugin, pour ce système
```

Installez le fichier avec **Plugins › Installer un plugin depuis un fichier**. Dans un dépôt `plugin-<nom>` de l'organisation, monter la version de son `Cargo.toml` sur `main` le publie sous la release `plugins/<plugin>/vX.Y.Z`, et la Marketplace le liste. Les plugins d'Atelier sont aussi des sous-modules de l'IDE (`plugins/<nom>`).

## Langages

L'onglet **Langages** de la fenêtre **Plugins** liste la prise en charge de chaque langage (JavaScript et TypeScript, Rust, Java, HTML, CSS, Python) : sa coloration, son intelligence de code et ses commandes. Un langage est **automatique** par défaut (`"auto"` dans `.atelier/config.json`) : activé tant que le projet contient un de ses fichiers (un `.rs` pour Rust, un `.py` pour Python…), désactivé sinon. L'activer ou le désactiver à la main en décide pour le projet.
