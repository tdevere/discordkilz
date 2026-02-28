import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import VoiceRoom from "./VoiceRoom";

/** Shape returned by the Rust `create_voice_room` command. */
interface VoiceRoomInfo {
  room_name: string;
  host_token: string;
  e2ee_key: string;
  livekit_url: string;
  join_link: string;
}

type AppState = "idle" | "creating" | "connected";

export default function App() {
  const [state, setState] = useState<AppState>("idle");
  const [roomInfo, setRoomInfo] = useState<VoiceRoomInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreateRoom() {
    setState("creating");
    setError(null);
    try {
      const info = await invoke<VoiceRoomInfo>("create_voice_room");
      setRoomInfo(info);
      setState("connected");
    } catch (err) {
      setError(String(err));
      setState("idle");
    }
  }

  function handleLeave() {
    setRoomInfo(null);
    setState("idle");
    setError(null);
  }

  async function handleCopyLink() {
    if (!roomInfo) return;
    await navigator.clipboard.writeText(roomInfo.join_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="app-header">
        <h1>Project Hollow 🦡</h1>
        <p>Core Media Service — Voice Test</p>
      </div>

      {state === "idle" && (
        <div className="card">
          <p style={{ marginBottom: "16px", color: "var(--text-secondary)" }}>
            Click the button below to spin up a local Voice Room. A shareable
            join link will be generated — anyone on your machine can paste it
            into a browser to hear the loopback audio.
          </p>
          <button
            className="btn-primary"
            onClick={handleCreateRoom}
            disabled={state !== "idle"}
          >
            🎙️ Create Voice Room
          </button>
          {error && <p className="error-notice">⚠️ {error}</p>}
        </div>
      )}

      {state === "creating" && (
        <div className="card">
          <p style={{ color: "var(--text-secondary)" }}>Creating room…</p>
        </div>
      )}

      {state === "connected" && roomInfo && (
        <>
          {/* Room info card */}
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <strong>Room: {roomInfo.room_name}</strong>
              <span className="badge badge--e2ee">🔒 E2EE Active</span>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Share this link so others can join:
            </p>
            <div className="link-box">
              <code title={roomInfo.join_link}>{roomInfo.join_link}</code>
              <button className="btn-secondary" onClick={handleCopyLink}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* LiveKit voice room */}
          <VoiceRoom
            livekitUrl={roomInfo.livekit_url}
            token={roomInfo.host_token}
            e2eeKey={roomInfo.e2ee_key}
            onLeave={handleLeave}
          />
        </>
      )}
    </div>
  );
}
