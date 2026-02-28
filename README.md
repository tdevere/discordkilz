# Project Hollow 🦡

> A lightweight, open-source voice & video client built on the **Matrix Protocol** — a Discord-alternative that focuses on the one thing Discord still does best: seamless real-time communication.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Matrix](https://img.shields.io/badge/Protocol-Matrix-blue)](https://matrix.org)
[![Built with Tauri](https://img.shields.io/badge/Built%20with-Tauri-blueviolet)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Backend-Rust-orange)](https://www.rust-lang.org)

---

## 🎯 The Vision

Discord is convenient but:
- **Closed-source** and proprietary
- **RAM-heavy** (Electron)
- **Vendor-locked** — your communities, your data, their servers

Project Hollow fills the **"Media Gap"** in the open-source world: delivering a Discord-like experience (voice channels, video, text chat) built entirely on open standards, running natively on your machine with a fraction of the memory footprint.

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Desktop Shell** | [Tauri](https://tauri.app) (Rust + WebView) | Native OS UI, ~10 MB install, minimal RAM vs Electron |
| **Frontend UI** | [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org) | Familiar ecosystem, fast iteration |
| **Backend / Core** | [Rust](https://www.rust-lang.org) | Memory-safe, blazing-fast networking |
| **Chat Protocol** | [Matrix](https://matrix.org) via [matrix-rust-sdk](https://github.com/matrix-org/matrix-rust-sdk) | Federated, E2E-encrypted, open standard |
| **Voice & Video** | [LiveKit](https://livekit.io) / WebRTC | Zero-config voice that *just works* |
| **Bridge Layer** | Modular bridge adapters | Future support for Stoat, Discord, Slack |

---

## 🗺️ MVP Roadmap

### Phase 1 — Foundation (Weeks 1–4)
- [ ] Monorepo scaffold with `apps/desktop`, `apps/web`, `packages/core`
- [ ] Tauri "Hello World" desktop app (React frontend + Rust backend)
- [ ] Matrix SDK integration: login, list rooms, send & receive text messages
- [ ] Basic text channel UI (sidebar room list, message pane)

### Phase 2 — Voice (Weeks 5–8)
- [ ] LiveKit server setup (self-hosted Docker compose)
- [ ] LiveKit Rust SDK integration in `packages/core`
- [ ] Join / leave voice channel UI
- [ ] Working push-to-talk and open-mic voice chat

### Phase 3 — Video & Polish (Weeks 9–12)
- [ ] Camera video streams in voice channels
- [ ] Screen share support
- [ ] User presence indicators (online, idle, DND)
- [ ] Dark / light theme, "Stoat" aesthetic design tokens

### Phase 4 — Bridges (Post-MVP)
- [ ] Stoat bridge adapter
- [ ] Discord bridge adapter (via [mautrix-discord](https://github.com/mautrix/discord))
- [ ] Slack bridge adapter

---

## 📁 Repository Structure

See [`structure.txt`](structure.txt) for the full folder hierarchy.

```
discordkilz/
├── apps/
│   ├── desktop/          # Tauri desktop application
│   └── web/              # Progressive Web App (browser version)
├── packages/
│   ├── core/             # Shared Rust logic (Matrix SDK, LiveKit)
│   ├── ui/               # Shared React component library
│   └── bridges/          # Modular bridge adapters
├── docs/                 # Project documentation
└── infra/                # Docker / deployment configs
```

---

## 🎓 Learning Path (for Non-Developers)

If you are new to development, follow these steps in order. Each step links to free resources and ends with a small, achievable goal.

### Step 1 — Set Up Your Machine (Day 1)
**Goal:** Get the basic tools installed.

1. Install **Git**: https://git-scm.com/downloads
   - Learn: "What is version control?" → [GitHub's free intro](https://docs.github.com/en/get-started/quickstart/hello-world)
2. Install **Node.js** (LTS): https://nodejs.org
   - Test it: open a terminal and run `node --version`
3. Install **Rust**: https://rustup.rs
   - Test it: run `rustc --version`
4. Install **VS Code**: https://code.visualstudio.com
   - Add extensions: *Rust Analyzer*, *Tauri*, *ESLint*

✅ **Checkpoint:** All four commands print a version number.

---

### Step 2 — Understand the Repository (Day 2)
**Goal:** Navigate the monorepo without getting lost.

1. Open a terminal in this folder and run:
   ```bash
   git log --oneline   # See the history of changes
   ```
2. Read `structure.txt` — it maps every folder and its purpose.
3. Read the [Matrix Protocol intro](https://matrix.org/docs/guides/introduction) (15 min read).
4. Watch: [What is Tauri?](https://www.youtube.com/watch?v=OVVfS_XoMuE) (10 min video)

✅ **Checkpoint:** You can explain to someone else what each top-level folder does.

---

### Step 3 — Run "Hello World" (Day 3–4)
**Goal:** Launch the desktop app for the first time.

```bash
# 1. Clone the repo (if you haven't already)
git clone https://github.com/tdevere/discordkilz.git
cd discordkilz

# 2. Install frontend dependencies
cd apps/desktop
npm install

# 3. Start the Tauri development server
npm run tauri dev
```

A native desktop window will open. That window is the shell of Project Hollow.

✅ **Checkpoint:** You see a window that says "Project Hollow – Hello World".

---

### Step 4 — Make Your First Change (Day 5)
**Goal:** Edit the UI and see the change live.

1. Open `apps/desktop/src/App.tsx` in VS Code.
2. Change the heading text from `"Hello World"` to `"Hello, [Your Name]!"`.
3. Save the file — the Tauri window hot-reloads automatically.
4. Commit your change:
   ```bash
   git add .
   git commit -m "feat: personalize hello world"
   ```

✅ **Checkpoint:** Your name appears in the app window and the commit is in `git log`.

---

### Step 5 — Connect to Matrix (Week 2)
**Goal:** Log in to a Matrix account and list your rooms.

1. Create a free Matrix account at https://app.element.io (uses matrix.org homeserver).
2. Read the `packages/core/README.md` (the Rust SDK wrapper).
3. Follow the "Matrix Login" tutorial in `docs/tutorials/matrix-login.md`.

✅ **Checkpoint:** The app displays a list of your real Matrix room names.

---

### Ongoing Resources

| Topic | Resource |
|---|---|
| Rust basics | [The Rust Book](https://doc.rust-lang.org/book/) (free, official) |
| React / TypeScript | [react.dev](https://react.dev) official tutorial |
| Tauri docs | [tauri.app/v2/guides](https://tauri.app/v2/guides/) |
| Matrix spec | [spec.matrix.org](https://spec.matrix.org) |
| LiveKit docs | [docs.livekit.io](https://docs.livekit.io) |
| Git basics | [learngitbranching.js.org](https://learngitbranching.js.org) (interactive) |

---

## 🤝 Contributing

Project Hollow is open to contributors at every skill level.

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Follow the coding standards in [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)
3. Open a Pull Request with a clear description of what you changed and why.

**Good first issues** are labeled [`good first issue`](https://github.com/tdevere/discordkilz/issues?q=label%3A%22good+first+issue%22) in GitHub.

---

## 📜 License

MIT © Project Hollow Contributors. See [LICENSE](LICENSE) for details.
