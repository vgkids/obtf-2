use tauri::State;
use std::sync::Mutex;
use std::fs;
use std::path::PathBuf;
use serde::{Serialize};

#[derive(Debug, Serialize)]
struct FileResponse {
    message: String,
}

#[derive(Default)]
struct AppState {
    files_dir: Mutex<String>,
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

    fs::read_to_string(file_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn write_file(filename: String, content: String, state: State<'_, AppState>) -> Result<FileResponse, String> {
    let files_dir = state.files_dir.lock().unwrap();
    let file_path = PathBuf::from(&*files_dir).join(&filename);

    fs::write(file_path, content)
        .map_err(|e| e.to_string())?;

    Ok(FileResponse {
        message: "File written successfully".into()
    })
}

#[tauri::command]
async fn update_file(filename: String, content: String, state: State<'_, AppState>) -> Result<FileResponse, String> {
    let files_dir = state.files_dir.lock().unwrap();
    let file_path = PathBuf::from(&*files_dir).join(&filename);

    if !file_path.exists() {
        return Err("File not found".into());
    }

    fs::write(file_path, content)
        .map_err(|e| e.to_string())?;

    Ok(FileResponse {
        message: "File updated successfully".into()
    })
}

#[tauri::command]
async fn delete_file(filename: String, state: State<'_, AppState>) -> Result<FileResponse, String> {
    let files_dir = state.files_dir.lock().unwrap();
    let file_path = PathBuf::from(&*files_dir).join(&filename);

    fs::remove_file(file_path)
        .map_err(|e| e.to_string())?;

    Ok(FileResponse {
        message: "File deleted successfully".into()
    })
}

#[tauri::command]
async fn list_media(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let files_dir = state.files_dir.lock().unwrap();
    let media_dir = PathBuf::from(&*files_dir).join("media");

    if !media_dir.exists() {
        fs::create_dir_all(&media_dir).map_err(|e| e.to_string())?;
    }

    let entries = fs::read_dir(media_dir)
        .map_err(|e| e.to_string())?;

    let mut files = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            if let Ok(filename) = entry.file_name().into_string() {
                files.push(filename);
            }
        }
    }

    Ok(files)
}

#[tauri::command]
async fn set_directory(path: String, state: State<'_, AppState>) -> Result<FileResponse, String> {

    dbg!(&path);

    let mut files_dir = state.files_dir.lock().unwrap();
    *files_dir = path;

    Ok(FileResponse {
        message: "Directory path set successfully".into()
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = init_app_state();

    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            read_file,
            write_file,
            update_file,
            delete_file,
            list_media,
            set_directory
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
