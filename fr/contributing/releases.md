# Versions et releases

Les versions sont gérées par [Knope](https://knope.tech) (`knope.toml`), comme avec Changesets : ce sont les fichiers de `.changeset/` qui décident de la version et du changelog, pas les messages de commit.

## 1. Dans la pull request

Un changement qui mérite une ligne dans le changelog s'accompagne d'un fichier de changement, créé par `knope document-change` (type, puis résumé) ou écrit à la main dans `.changeset/<résumé>.md` :

```md
---
default: minor
---

# Le terminal affiche la mémoire et le CPU de chaque onglet

Détails facultatifs, en Markdown.
```

`major` pour un changement cassant, `minor` pour une nouveauté, `patch` pour une correction. Tant que la version est en `0.x`, `major` donne `0.(x+1).0`, et `minor` comme `patch` incrémentent le dernier chiffre.

## 2. Sur `main`

Le workflow **Prepare release** (`.github/workflows/prepare-release.yml`) ouvre ou met à jour la pull request « chore: prepare release X.Y.Z » depuis la branche `release`. Elle change la version de `Cargo.toml` et `Cargo.lock`, ajoute la section de `CHANGELOG.md` et supprime les fichiers de changement utilisés.

Le workflow compile ensuite la branche `release` : les fichiers sont à essayer dans les artefacts du run, et les dépendances compilées restent en cache pour la release.

::: warning
Cette pull request est poussée par GitHub Actions, donc la CI ne tourne pas dessus : un admin la merge sans attendre les vérifications obligatoires. Elle ne change que la version et le changelog.
:::

## 3. Au merge de cette pull request

Le workflow **Release** (`.github/workflows/release.yml`) compile l'IDE et son lanceur pour Windows, Linux et macOS (Intel et Apple Silicon) avec `.github/workflows/build.yml`, ainsi que l'installateur Windows. Grâce au cache, seul le code d'Atelier est recompilé. La release est ensuite publiée à deux endroits :

- **[`atelier-ide-org/releases`](https://github.com/atelier-ide-org/releases)**, le dépôt public des téléchargements, sous le tag `app/vX.Y.Z`, où le lanceur cherche les mises à jour (la dernière release dont le tag commence par `app/`). Cette étape demande `ATELIER_RELEASES`, un secret de l'organisation : un jeton qui peut écrire le contenu de `releases` et d'`api`. Sans lui, le workflow s'arrête avant de rien publier.
- **`atelier-ide-org/app`**, où `knope release` crée le tag `vX.Y.Z` et publie les notes du changelog. Les lanceurs installés avant le déménagement y cherchent encore, jusqu'à ce qu'ils se mettent à jour eux-mêmes.

La release de `releases` reste un brouillon tant que tous les fichiers ne sont pas envoyés et que `knope` n'a pas fini, si bien que le lanceur n'en voit jamais une incomplète.

## Fichiers d'une release

| Fichier | Rôle |
| --- | --- |
| `atelier-setup-windows-x86_64.exe` | L'installateur Windows |
| `atelier-<os>-<arch>` | Le lanceur, téléchargé une fois sur Linux et macOS |
| `atelier-ide-<os>-<arch>.zip` / `.tar.gz` | L'archive qu'installe le lanceur : l'IDE et le prochain lanceur |
| `SHA256SUMS` | Les sommes de contrôle que vérifie le lanceur |

L'IDE n'attend jamais ses plugins, et les plugins n'attendent pas l'IDE. Un plugin natif ne parle à l'IDE qu'au travers d'une interface C ([`atelier-ide-org/api`](https://github.com/atelier-ide-org/api)) : il se compile seul et se charge dans toutes les versions de l'IDE qui lisent la version de l'interface pour laquelle il a été compilé. Chaque dépôt de plugin (`plugin-<nom>`) se publie lui-même : quand un push sur son `main` monte la version de son `Cargo.toml`, son workflow **Release** compile la bibliothèque pour chaque système et publie la release `plugins/<plugin>/vX.Y.Z` (la version du plugin) d'`atelier-ide-org/releases` : `<plugin>.atelier-plugin` (son `plugin.json` et la bibliothèque de chaque système, le fichier qu'Atelier installe), son `plugin.json` seul (ce que l'IDE liste dans Plugins › Disponibles) et `<plugin>-SHA256SUMS`. Elle n'est jamais marquée comme la dernière release, qui reste celle de l'IDE : les liens de téléchargement du site y mènent. Un changement de l'interface que les anciens plugins ne peuvent pas suivre demande une nouvelle version de l'interface (`abi::VERSION`), et de nouvelles releases des plugins.

Le workflow **Build** se lance aussi à la main, pour compiler sans publier. L'organisation et le dépôt doivent autoriser « Allow GitHub Actions to create and approve pull requests » (Settings › Actions › General) pour que la pull request de release puisse être créée.
