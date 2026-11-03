---
aside: false
---

# Plugins

Atelier ships with a catalog of built-in plugins: compiled into the IDE, available in every project and **enabled by default**, except Git, which is on while the project has a `.git`: it comes on by itself after a `git init`. Search them below by name, file extension or tool (`docx`, `kubectl`, `pnpm`…), or filter by category.

<PluginMarketplace />

## How built-in plugins work

Each plugin is turned on or off in the **Plugins** window, for the open project: the state of every plugin is written in the project, in the `plugins` section of `.atelier/config.json`, and can be shared with it. `"auto"` leaves a plugin to the IDE (Git, until it is turned on or off by hand):

```json
{
  "plugins": {
    "builtin": { "git": "auto", "k8s": false, "markdown": true },
    "external": { "rust-tools": true }
  }
}
```

Plugins extend the interface itself: tool windows, title bar and status bar widgets, editor gutter, project tree colors, shortcuts and Search Everywhere commands. A plugin with nothing to do in the open project (Maven without a `pom.xml`…) hides its windows and commands.

A plugin can have **sub-plugins**, shown under it in the **Plugins** window: a sub-plugin runs only while its parent is on, and can be turned off by itself (GitHub, under Git).

The coloring of a language comes with its plugin (JavaScript, Rust, Java, Markdown, YAML / TOML, and Cargo for `Cargo.lock`): when the plugin is off, its files open as plain text. The other languages (HTML, CSS, JSON, Python, shell…) are colored by Atelier itself.

## External plugins

External plugins are JSON manifests of a project, which bring commands or a native library. They are enabled for each project separately, and no external plugin runs when it is loaded.

To try one, save this manifest as `.atelier/plugins/rust-tools.json` in your project, click **Plugins**, then **Reload**, and enable the extension:

```json
{
  "id": "rust-tools",
  "name": "Rust Tools",
  "version": "1.0.0",
  "description": "Cargo commands for the current project",
  "commands": [
    { "name": "Check", "program": "cargo", "args": ["check"] },
    { "name": "Test", "program": "cargo", "args": ["test"] }
  ]
}
```

Arguments are passed as literal values, escaped for the shell. Commands run with the rights of the user: only enable manifests you trust.

### Native plugins

A native plugin is a dynamic library that draws inside the IDE like a built-in plugin: it opens files in an editor tab (the 3D model viewer, Microsoft Office documents) or brings a tool window (the database viewer). It comes as **one file to install**, `<plugin>.atelier-plugin`.

**To install one**, click **Plugins**, then the **Available** tab: it lists the plugins of the [repository of the downloads](https://github.com/atelier-ide-org/releases/releases) that this Atelier can load, with an **Install** button, and **Update** when a newer version is out. A file downloaded by hand (the release `plugins/<plugin>/vX.Y.Z`) installs with **Install a plugin from a file** (the + button). The plugin is installed once, in the IDE, for every project, and turned on; it can still be turned off in a project. Its page has an **Uninstall** button.

A native plugin runs inside the IDE with the rights of the user: only install plugins you trust. Its library is loaded once the plugin is on, never before.

The file is a zip of its manifest and of the library of each system, in a folder named after it:

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

`library` is the name of the library without the prefix and extension of the system, `abi` the version of the plugin interface it was built for. A plugin installed in the IDE goes in its data folder (`plugins/<plugin>/`); a project can also hold one in `.atelier/plugins/<plugin>/`, the same files unzipped.

A native plugin talks to the IDE through a C interface only, the [`atelier-plugin-api`](https://github.com/atelier-ide-org/api) crate: it implements its `Plugin` trait and exports it with `export_plugin!`. It draws with **its own egui**: for each of its surfaces (the preview of a file, a tool window), the IDE sends the input of the frame, and paints the meshes and textures the plugin gives back, with the look, the fonts and the icons of the IDE; a surface may also paint with OpenGL. So a plugin builds alone, with any Rust compiler, and loads in every version of Atelier that reads the version of the interface it was built for (2 since Atelier 0.3). Each plugin has a repository of its own (`plugin-<name>`, also a submodule `plugins/<name>` of the IDE): raising the version of its `Cargo.toml` publishes it as `plugins/<plugin>/vX.Y.Z`.
