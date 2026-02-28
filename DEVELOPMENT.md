# Project Hollow — Local Voice Test Guide

> **Plain-English walkthrough**: how to run the Core Media Service on your
> own machine and hear yourself talk through the app.

---

## What you are building

You will start two things:

1. **A tiny LiveKit server** (runs inside Docker on your machine) — this is
   the "voice exchange" that routes encrypted audio between participants.
2. **The Project Hollow client app** (Tauri desktop window + React frontend)
   — this is the app you click a button in.

The whole thing stays 100% local.  Nothing is sent to the internet.

---

## Prerequisites

Install these tools before you start.  Each link goes to the official
download page.

| Tool | Why you need it | Check you have it |
|---|---|---|
| [Git](https://git-scm.com/downloads) | Clone this repo | `git --version` |
| [Node.js ≥ 18 LTS](https://nodejs.org) | Build the React frontend | `node --version` |
| [Rust (stable)](https://rustup.rs) | Compile the Tauri backend | `rustc --version` |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Run the LiveKit server | `docker --version` |

On **Linux** you also need a few system libraries that Tauri requires:

```bash
# Debian / Ubuntu
sudo apt update && sudo apt install -y \
  libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev

# Fedora / RHEL
sudo dnf install -y webkit2gtk4.1-devel openssl-devel curl wget \
  libxdo-devel librsvg2-devel
```

---

## Step 1 — Start the LiveKit voice server

Open a terminal and run:

```bash
cd infra/docker/livekit
docker compose up -d
```

You should see Docker pull the `livekit/livekit-server` image (only on the
first run) and then start the container.  Verify it is running:

```bash
docker compose ps
# You should see a row with "Up" in the Status column.
```

The server now listens on **`ws://localhost:7880`**.

> **Tip:** To stop the server later run `docker compose down` from the same
> folder.

---

## Step 2 — Install frontend dependencies

Open a **new** terminal (keep the Docker one open), then:

```bash
cd packages/client
npm install
```

This downloads React, the LiveKit client SDK, and all other JavaScript
dependencies into `node_modules/`.  It takes about 30–60 seconds the first
time.

---

## Step 3 — Start the Tauri development app

From the same `packages/client/` directory:

```bash
npm run tauri dev
```

Tauri will:

1. Start the Vite dev server (React hot-reload) on `http://localhost:5173`.
2. Compile the Rust backend (first compile takes 1–3 minutes).
3. Open a native desktop window titled **"Project Hollow – Voice Test"**.

You will know it worked when you see the window with the
**"🎙️ Create Voice Room"** button.

---

## Step 4 — Create a Voice Room

1. Click **"🎙️ Create Voice Room"** in the desktop window.
2. The Rust backend will:
   - Generate a unique room name (e.g. `room-3f8a1b2c`).
   - Create two LiveKit access tokens (one for you as host, one for guests).
   - Generate a random 128-bit **end-to-end encryption (E2EE) key**.
3. The UI will show:
   - A **🔒 E2EE Active** badge confirming encryption is on.
   - A **join link** you can copy and share.
   - Your microphone in the participant list (🎙️ = active, 🔇 = muted).

---

## Step 5 — Hear yourself talk (loopback test)

The app automatically enables your microphone and **plays back your own
audio** so you can confirm it works without a second device.

- Speak into your microphone — you should hear yourself in your headphones
  or speakers after a small delay (this is the encrypted audio round-trip
  through the local LiveKit server).
- Click **🔇 Mute** to stop sending audio.
- Click **📵 Leave Room** to disconnect and return to the start screen.

> **Loopback tip:** if you hear feedback/echo, plug in headphones.  The
> echo happens because your speakers feed back into your microphone.

---

## Step 6 — Test the join link with a second window

To verify the join link works:

1. Click **Copy** next to the join link.
2. Open a browser tab (or the app a second time) and paste the link.
3. Both windows should appear in each other's participant list and share the
   encrypted audio stream.

The E2EE key travels only in the **`#fragment`** part of the URL.
Browsers never send the fragment to any server, so the key never touches
the LiveKit server — audio is encrypted before it leaves your machine.

---

## How end-to-end encryption works (plain English)

```
Your mic → [AES-GCM encrypt with shared key] → LiveKit server → [AES-GCM decrypt] → Speaker
              ↑                                                       ↑
          Rust generates random key               Same key from URL fragment
          (never leaves your machine)
```

1. The Rust backend generates a random 128-bit key and base64-encodes it.
2. The key is placed in the **URL fragment** (`#key=…`) of the join link —
   fragments are never transmitted in HTTP requests.
3. The LiveKit JavaScript SDK encrypts every audio packet inside a Web Worker
   using **AES-GCM** before it is sent over the network.
4. Any participant who has the key (i.e. anyone with the join link) can
   decrypt and hear the audio.
5. The LiveKit server itself only sees ciphertext — it cannot listen in.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Connection refused" when creating room | Make sure `docker compose up -d` succeeded and the server is on port 7880 |
| Rust compile errors on first `tauri dev` | Run `rustup update stable` to get the latest Rust toolchain |
| No audio in the loopback | Check your OS microphone permissions; the browser/WebView needs mic access |
| `npm install` fails | Make sure you are running Node.js ≥ 18 (`node --version`) |
| White screen in Tauri window | Check the terminal for Vite errors; often a missing `npm install` |

---

## File map

```
packages/client/
├── src/                    ← React / TypeScript frontend
│   ├── App.tsx             ← "Create Voice Room" button + room info display
│   ├── VoiceRoom.tsx       ← LiveKit connection + E2EE logic
│   └── index.css           ← Dark-theme styles
└── src-tauri/
    └── src/
        └── lib.rs          ← Rust: JWT token generation + E2EE key derivation

infra/docker/livekit/
├── docker-compose.yml      ← Spin up a local LiveKit server with one command
└── livekit.yaml            ← LiveKit configuration (dev keys, ports, etc.)
```

---

## Changing the LiveKit server address

By default everything points to `ws://localhost:7880`.  To use a remote or
staging LiveKit server:

1. Update `LIVEKIT_URL` and `FRONTEND_URL` constants in
   `packages/client/src-tauri/src/lib.rs`.
2. Update `DEV_API_KEY` / `DEV_API_SECRET` to match your server's credentials.
3. Re-run `npm run tauri dev`.

> **Security reminder:** Never commit real API secrets to version control.
> Use environment variables or a secrets manager for anything beyond local dev.
