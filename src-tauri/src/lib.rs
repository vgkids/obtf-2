use std::fs;
use std::sync::Mutex;
use tauri::{Emitter, State, menu::{Menu, PredefinedMenuItem, SubmenuBuilder}};
// use std::io::Read;
use std::path::{Path, PathBuf};
// use std::io::{Seek, SeekFrom};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
struct FileResponse {
    message: String,
}

#[derive(Default)]
struct AppState {
    files_dir: Mutex<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ContentRange {
    start: usize,
    end: usize,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct MediaMatch {
    filename: String,
    position: usize,
    length: usize,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ScanResult {
    matches: Vec<MediaMatch>,
    scanned_range: ContentRange,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct MenuItemConfig {
    id: String,
    title: String,
    shortcut: Option<String>,
    submenu: Option<String>,
}

fn init_app_state() -> AppState {
    AppState {
        files_dir: Mutex::new(String::new()),
    }
}

#[tauri::command]
async fn read_file(filename: String, state: State<'_, AppState>) -> Result<String, String> {
    let files_dir = state.files_dir.lock().unwrap();
    let file_path = PathBuf::from(&*files_dir).join(&filename);

    fs::read_to_string(file_path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn write_file(
    filename: String,
    content: String,
    state: State<'_, AppState>,
) -> Result<FileResponse, String> {
    let files_dir = state.files_dir.lock().unwrap();
    let file_path = PathBuf::from(&*files_dir).join(&filename);

    fs::write(file_path, content).map_err(|e| e.to_string())?;

    Ok(FileResponse {
        message: "File written successfully".into(),
    })
}

#[tauri::command]
async fn update_file(
    filename: String,
    content: String,
    state: State<'_, AppState>,
) -> Result<FileResponse, String> {
    let files_dir = state.files_dir.lock().unwrap();
    let file_path = PathBuf::from(&*files_dir).join(&filename);

    if !file_path.exists() {
        return Err("File not found".into());
    }

    fs::write(file_path, content).map_err(|e| e.to_string())?;

    Ok(FileResponse {
        message: "File updated successfully".into(),
    })
}

#[tauri::command]
async fn delete_file(filename: String, state: State<'_, AppState>) -> Result<FileResponse, String> {
    let files_dir = state.files_dir.lock().unwrap();
    let file_path = PathBuf::from(&*files_dir).join(&filename);

    fs::remove_file(file_path).map_err(|e| e.to_string())?;

    Ok(FileResponse {
        message: "File deleted successfully".into(),
    })
}

#[tauri::command]
async fn list_media(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let files_dir = state.files_dir.lock().unwrap();
    let media_dir = PathBuf::from(&*files_dir).join("media");

    if !media_dir.exists() {
        fs::create_dir_all(&media_dir).map_err(|e| e.to_string())?;
    }

    let entries = fs::read_dir(media_dir).map_err(|e| e.to_string())?;

    let mut files = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            if let Ok(path) = entry.path().into_os_string().into_string() {
                files.push(path);
            }
        }
    }

    Ok(files)
}

#[tauri::command]
async fn move_media(path: String, state: State<'_, AppState>) -> Result<String, String> {
    let files_dir = state.files_dir.lock().unwrap();
    let media_dir = PathBuf::from(&*files_dir).join("media");

    // Ensure media directory exists
    if !media_dir.exists() {
        fs::create_dir_all(&media_dir).map_err(|e| e.to_string())?;
    }

    // Get the filename from the source path
    let file_name = Path::new(&path)
        .file_name()
        .ok_or("Invalid source path")?
        .to_str()
        .ok_or("Invalid filename")?;

    // Create destination path
    let dest_path = media_dir.join(file_name);

    // Move the file
    fs::rename(&path, &dest_path).map_err(|e| e.to_string())?;

    // Return the new path as a string
    dest_path
        .into_os_string()
        .into_string()
        .map_err(|_| "Failed to convert path to string".to_string())
}

#[tauri::command]
async fn scan_content_for_media(
    content: String,
    state: State<'_, AppState>,
) -> Result<ScanResult, String> {
    let files_dir = state.files_dir.lock().unwrap();
    let media_dir = PathBuf::from(&*files_dir).join("media");

    // Get the media files with their full paths
    let entries = fs::read_dir(media_dir).map_err(|e| e.to_string())?;

    // Store tuples of (filename, full_path)
    let media_files: Vec<(String, String)> = entries
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let filename = entry.file_name().into_string().ok()?;
            let full_path = entry.path().into_os_string().into_string().ok()?;
            Some((filename, full_path))
        })
        .collect();

    let content_lower = content.to_lowercase();
    let mut matches = Vec::new();

    for (filename, full_path) in media_files.iter() {
        let filename_lower = filename.to_lowercase();
        let mut start = 0;

        while let Some(pos) = content_lower[start..].find(&filename_lower) {
            matches.push(MediaMatch {
                filename: full_path.clone(),
                position: pos,
                length: filename_lower.len(),
            });
            start = pos + 1;
        }
    }

    Ok(ScanResult {
        matches,
        scanned_range: ContentRange {
            start: 0,
            end: content.len(),
        },
    })
}

#[tauri::command]
async fn set_directory(path: String, state: State<'_, AppState>) -> Result<FileResponse, String> {
    dbg!(&path);

    let mut files_dir = state.files_dir.lock().unwrap();
    *files_dir = path;

    Ok(FileResponse {
        message: "Directory path set successfully".into(),
    })
}

fn build_menu<R: tauri::Runtime>(app: &tauri::AppHandle<R>, menu_items: Vec<MenuItemConfig>) -> tauri::Result<Menu<R>> {
    use std::collections::HashMap;

    let mut submenus: HashMap<String, Vec<tauri::menu::MenuItem<R>>> = HashMap::new();

    for item in menu_items {
        let submenu_name = item.submenu.unwrap_or_else(|| "Edit".to_string());
        let menu_item = tauri::menu::MenuItem::with_id(
            app,
            &item.id,
            &item.title,
            true,
            item.shortcut.as_deref()
        )?;

        submenus.entry(submenu_name)
            .or_insert_with(Vec::new)
            .push(menu_item);
    }

    let menu = Menu::new(app)?;

    // Create Application menu (first position - becomes the app menu on macOS)
    let app_submenu = SubmenuBuilder::new(app, "App")
        .text("about", "About")
        .separator()
        .text("quit", "Quit")
        .build()?;
    menu.append(&app_submenu)?;

    // Handle Edit menu specially to merge predefined and plugin items
    let mut edit_submenu = SubmenuBuilder::new(app, "Edit")
        .item(&PredefinedMenuItem::cut(app, None)?)
        .item(&PredefinedMenuItem::copy(app, None)?)
        .item(&PredefinedMenuItem::paste(app, None)?)
        .separator();

    // Add plugin items to Edit menu if they exist
    if let Some(edit_items) = submenus.remove("Edit") {
        for item in edit_items {
            edit_submenu = edit_submenu.item(&item);
        }
    }

    let edit_menu = edit_submenu.build()?;
    menu.append(&edit_menu)?;

    // Create remaining submenus (excluding Edit since we handled it above)
    for (submenu_name, items) in submenus {
        let submenu = SubmenuBuilder::new(app, &submenu_name);
        let mut submenu_with_items = submenu;
        for item in items {
            submenu_with_items = submenu_with_items.item(&item);
        }
        let built_submenu = submenu_with_items.build()?;
        menu.append(&built_submenu)?;
    }

    Ok(menu)
}

#[tauri::command]
async fn get_menu_items() -> Result<Vec<MenuItemConfig>, String> {
    // This command will be called from the frontend to get plugin-defined menu items
    // The actual implementation will be on the frontend side via JS
    Ok(vec![])
}

#[tauri::command]
async fn set_menu_items(menu_items: Vec<MenuItemConfig>, app: tauri::AppHandle) -> Result<(), String> {
    let menu = build_menu(&app, menu_items).map_err(|e| e.to_string())?;
    app.set_menu(menu).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = init_app_state();

    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_opener::init())
        .setup(|_app| {
            // Menu will be set dynamically from frontend plugins
            Ok(())
        })
        .on_menu_event(|app, event| {
            // Emit all menu events to frontend, plugins will handle them
            let _ = app.emit("menu", event.id().as_ref());
        })
        .invoke_handler(tauri::generate_handler![
            read_file,
            write_file,
            update_file,
            delete_file,
            list_media,
            move_media,
            scan_content_for_media,
            set_directory,
            get_menu_items,
            set_menu_items
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
