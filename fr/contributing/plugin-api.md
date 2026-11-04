<script setup>
const modules = [
  { path: "abi", desc: "L'interface C elle-même : données `#[repr(C)]` et fonctions `extern \"C\"`, ne dépend de rien" },
  { path: "protocol", desc: "Les messages de `call` : un nom de méthode, du JSON en entrée et en sortie (feature `serde`)" },
  { path: "runtime", desc: "`Plugin`, `Host`, `Surface` et `export_plugin!` : un plugin qui dessine avec egui (feature `egui`, par défaut)" },
  { path: "ui", desc: "L'apparence de l'IDE : ses couleurs, polices, icônes et widgets, le même code que celui de l'IDE" },
  { path: "gl", desc: "OpenGL dans une surface, avec le contexte de l'IDE (feature `glow`)" },
  { path: "Locales", desc: "Les textes d'un plugin dans chaque langue, avec l'anglais par défaut" },
]

const life = [
  { title: "L'IDE charge la bibliothèque", text: "une fois le plugin activé, jamais avant. Il lit le symbole `ATELIER_PLUGIN_V2` et refuse une bibliothèque d'un autre `abi`." },
  { title: "`create`", text: "crée le plugin avec ce qu'a reçu `export_plugin!`, et le `Host` qu'il peut appeler depuis n'importe quel thread." },
  { title: "`info(language)`", text: "ce qu'il apporte : fenêtres d'outils, commandes, types de fichiers et icônes, dans la langue de l'IDE. Redemandé quand la langue change." },
  { title: "À chaque image : `update`, puis `ui` pour chaque surface affichée", text: "l'aperçu d'un fichier ou une fenêtre d'outils. Une surface non dessinée entre deux `update` est masquée." },
  { title: "`run_command`, `file_closed`", text: "quand une commande du plugin est choisie, et quand le dernier onglet d'un de ses fichiers se ferme." },
  { title: "`destroy`", text: "quand le plugin est désactivé ou désinstallé." },
]
</script>

# API des plugins

Un plugin natif parle à Atelier au travers d'**[`atelier-plugin-api`](https://github.com/atelier-ide-org/api)**, un crate à part : l'IDE et le plugin ne partagent que des types et des fonctions C, donc un plugin compilé une fois se charge dans toutes les versions d'Atelier qui gardent la version de l'interface pour laquelle il a été compilé (**2** depuis Atelier 0.3), quels que soient le compilateur et les crates de chaque côté.

Le plus simple pour commencer est [`atelier-cli plugin create`](./atelier-cli), qui écrit un plugin utilisant déjà tout ce qui est sur cette page.

## Le crate

```toml
[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
atelier-plugin-api = { git = "https://github.com/atelier-ide-org/api", tag = "v0.4.0" }
```

<FileTree root="atelier_plugin_api" :files="modules" />

| Feature | Apporte |
| --- | --- |
| `egui` (par défaut) | `runtime` et `ui` : un plugin qui dessine avec **son propre egui** (0.33), quel que soit celui de l'IDE |
| `serde` | `protocol` seul, tel que l'IDE le lit |
| `glow` | `gl` : des callbacks OpenGL dans une surface |

## Un plugin

Un plugin implémente le trait `Plugin` et l'exporte. Chaque méthode a une valeur par défaut : il implémente ce dont il se sert.

```rust
use atelier_plugin_api::{Host, Plugin, Surface, egui, protocol, ui};

const WINDOW: &str = "ma-visionneuse.window";

#[derive(Default)]
pub struct MaVisionneusePlugin {
    clicks: u32,
}

atelier_plugin_api::export_plugin!(MaVisionneusePlugin::default);

impl Plugin for MaVisionneusePlugin {
    fn info(&mut self, language: &str) -> protocol::Info {
        protocol::Info {
            tool_windows: vec![protocol::ToolWindow {
                id: WINDOW.into(),
                title: "Ma visionneuse".into(),
                icon: "settings".into(), // une icône de l'IDE, ou de `icons`
                dock: protocol::Dock::Right,
            }],
            commands: vec![protocol::Command { id: "ma-visionneuse.open".into(), label: "Ouvrir Ma visionneuse".into() }],
            file_types: vec![protocol::FileType { extensions: vec!["glb".into()], binary: true, ..Default::default() }],
            ..Default::default()
        }
    }

    fn ui(&mut self, ui: &mut egui::Ui, surface: Surface<'_>, host: &Host) {
        match surface {
            Surface::ToolWindow(WINDOW) => {
                ui::section(ui, "Ma visionneuse");
                if ui::primary_button(ui, "Bonjour").clicked() {
                    self.clicks += 1;
                    host.notify(format!("Bonjour {}", self.clicks));
                }
            }
            Surface::Preview(path) => {
                ui.label(path.display().to_string());
            }
            Surface::ToolWindow(_) => {}
        }
    }

    fn run_command(&mut self, id: &str, host: &Host) {
        if id == "ma-visionneuse.open" {
            host.show_tool_window(WINDOW);
        }
    }
}
```

