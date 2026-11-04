<script setup>
const modules = [
  { path: "abi", desc: "The C interface itself: `#[repr(C)]` data and `extern \"C\"` functions, depends on nothing" },
  { path: "protocol", desc: "The messages of `call`: a method name, JSON in and out (feature `serde`)" },
  { path: "runtime", desc: "`Plugin`, `Host`, `Surface` and `export_plugin!`: a plugin that draws with egui (feature `egui`, on by default)" },
  { path: "ui", desc: "The look of the IDE: its colors, fonts, icons and widgets, the same code as the IDE's" },
  { path: "gl", desc: "OpenGL in a surface, with the context of the IDE (feature `glow`)" },
  { path: "Locales", desc: "The texts of a plugin in each language, with English as fallback" },
]

const life = [
  { title: "The IDE loads the library", text: "once the plugin is on, never before. It reads the `ATELIER_PLUGIN_V2` symbol and refuses a library of another `abi`." },
  { title: "`create`", text: "makes the plugin with what `export_plugin!` was given, and the `Host` it may call from any thread." },
  { title: "`info(language)`", text: "what it brings: tool windows, commands, file types and icons, in the language of the IDE. Asked again when the language changes." },
  { title: "Every frame: `update`, then `ui` for each surface shown", text: "a preview of a file or a tool window. A surface not drawn between two updates is hidden." },
  { title: "`run_command`, `file_closed`", text: "when a command of the plugin is chosen, and when the last tab of one of its files closes." },
  { title: "`destroy`", text: "when the plugin is turned off or uninstalled." },
]
</script>

# Plugin API

