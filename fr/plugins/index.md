---
aside: false
---

# Plugins

Atelier est livré avec un catalogue de plugins intégrés : compilés dans l'IDE, disponibles dans tous les projets et **activés par défaut**, sauf Git, activé tant que le projet a un `.git` : il s'active de lui-même après un `git init`. Recherchez-les ci-dessous par nom, extension de fichier ou outil (`docx`, `kubectl`, `pnpm`…), ou filtrez par catégorie.

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

Les plugins externes sont des manifestes JSON propres à un projet, qui apportent des commandes ou une bibliothèque native. Ils s'activent projet par projet, et aucun plugin externe ne s'exécute à son chargement.

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

Un plugin natif est une bibliothèque dynamique qui dessine dans l'IDE comme un plugin intégré : il ouvre des fichiers dans un onglet de l'éditeur (la visionneuse de modèles 3D, les documents Microsoft Office) ou apporte une fenêtre d'outils (l'explorateur de bases de données). Il se présente comme **un fichier à installer**, `<plugin>.atelier-plugin`.

**Pour en installer un**, cliquez sur **Plugins**, puis sur l'onglet **Disponibles** : il liste les plugins du [dépôt des téléchargements](https://github.com/atelier-ide-org/releases/releases) que cet Atelier sait charger, avec un bouton **Installer**, et **Mettre à jour** quand une version plus récente est sortie. Un fichier téléchargé à la main (la release `plugins/<plugin>/vX.Y.Z`) s'installe avec **Installer un plugin depuis un fichier** (le bouton +). Le plugin est installé une fois, dans l'IDE, pour tous les projets, et activé ; il peut toujours être désactivé dans un projet. Sa page a un bouton **Désinstaller**.

Un plugin natif s'exécute dans l'IDE avec les droits de l'utilisateur : n'installez que des plugins de confiance. Sa bibliothèque n'est chargée qu'une fois le plugin activé, jamais avant.

Le fichier est un zip de son manifeste et de la bibliothèque de chaque système, dans un dossier à son nom :

```
plugin.json
windows-x86_64/gltf_viewer.dll
linux-x86_64/libgltf_viewer.so
macos-aarch64/libgltf_viewer.dylib
macos-x86_64/libgltf_viewer.dylib
```

```json
{
  "id": "gltf-viewer",
  "name": "3D Model Viewer",
  "version": "0.3.0",
  "description": "glTF and GLB models shown in 3D, with their animations.",
  "library": "gltf_viewer",
  "abi": 2
}
```

`library` est le nom de la bibliothèque, sans le préfixe ni l'extension du système, `abi` la version de l'interface des plugins pour laquelle elle a été compilée. Un plugin installé dans l'IDE va dans son dossier de données (`plugins/<plugin>/`) ; un projet peut aussi en contenir un dans `.atelier/plugins/<plugin>/`, les mêmes fichiers décompressés.

Un plugin natif ne parle à l'IDE qu'au travers d'une interface C, le crate [`atelier-plugin-api`](https://github.com/atelier-ide-org/api) : il implémente son trait `Plugin` et l'exporte avec `export_plugin!`. Il dessine avec **son propre egui** : pour chacune de ses surfaces (l'aperçu d'un fichier, une fenêtre d'outils), l'IDE lui envoie les entrées de l'image et peint les maillages et les textures qu'il rend, avec l'apparence, les polices et les icônes de l'IDE ; une surface peut aussi peindre en OpenGL. Un plugin se compile donc seul, avec n'importe quel compilateur Rust, et se charge dans toutes les versions d'Atelier qui lisent la version de l'interface pour laquelle il a été compilé (2 depuis Atelier 0.3). Chaque plugin a son propre dépôt (`plugin-<nom>`, aussi un sous-module `plugins/<nom>` de l'IDE) : monter la version de son `Cargo.toml` le publie sous `plugins/<plugin>/vX.Y.Z`.
