//! Tauri IPC command handlers for the Core Media Service.

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ---------------------------------------------------------------------------
// Dev credentials – matched to infra/docker/livekit/livekit.yaml
// ---------------------------------------------------------------------------
const DEV_API_KEY: &str = "devkey";
const DEV_API_SECRET: &str = "devsecret-change-me-in-production";
// NOTE: Use "wss://" (TLS) and a proper certificate in any non-localhost
// deployment.  "ws://" is only safe when both peers are on the same machine.
const LIVEKIT_URL: &str = "ws://localhost:7880";
const FRONTEND_URL: &str = "http://localhost:5173";

// ---------------------------------------------------------------------------
// JWT payload
// ---------------------------------------------------------------------------

/// LiveKit video grant embedded inside the JWT.
#[derive(Debug, Serialize, Deserialize)]
struct VideoGrant {
    room: String,
    #[serde(rename = "roomCreate")]
    room_create: bool,
    #[serde(rename = "roomJoin")]
    room_join: bool,
    #[serde(rename = "canPublish")]
    can_publish: bool,
    #[serde(rename = "canSubscribe")]
    can_subscribe: bool,
    #[serde(rename = "canPublishData")]
    can_publish_data: bool,
}

/// JWT claims as defined by the LiveKit token format.
#[derive(Debug, Serialize, Deserialize)]
struct LiveKitClaims {
    /// Issuer – the LiveKit API key.
    iss: String,
    /// Subject – the participant identity.
    sub: String,
    /// JWT ID – unique token identifier.
    jti: String,
    /// Not-before (Unix timestamp).
    nbf: u64,
    /// Expiry (Unix timestamp, 1 hour from now).
    exp: u64,
    /// LiveKit-specific video grant.
    video: VideoGrant,
}

// ---------------------------------------------------------------------------
// Public return type
// ---------------------------------------------------------------------------

/// All data the frontend needs to connect and share the room.
#[derive(Debug, Serialize)]
pub struct VoiceRoomInfo {
    /// Short human-readable room identifier.
    pub room_name: String,
    /// Access token for the creator (can publish + create room).
    pub host_token: String,
    /// Base64url-encoded 128-bit AES key used for E2EE.
    /// Travels only in the URL fragment – never sent to the LiveKit server.
    pub e2ee_key: String,
    /// WebSocket URL of the local LiveKit server.
    pub livekit_url: String,
    /// Ready-to-share join link.  The E2EE key is placed in the fragment
    /// (`#`) so browsers never include it in HTTP requests or server logs.
    pub join_link: String,
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/// Generates a URL-safe 128-bit random key encoded as base64url (no padding).
pub(crate) fn generate_e2ee_key() -> String {
    let mut bytes = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut bytes);
    URL_SAFE_NO_PAD.encode(bytes)
}

/// Mints a LiveKit JWT signed with the dev secret.
pub(crate) fn mint_token(room: &str, identity: &str, can_create: bool) -> Result<String, String> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();

    let claims = LiveKitClaims {
        iss: DEV_API_KEY.to_string(),
        sub: identity.to_string(),
        jti: Uuid::new_v4().to_string(),
        nbf: now,
        exp: now + 3600,
        video: VideoGrant {
            room: room.to_string(),
            room_create: can_create,
            room_join: true,
            can_publish: true,
            can_subscribe: true,
            can_publish_data: true,
        },
    };

    let key = EncodingKey::from_secret(DEV_API_SECRET.as_bytes());
    encode(&Header::new(Algorithm::HS256), &claims, &key).map_err(|e| e.to_string())
}

// ---------------------------------------------------------------------------
// Tauri command
// ---------------------------------------------------------------------------

/// Creates a new voice room and returns everything the frontend needs.
///
/// Called from React via `invoke("create_voice_room")`.
#[tauri::command]
pub fn create_voice_room() -> Result<VoiceRoomInfo, String> {
    // Take the first 8 alphanumeric characters of a UUID for a short,
    // unique room name.  chars().take(8) is safe regardless of UUID format.
    let room_name = format!(
        "room-{}",
        Uuid::new_v4()
            .to_string()
            .chars()
            .take(8)
            .collect::<String>()
    );

    // Host token: full privileges including room creation.
    let host_token = mint_token(&room_name, "host", true)?;
    // Guest token: join + publish/subscribe, no room admin rights.
    let guest_token = mint_token(&room_name, "guest", false)?;

    let e2ee_key = generate_e2ee_key();

    // The E2EE key travels as the URL *fragment* so it is never sent to the
    // LiveKit server or recorded in proxy logs.
    let join_link = format!(
        "{}/?room={}&url={}&token={}#key={}",
        FRONTEND_URL,
        urlencoding::encode(&room_name),
        urlencoding::encode(LIVEKIT_URL),
        guest_token,
        e2ee_key,
    );

    Ok(VoiceRoomInfo {
        room_name,
        host_token,
        e2ee_key,
        livekit_url: LIVEKIT_URL.to_string(),
        join_link,
    })
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn e2ee_key_is_non_empty() {
        let key = generate_e2ee_key();
        assert!(!key.is_empty(), "E2EE key must not be empty");
    }

    #[test]
    fn e2ee_key_is_url_safe() {
        let key = generate_e2ee_key();
        assert!(
            key.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_'),
            "E2EE key must only contain URL-safe characters, got: {key}"
        );
    }

    #[test]
    fn mint_token_produces_valid_jwt() {
        let token = mint_token("test-room", "test-user", false)
            .expect("token generation must not fail");
        // A JWT has exactly two '.' separating three base64url sections.
        assert_eq!(token.matches('.').count(), 2, "JWT must have three parts");
    }

    #[test]
    fn create_voice_room_returns_info() {
        let info = create_voice_room().expect("create_voice_room must succeed");
        assert!(info.room_name.starts_with("room-"), "room name prefix");
        assert!(!info.host_token.is_empty(), "host token must not be empty");
        assert!(!info.e2ee_key.is_empty(), "E2EE key must not be empty");
        assert!(
            info.join_link.contains("localhost:5173"),
            "join link must reference the local frontend"
        );
        assert!(
            info.join_link.contains('#'),
            "E2EE key must travel in the URL fragment"
        );
    }
}
