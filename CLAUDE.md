# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lynx is a local-first personal AI assistant with a Tauri 2 desktop app connecting to a Node.js server via WebSocket. Phase 0 — basic chat works, no persistence yet (in-memory only).

## Commands

```bash
pnpm install                # Install all dependencies
pnpm dev                    # Run server + desktop in parallel
pnpm dev:server             # Server only (tsx watch, port 3721)
pnpm dev:desktop            # Desktop only (Vite port 1420 + Tauri)
pnpm build                  # Build in order: shared → server → desktop
pnpm lint                   # Biome check
pnpm lint:fix               # Biome check --write (auto-fix)
pnpm test                   # vitest run
```

**Environment**: Copy `apps/server/.env.sample` to `apps/server/.env`, set at least one of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GROQ_API_KEY`.

## Architecture

### Data Flow

```
Desktop (React + Zustand)  ──WebSocket──>  Server (Node.js)  ──Vercel AI SDK──>  LLM Provider
     ChatInput.sendMessage()                  ws.on('message')
     sends { type:'chat' }                    handleChat() → streamText()
                                              streams TokenEvent back
     store appends tokens                     sends MessageDoneEvent on finish
```

- Desktop auto-connects to `ws://localhost:3721/ws` with 2s reconnect
- Server streams tokens individually; client accumulates into full message
- Cancellation via AbortSignal: client sends `{ type: 'cancel' }`, server aborts stream

### Workspace Layout

| Package | Role |
|---------|------|
| `apps/desktop/` | Tauri 2 shell (Rust) + React 19 frontend |
| `apps/server/` | WebSocket server + LLM adapter |
| `packages/shared/` | Protocol types, constants, shared interfaces |
| `packages/tools-sdk/` | `defineTool()` helper for future tool plugins |

### Server (`apps/server/`)

- **Entry**: `src/index.ts` — HTTP + WebSocket server
- **WebSocket handler**: `src/server.ts` — per-connection state, message routing, abort controller
- **LLM adapter**: `src/llm/adapter.ts` — Vercel AI SDK `streamText()` with tool call callbacks (`onToolStart`, `onToolResult`, `onDone`)
- **Provider resolution**: `src/llm/providers.ts` — priority: Anthropic > OpenAI > Groq. Model overridable via env vars (`ANTHROPIC_MODEL`, `OPENAI_MODEL`, `GROQ_MODEL`)
- **Conversation history**: In-memory `Map` with 40-message rolling window (SQLite planned)

### Desktop (`apps/desktop/`)

- **State**: Single Zustand store (`stores/chat-store.ts`) manages WebSocket lifecycle, conversations, messages, streaming state
- **Components**: `TitleBar` (custom window chrome, no OS decorations) → `Sidebar` (conversation list, collapsible) → `ChatView` (messages + input) → `ContextPanel` (system info)
- **Tauri config**: `src-tauri/tauri.conf.json` — 1200x800 window, CSP whitelists `ws://localhost:3721`
- **Path alias**: `@` → `./src`, `@lynx/shared` → `packages/shared/src`
- **Styling**: CSS custom properties in `src/styles/globals.css` — dark-only theme, Geist font family

### Shared Protocol (`packages/shared/src/protocol.ts`)

Client sends: `ChatMessage`, `CancelMessage`, `WidgetActionMessage`
Server sends: `TokenEvent`, `ToolStartEvent`, `ToolResultEvent`, `MessageDoneEvent`, `ErrorEvent`, `StatusEvent`

### Constants (`packages/shared/src/constants.ts`)

`WS_PORT=3721`, `API_PORT=3722`, `DEFAULT_MODEL='claude-sonnet-4-20250514'`, `DEFAULT_PROVIDER='anthropic'`

## Key Conventions

- All packages use ESM (`"type": "module"`) with `verbatimModuleSyntax`
- TypeScript strict mode, `noUnusedLocals`, `noUnusedParameters`
- Linting via Biome (not ESLint/Prettier)
- `packages/shared` is imported as TypeScript source directly (no build step needed for dev)
- Message IDs: desktop uses `crypto.randomUUID()`, server uses `nanoid()`
- Dark theme only — no light mode toggle
- `shamefully-hoist=true` in `.npmrc`
- Node.js >= 22 required (.nvmrc)
