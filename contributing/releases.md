# Versions & releases

Versions are managed by [Knope](https://knope.tech) (`knope.toml`), as with Changesets: the files of `.changeset/` decide the version and the changelog, not the commit messages.

## 1. In the pull request

A change worth a line in the changelog comes with a change file, made by `knope document-change` (type, then summary) or written by hand in `.changeset/<summary>.md`:

```md
---
default: minor
---

# The terminal shows the memory and CPU use of each tab

Optional details, in Markdown.
```

`major` for a breaking change, `minor` for a feature, `patch` for a fix. While the version is `0.x`, `major` gives `0.(x+1).0`, and `minor` and `patch` both bump the last number.

## 2. On `main`

The **Prepare release** workflow (`.github/workflows/prepare-release.yml`) opens or updates the “chore: prepare release X.Y.Z” pull request from the `release` branch. It changes the version in `Cargo.toml` and `Cargo.lock`, adds the section of `CHANGELOG.md` and deletes the change files it used.

The workflow then builds the `release` branch: the files can be tried from the artifacts of the run, and the compiled dependencies stay in the cache for the release.

::: warning
That pull request is pushed by GitHub Actions, so the CI does not run on it: an admin merges it without waiting for the required checks. It only changes the version and the changelog.
:::

## 3. When that pull request is merged

The **Release** workflow (`.github/workflows/release.yml`) builds the IDE and its launcher for Windows, Linux and macOS (Intel and Apple Silicon) with `.github/workflows/build.yml`, along with the Windows installer. Thanks to the cache, only the code of Atelier is rebuilt. The release is then published in two places:

- **[`atelier-ide-org/releases`](https://github.com/atelier-ide-org/releases)**, the public repository of the downloads, as the release `app/vX.Y.Z`, where the launcher looks for updates (the latest release whose tag starts with `app/`). This step needs `ATELIER_RELEASES`, a secret of the organization: a token allowed to write the contents of `releases` and `api`. Without it, the workflow stops before publishing anything.
- **`atelier-ide-org/app`**, where `knope release` creates the `vX.Y.Z` tag and publishes the notes of the changelog. The launchers installed before the move still look there, until they update themselves.

The release of `releases` stays a draft until every file is uploaded and `knope` is done, so the launcher never sees an incomplete one.

## Files of a release

| File | Use |
| --- | --- |
| `atelier-setup-windows-x86_64.exe` | The Windows installer |
| `atelier-<os>-<arch>` | The launcher, downloaded once on Linux and macOS |
| `atelier-ide-<os>-<arch>.zip` / `.tar.gz` | The archive the launcher installs: the IDE and the next launcher |
| `SHA256SUMS` | The checksums the launcher verifies |

The IDE never waits for its plugins, and the plugins do not wait for the IDE. A native plugin talks to the IDE through a C interface only ([`atelier-ide-org/api`](https://github.com/atelier-ide-org/api)), so it is built alone and loads in every version of the IDE that reads the version of the interface it was built for. Each plugin repository (`plugin-<name>`) publishes itself: when a push to its `main` raises the version of its `Cargo.toml`, its **Release** workflow builds the library for each system with `atelier-cli plugin compile` and publishes the release `plugins/<plugin>/vX.Y.Z` (the version of the plugin) of `atelier-ide-org/releases`: `<plugin>.atelier-plugin` (its `plugin.json` and the library of each system, the file Atelier installs), its `plugin.json` alone (what the IDE lists in Plugins › Marketplace) and `<plugin>-SHA256SUMS`. It is never marked as the latest release, which stays the IDE's: the download links of the site point to it. A change of the interface that older plugins cannot follow takes a new version of the interface (`abi::VERSION`), and new releases of the plugins.

The **Build** workflow can also be started by hand, to build without publishing. The organization and the repository must allow “Allow GitHub Actions to create and approve pull requests” (Settings › Actions › General) for the release pull request to be created.
