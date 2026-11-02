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
- **`atelier-ide-org/app`**, où `knope release` crée le tag `vX.Y.Z` et publie les notes du changelog. Les lanceurs installés avant le déménagement y cherchent encore, jusqu'à ce qu'ils se mettent à jour eux-mêmes (voir `MIGRATION.md`).

La release de `releases` reste un brouillon tant que tous les fichiers ne sont pas envoyés et que `knope` n'a pas fini, si bien que le lanceur n'en voit jamais une incomplète.

## Fichiers d'une release

| Fichier | Rôle |
| --- | --- |
| `atelier-setup-windows-x86_64.exe` | L'installateur Windows |
| `atelier-<os>-<arch>` | Le lanceur, téléchargé une fois sur Linux et macOS |
| `atelier-ide-<os>-<arch>.zip` / `.tar.gz` | L'archive qu'installe le lanceur : l'IDE et le prochain lanceur |
| `SHA256SUMS` | Les sommes de contrôle que vérifie le lanceur |

L'IDE n'attend jamais ses plugins. Un plugin natif ne se charge que dans un IDE compilé comme lui : chaque release de l'IDE pousse donc aussi son kit de compilation (son `Cargo.toml`, son `Cargo.lock` et son `rust-toolchain.toml`, sans code) dans `vX.Y.Z/` de la branche `kits` d'[`atelier-ide-org/api`](https://github.com/atelier-ide-org/api). Le workflow **Release** de chaque dépôt de plugin (`plugin-<nom>`) fait de ce kit un paquet vide, y place le plugin dans son dossier `plugins/`, lance la commande qui a compilé l'IDE, et publie ses fichiers sous la release `plugins/<plugin>/vX.Y.Z` du même dépôt, quelques heures plus tard au plus : `<plugin>.atelier-plugin` (son `plugin.json` et la bibliothèque de chaque système, le fichier qu'Atelier installe avec Plugins › Installer un plugin depuis un fichier) et `<plugin>-SHA256SUMS`. Elle n'est jamais marquée comme la dernière release, qui reste celle de l'IDE : les liens de téléchargement du site y mènent. Le compilateur de l'IDE est fixé par `rust-toolchain.toml`, que les plugins utilisent aussi.

Le workflow **Build** se lance aussi à la main, pour compiler sans publier. L'organisation et le dépôt doivent autoriser « Allow GitHub Actions to create and approve pull requests » (Settings › Actions › General) pour que la pull request de release puisse être créée.
