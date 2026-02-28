//! Core Media Service – Tauri library root.
//!
//! All IPC command handlers live in `commands.rs`; this file only wires
//! them into the Tauri builder and exposes the `run()` entry point that
//! `main.rs` calls.

mod commands;

/// Sets up the Tauri application and registers all IPC command handlers.
/// Called by `main.rs`.
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![commands::create_voice_room])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