A native plugin talks to Atelier through **[`atelier-plugin-api`](https://github.com/atelier-ide-org/api)**, a crate of its own: the IDE and the plugin share only C types and functions, so a plugin built once loads in every version of Atelier that keeps the version of the interface it was built for (**2** since Atelier 0.3), whatever compiler and crates each side was built with.

The easiest start is [`atelier-cli plugin create`](./atelier-cli), which writes a plugin that already uses everything on this page.

## The crate

```toml
[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
atelier-plugin-api = { git = "https://github.com/atelier-ide-org/api", tag = "v0.4.0" }
```

<FileTree root="atelier_plugin_api" :files="modules" />

| Feature | Brings |
| --- | --- |
| `egui` (default) | `runtime` and `ui`: a plugin that draws with **its own egui** (0.33), whatever egui the IDE uses |
| `serde` | `protocol` alone, as the IDE reads it |
| `glow` | `gl`: OpenGL callbacks in a surface |

## A plugin

A plugin implements the `Plugin` trait and exports it. Every method has a default: it implements what it uses.

```rust
use atelier_plugin_api::{Host, Plugin, Surface, egui, protocol, ui};

const WINDOW: &str = "my-viewer.window";

#[derive(Default)]
pub struct MyViewerPlugin {
    clicks: u32,
}

atelier_plugin_api::export_plugin!(MyViewerPlugin::default);

impl Plugin for MyViewerPlugin {
    fn info(&mut self, language: &str) -> protocol::Info {
        protocol::Info {
            tool_windows: vec![protocol::ToolWindow {
                id: WINDOW.into(),
                title: "My viewer".into(),
                icon: "settings".into(), // an icon of the IDE, or of `icons`
                dock: protocol::Dock::Right,
            }],
            commands: vec![protocol::Command { id: "my-viewer.open".into(), label: "Open My viewer".into() }],
            file_types: vec![protocol::FileType { extensions: vec!["glb".into()], binary: true, ..Default::default() }],
            ..Default::default()
        }
    }

    fn ui(&mut self, ui: &mut egui::Ui, surface: Surface<'_>, host: &Host) {
        match surface {
            Surface::ToolWindow(WINDOW) => {
                ui::section(ui, "My viewer");
                if ui::primary_button(ui, "Hello").clicked() {
                    self.clicks += 1;
                    host.notify(format!("Hello {}", self.clicks));
                }
            }
            Surface::Preview(path) => {
                ui.label(path.display().to_string());
            }
            Surface::ToolWindow(_) => {}
        }
    }

    fn run_command(&mut self, id: &str, host: &Host) {
        if id == "my-viewer.open" {
            host.show_tool_window(WINDOW);
        }
    }
}
```

The extensions of `file_types` are also those of `extensions` in its [`plugin.json`](/plugins/#native-plugins): the IDE reads the manifest to know which files a plugin opens before it loads it.

## Its life

<Steps :steps="life" />

## `Plugin`

| Method | Called |
| --- | --- |
| `info(&mut self, language) -> protocol::Info` | when the plugin starts, and when the language of the IDE changes (`en_US`, `fr_FR`) |
| `ui(&mut self, ui, surface, host)` | to draw a surface: `Surface::Preview(path)`, the view of a file in an editor tab, or `Surface::ToolWindow(id)`. Windows and menus may go anywhere in the window of the IDE |
| `update(&mut self, update, host)` | every frame of the IDE, before it draws, even when nothing of the plugin is shown: background work. `update.open_files` lists the files of the tabs |
| `run_command(&mut self, id, host)` | a command of `info().commands` was chosen, in the palette or the Plugins menu |
| `file_closed(&mut self, path)` | the last tab of a file closed: what the plugin kept for it goes |

## `Host`

What the plugin asks the IDE. It may be kept and called from any thread.

| Method | Does |
| --- | --- |
| `notify(message)` | a message kept in the notifications of the IDE |
| `error(message)` | the same, shown in a balloon too |
| `open_file(path)` | opens a file in an editor tab |
| `show_tool_window(id)` | shows one of the tool windows of the plugin |
| `project() -> protocol::Project` | the folder of the open project (`None` on the start screen), the active file, and `data_dir` |
| `data_dir()` | the folder of the settings of the IDE: a plugin keeps its own under `plugins/<id>/` |
| `request_repaint()` | asks for a new frame, when a background task is done |
| `call(method, bytes)`, `call_json(method, input)` | any method of the protocol, by name |

## `protocol::Info`

| Field | |
| --- | --- |
| `tool_windows` | `id` (start it with the id of the plugin), `title`, `icon`, `dock`: `Left`, `Bottom` or `Right` |
| `commands` | `id` and `label`: in the palette and the Plugins menu |
| `file_types` | `extensions` (lowercase, without the dot), `layout` (`Text`, `Split`, `Preview`), `binary` (opens without being read), `layout_switch`, `icon` |
| `icons` | SVG icons the other fields name: `name`, `svg`, `svg_dark` |

A field the other side does not know is ignored, a missing one takes its default, and a method one side does not know answers nothing: both can add to the protocol without a new version of the interface.

## The look of the IDE

`ui` draws like the IDE, with the same code: 13 px text, 16 px icons, 24 px rows, 4 to 8 px corners, and the colors of the current theme.

| | |
| --- | --- |
| Colors and fonts | `ui::theme(ctx)` (the `protocol::Theme` of the IDE: `frame`, `island`, `accent`, `text`…), `ui::semibold(size)`, `ui::language(ctx)` |
| Icons | `ui::icon(ui, "run")` (an icon of the IDE, drawn by it), `ui::register_icon(name, svg, svg_dark)` for its own, `ui::svg(ui, key, svg, size)` |
| Buttons | `primary_button`, `button`, `icon_button`, `icon_toggle`, `icon_text_button` |
| Fields | `checkbox`, `check_state`, `radio`, `radio_value`, `search_field` |
| Lists and trees | `row`, `paint_row`, `paint_chevron`, `paint_text`, `paint_badge` |
| Titles and dialogs | `section`, `dialog_title`, `dialog_buttons` (Enter confirms, Escape cancels) |

A surface may also paint with **OpenGL** (feature `glow`): `gl::paint_callback(rect, |info, gl| …)` is called with the OpenGL context of the IDE; the 3D Model Viewer draws that way.

## Texts

A plugin reads its own `locales/<identifier>.json` (`en_US`, `fr_FR`) into a `Locales`: `get(language, key)` gives the text, the English one when the language lacks it, else the key; `format` replaces each `{name}` by its value. The template of `atelier-cli` wraps it in `tr!` and `trf!`, as in the IDE.

## Under it: the C interface

`abi` is the contract itself, which a plugin in another language than Rust could implement. The library exports a `PluginApi` under `ATELIER_PLUGIN_V2`: `abi`, `size`, and the functions `create`, `destroy`, `call`, `free`, `frame` and `paint`. Strings are UTF-8, as pointer and length, valid for the time of the call; what one side allocates, it frees; a panic never crosses the interface. Structures only grow at their end, each starting with its `size`: a new field does not need a new version.
