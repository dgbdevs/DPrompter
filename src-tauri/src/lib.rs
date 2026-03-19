use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                if let Ok(Some(monitor)) = window.primary_monitor() {
                    let size = monitor.size();
                    let scale_factor = monitor.scale_factor();
                    
                    let width = (size.width as f64 * 0.5) / scale_factor;
                    let height = 220.0;
                    
                    let x = (size.width as f64 - (width * scale_factor)) / 2.0 / scale_factor;
                    let y = 0.0;

                    let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }));
                    let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }));
                    let _ = window.show();
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
