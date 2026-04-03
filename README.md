# Lynx

> Local-first personal AI assistant — ChatGPT-level intelligence, running on your desktop, aware of your context, with tools to actually get things done.

<p align="center">
  <img src="https://img.shields.io/badge/status-Phase%200-blue" alt="Status" />
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey" alt="Platform" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

## What is Lynx?

Lynx is a desktop AI assistant built with **Tauri 2 + React + Node.js**. Unlike cloud-based chatbots, Lynx runs locally, remembers your context across sessions, and can execute real actions on your system.

| vs. | Lynx Advantage |
|-----|----------------|
| ChatGPT / Claude Web | Runs locally, system-aware, tool execution, persistent memory |
| Apple Siri / Cortana | Open source, LLM-powered reasoning, extensible plugins |
| Open Interpreter | Desktop-native UI, sandboxed execution, non-technical user friendly |
| Jan.ai / LM Studio | Full assistant with tools, memory, and context awareness |

## Features

- **Multi-provider LLM** — Anthropic, OpenAI, Groq, or local models via llama.cpp
- **Streaming chat** — Token-by-token streaming over WebSocket
- **Native tool calling** — LLM calls tools in a single inference pass, no routing pipeline
- **Context awareness** — System info, datetime, user profile injected into prompts
- **Long-term memory** — SQLite + vector search for semantic recall (planned)
- **Agent mode** — ReAct-style multi-step reasoning for complex tasks (planned)
- **Plugin system** — Sandboxed third-party extensions (planned)
- **Privacy first** — No data leaves your machine unless you configure a remote provider

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop Shell | Tauri 2 (Rust) |
| Frontend | React 19, Vite, Tailwind CSS v4, Zustand |
| Server | Node.js 22+, WebSocket (`ws`) |
| LLM | Vercel AI SDK — Anthropic, OpenAI, Groq |
| Database | SQLite (better-sqlite3) |
| Monorepo | pnpm workspaces |
| Linting | Biome |

## Project Structure

```
lynx/
├── apps/
│   ├── desktop/          # Tauri 2 shell + React frontend
│   └── server/           # Node.js WebSocket server + LLM adapter
├── packages/
│   ├── shared/           # Protocol types, constants
│   └── tools-sdk/        # Tool definition helpers
└── docs/
    └── PRD.md            # Product requirements & roadmap
```

## Quick Start

### Prerequisites

- **Node.js** >= 22 (see `.nvmrc`)
- **pnpm** >= 9
- **Rust** (for Tauri — [install](https://www.rust-lang.org/tools/install))

### Setup

```bash
# Clone
git clone https://github.com/sheridiany/lynx.git
cd lynx

# Install dependencies
pnpm install

# Configure environment
cp apps/server/.env.sample apps/server/.env
# Edit .env — set at least one API key:
#   ANTHROPIC_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY

# Run (server + desktop in parallel)
pnpm dev
```

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run server + desktop in parallel |
| `pnpm dev:server` | Server only (tsx watch, port 3721) |
| `pnpm dev:desktop` | Desktop only (Vite 1420 + Tauri) |
| `pnpm build` | Build all packages in order |
| `pnpm lint` | Biome check |
| `pnpm lint:fix` | Biome auto-fix |
| `pnpm test` | Vitest run |

## Architecture

```
Desktop (React + Zustand)  ──WebSocket──>  Server (Node.js)  ──AI SDK──>  LLM Provider
     ChatInput                               handleChat()
     sends { type:'chat' }                   streamText()
                                             streams tokens back
     Zustand accumulates                     sends MessageDoneEvent
```

- Desktop auto-connects to `ws://localhost:3721/ws` with 2s reconnect
- Server streams tokens individually; client accumulates into full message
- Cancellation: client sends `{ type: 'cancel' }`, server aborts via AbortSignal

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 0** — Foundation | **In Progress** | Streaming chat, multi-provider, conversation UI |
| **Phase 1** — Core Intelligence | Planned | Tool system, file/system tools, context awareness |
| **Phase 2** — Knowledge & Memory | Planned | SQLite persistence, vector memory, persona system |
| **Phase 3** — Agent & Tools | Planned | ReAct agent, widget system, advanced tools |
| **Phase 4** — Polish & Plugins | Planned | Plugin sandbox, MCP integration, production release |
| **Phase 5** — Voice & Beyond | Planned | Voice I/O, multi-modal, automation |

See [docs/PRD.md](docs/PRD.md) for the full product requirements document.

## License

MIT