Les extensions de `file_types` sont aussi celles de `extensions` dans son [`plugin.json`](/fr/plugins/#plugins-natifs) : l'IDE lit le manifeste pour savoir quels fichiers un plugin ouvre avant de le charger.

## Sa vie

<Steps :steps="life" />

## `Plugin`

| Méthode | Appelée |
| --- | --- |
| `info(&mut self, language) -> protocol::Info` | au démarrage du plugin, et quand la langue de l'IDE change (`en_US`, `fr_FR`) |
| `ui(&mut self, ui, surface, host)` | pour dessiner une surface : `Surface::Preview(path)`, la vue d'un fichier dans un onglet, ou `Surface::ToolWindow(id)`. Fenêtres et menus peuvent aller n'importe où dans la fenêtre de l'IDE |
| `update(&mut self, update, host)` | à chaque image de l'IDE, avant qu'il dessine, même quand rien du plugin n'est affiché : le travail de fond. `update.open_files` liste les fichiers des onglets |
| `run_command(&mut self, id, host)` | une commande de `info().commands` a été choisie, dans la palette ou le menu Plugins |
| `file_closed(&mut self, path)` | le dernier onglet d'un fichier s'est fermé : ce que le plugin gardait pour lui s'en va |

## `Host`

Ce que le plugin demande à l'IDE. Il peut être gardé et appelé depuis n'importe quel thread.

| Méthode | Fait |
| --- | --- |
| `notify(message)` | un message gardé dans les notifications de l'IDE |
| `error(message)` | la même chose, affichée aussi dans une bulle |
| `open_file(path)` | ouvre un fichier dans un onglet |
| `show_tool_window(id)` | affiche une des fenêtres d'outils du plugin |
| `project() -> protocol::Project` | le dossier du projet ouvert (`None` sur l'écran d'accueil), le fichier actif, et `data_dir` |
| `data_dir()` | le dossier des réglages de l'IDE : un plugin garde les siens sous `plugins/<id>/` |
| `request_repaint()` | demande une nouvelle image, quand une tâche de fond est finie |
| `call(method, bytes)`, `call_json(method, input)` | n'importe quelle méthode du protocole, par son nom |

## `protocol::Info`

| Champ | |
| --- | --- |
| `tool_windows` | `id` (commencez-le par l'id du plugin), `title`, `icon`, `dock` : `Left`, `Bottom` ou `Right` |
| `commands` | `id` et `label` : dans la palette et le menu Plugins |
| `file_types` | `extensions` (en minuscules, sans le point), `layout` (`Text`, `Split`, `Preview`), `binary` (s'ouvre sans être lu), `layout_switch`, `icon` |
| `icons` | les icônes SVG que nomment les autres champs : `name`, `svg`, `svg_dark` |

Un champ que l'autre côté ne connaît pas est ignoré, un champ absent prend sa valeur par défaut, et une méthode qu'un côté ne connaît pas ne répond rien : les deux peuvent enrichir le protocole sans nouvelle version de l'interface.

## L'apparence de l'IDE

`ui` dessine comme l'IDE, avec le même code : texte de 13 px, icônes de 16 px, lignes de 24 px, coins de 4 à 8 px, et les couleurs du thème courant.

| | |
| --- | --- |
| Couleurs et polices | `ui::theme(ctx)` (le `protocol::Theme` de l'IDE : `frame`, `island`, `accent`, `text`…), `ui::semibold(size)`, `ui::language(ctx)` |
| Icônes | `ui::icon(ui, "run")` (une icône de l'IDE, dessinée par lui), `ui::register_icon(name, svg, svg_dark)` pour les siennes, `ui::svg(ui, key, svg, size)` |
| Boutons | `primary_button`, `button`, `icon_button`, `icon_toggle`, `icon_text_button` |
| Champs | `checkbox`, `check_state`, `radio`, `radio_value`, `search_field` |
| Listes et arbres | `row`, `paint_row`, `paint_chevron`, `paint_text`, `paint_badge` |
| Titres et dialogues | `section`, `dialog_title`, `dialog_buttons` (Entrée confirme, Échap annule) |

Une surface peut aussi peindre en **OpenGL** (feature `glow`) : `gl::paint_callback(rect, |info, gl| …)` est appelé avec le contexte OpenGL de l'IDE ; la Visionneuse de modèles 3D dessine ainsi.

## Les textes

Un plugin lit ses propres `locales/<identifiant>.json` (`en_US`, `fr_FR`) dans un `Locales` : `get(language, key)` donne le texte, l'anglais quand la langue ne l'a pas, sinon la clé ; `format` remplace chaque `{nom}` par sa valeur. Le modèle d'`atelier-cli` l'enveloppe dans `tr!` et `trf!`, comme dans l'IDE.

## En dessous : l'interface C

`abi` est le contrat lui-même, qu'un plugin écrit dans un autre langage que Rust pourrait implémenter. La bibliothèque exporte une `PluginApi` sous `ATELIER_PLUGIN_V2` : `abi`, `size`, et les fonctions `create`, `destroy`, `call`, `free`, `frame` et `paint`. Les chaînes sont en UTF-8, en pointeur et longueur, valides le temps de l'appel ; ce qu'un côté alloue, il le libère ; une panique ne traverse jamais l'interface. Les structures ne grandissent qu'à leur fin, chacune commençant par sa `size` : un nouveau champ n'a pas besoin d'une nouvelle version.
