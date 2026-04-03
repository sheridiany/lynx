# Lynx - Personal AI Assistant

## Product Requirements Document & Development Roadmap

> Version: 1.0 Draft
> Date: 2026-04-03
> Status: Planning

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Product Principles](#4-product-principles)
5. [System Architecture](#5-system-architecture)
6. [Core Features](#6-core-features)
7. [Technical Specifications](#7-technical-specifications)
8. [UI/UX Design Specification](#8-uiux-design-specification)
9. [Data Architecture](#9-data-architecture)
10. [Security & Privacy](#10-security--privacy)
11. [Performance Requirements](#11-performance-requirements)
12. [Development Roadmap](#12-development-roadmap)
13. [Risk Assessment](#13-risk-assessment)
14. [Success Metrics](#14-success-metrics)

---

## 1. Product Vision

**Lynx** is a local-first, privacy-respecting personal AI assistant that runs as a desktop application. It combines the conversational intelligence of modern LLMs with structured tool execution, long-term memory, and deep system awareness to become a true digital companion — not just a chatbot.

**One-liner**: ChatGPT-level intelligence, running on your desktop, aware of your context, with tools to actually get things done.

**Key Differentiators vs. Existing Solutions**:

| vs. | Lynx Advantage |
|-----|----------------|
| ChatGPT/Claude Web | Runs locally, system-aware, tool execution, persistent memory across sessions |
| Leon AI 2.0 | Single runtime (no Python TCP bridge), native tool calling (no 4-step pipeline), modern UI |
| Apple Siri / Cortana | Open source, LLM-powered deep reasoning, extensible plugin system |
| Open Interpreter | Desktop-native UI, sandboxed execution, long-term memory, non-technical user friendly |
| Jan.ai / LM Studio | Not just inference — full assistant with tools, memory, and context awareness |

---

## 2. Problem Statement

### User Pain Points

1. **Fragmented AI tools** — Users switch between ChatGPT, local LLMs, and various automation tools. No unified experience.
2. **No persistent context** — Cloud AI forgets everything between sessions. Users repeat themselves.
3. **No system awareness** — Existing assistants don't know your file system, running apps, schedule, or habits.
4. **No real action** — Chat-based AI can talk but can't do. Users still manually execute suggested actions.
5. **Privacy concerns** — Sensitive data (files, habits, conversations) sent to cloud services without control.

### Opportunity

Build a desktop-native AI assistant that:
- Remembers everything (with user consent)
- Understands user's context (system, files, habits, preferences)
- Actually executes actions (file operations, web search, API calls, automation)
- Works with any LLM (local or remote, user's choice)
- Looks and feels like a premium product, not a developer tool

---

## 3. Target Users

### Primary Persona: Power User / Knowledge Worker

- **Age**: 22-45
- **Technical level**: Comfortable with software, not necessarily a developer
- **Daily tools**: Browser, IDE, Notion/Obsidian, Terminal, Slack/Discord
- **Pain**: Repetitive tasks, information scattered across tools, wants AI that "just works"
- **Goal**: A single assistant that helps with research, writing, file management, task tracking, and daily automation

### Secondary Persona: Developer

- **Technical level**: High
- **Pain**: Wants an open-source, extensible, local-first AI tool they can customize
- **Goal**: Build custom tools/plugins, integrate with dev workflows, run local models

### Tertiary Persona: Privacy-Conscious User

- **Pain**: Doesn't trust cloud AI with personal data
- **Goal**: Full local operation with local LLM, no data leaves the machine

---

## 4. Product Principles

### P1: Local-First, Cloud-Optional
Everything works offline with a local LLM. Cloud providers (OpenAI, Anthropic, etc.) are optional accelerators, not dependencies.

### P2: One Call, Not Four
Simple requests should be one LLM call with native tool calling. No multi-step routing pipelines for basic operations. Complexity is reserved for genuinely complex tasks.

### P3: Memory is a Feature, Not a Bug
The assistant should remember user preferences, past conversations, and learned context — with full user control over what's stored and what's deleted.

### P4: Tools Over Talk
Bias toward action. If the user says "create a todo list," create it — don't explain how to create one.

### P5: Beautiful by Default
The UI should feel like a premium product from day one. No "developer tool" aesthetic. Dark mode, smooth animations, thoughtful micro-interactions.

### P6: Extensible Without Complexity
Adding a new tool should be as simple as writing a TypeScript function with a JSON schema. No bridge layers, no TCP servers, no multi-process coordination.

---

## 5. System Architecture

### 5.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Tauri Shell                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                   Frontend (React)                      │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │ Chat     │ │ Context  │ │ Tool     │ │ Settings │  │  │
│  │  │ View     │ │ Panel    │ │ Widgets  │ │ View     │  │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │  │
│  │       └─────────────┴────────────┴─────────────┘        │  │
│  │                      │ IPC / Events                     │  │
│  └──────────────────────┼──────────────────────────────────┘  │
│                         │                                     │
│  ┌──────────────────────▼──────────────────────────────────┐  │
│  │                  Tauri Backend (Rust)                    │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │ System Bridge: FS access, notifications, tray   │    │  │
│  │  └─────────────────────┬───────────────────────────┘    │  │
│  └────────────────────────┼────────────────────────────────┘  │
│                           │ Sidecar / localhost                │
│  ┌────────────────────────▼────────────────────────────────┐  │
│  │              Core Server (Node.js / TypeScript)          │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │              Communication Layer                 │    │  │
│  │  │  WebSocket Server ←→ Frontend                    │    │  │
│  │  │  REST API (optional external access)             │    │  │
│  │  └────────────────────┬────────────────────────────┘    │  │
│  │                       │                                  │  │
│  │  ┌────────────────────▼────────────────────────────┐    │  │
│  │  │              Intelligence Layer                  │    │  │
│  │  │                                                  │    │  │
│  │  │  ┌──────────────┐  ┌─────────────────────────┐  │    │  │
│  │  │  │ Router       │  │ Agent Engine             │  │    │  │
│  │  │  │ (simple →    │  │ (ReAct loop for          │  │    │  │
│  │  │  │  tool call)  │  │  multi-step tasks)       │  │    │  │
│  │  │  └──────┬───────┘  └──────────┬──────────────┘  │    │  │
│  │  │         │                     │                  │    │  │
│  │  │  ┌──────▼─────────────────────▼──────────────┐  │    │  │
│  │  │  │         LLM Adapter (AI SDK)              │  │    │  │
│  │  │  │  Local: llama.cpp  Remote: 10+ providers  │  │    │  │
│  │  │  └───────────────────────────────────────────┘  │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │              Knowledge Layer                     │    │  │
│  │  │                                                  │    │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │    │  │
│  │  │  │ Memory   │ │ Context  │ │ Persona        │  │    │  │
│  │  │  │ Manager  │ │ Manager  │ │ (personality   │  │    │  │
│  │  │  │ (SQLite  │ │ (system  │ │  + mood +      │  │    │  │
│  │  │  │  +vector)│ │  aware)  │ │  preferences)  │  │    │  │
│  │  │  └──────────┘ └──────────┘ └────────────────┘  │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │              Action Layer                        │    │  │
│  │  │                                                  │    │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │    │  │
│  │  │  │ Tool     │ │ Tool     │ │ Plugin Host    │  │    │  │
│  │  │  │ Registry │ │ Executor │ │ (sandboxed     │  │    │  │
│  │  │  │ (JSON    │ │ (TS fn + │ │  third-party)  │  │    │  │
│  │  │  │  schema) │ │  sandbox)│ │                │  │    │  │
│  │  │  └──────────┘ └──────────┘ └────────────────┘  │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Process Model

```
┌─────────────┐     IPC/Events     ┌────────────────────┐
│ Tauri App   │◄──────────────────►│ Core Server        │
│ (Rust+React)│                    │ (Node.js sidecar)  │
└─────────────┘                    └────────────────────┘
      │                                     │
      │ Native APIs                         │ HTTP/SDK
      ▼                                     ▼
 OS (FS, tray,                        LLM Providers
  notifications,                    (local or remote)
  system info)
```

- **Single Node.js process** — no Python TCP server, no multi-process headaches
- **Tauri** provides native OS integration (tray, notifications, FS, auto-update)
- **Frontend** communicates with Core Server via WebSocket on localhost

### 5.3 Request Flow

#### Simple Request (Single Tool Call)
```
User: "What's the weather in Tokyo?"
  │
  ▼
WebSocket → Core Server
  │
  ▼
LLM Adapter: streamText({
  model: provider,
  messages: [system + user],
  tools: [weather_tool, ...]    ← native tool calling
})
  │
  ▼
LLM returns: tool_call → weather({city: "Tokyo"})
  │
  ▼
Tool Executor → runs weather function → result
  │
  ▼
LLM continues: "It's 18C and sunny in Tokyo today."
  │
  ▼
WebSocket → Frontend (streamed)
```

**One LLM call. Zero routing pipelines.**

#### Complex Request (Agent ReAct Loop)
```
User: "Research the top 5 competitors of Notion and create a comparison table"
  │
  ▼
Router detects: multi-step → Agent Engine
  │
  ▼
Agent ReAct Loop:
  ├── Plan: [search_web x5, extract_info, create_table]
  ├── Step 1: tool_call → web_search("Notion competitors 2026")
  ├── Step 2: tool_call → web_search("Obsidian vs Notion")
  ├── ...observe results, maybe replan...
  ├── Step N: synthesize → markdown comparison table
  └── Final Answer → streamed to user
  │
  ▼
Each step streamed to frontend with progress UI
```

---

## 6. Core Features

### 6.1 Feature Priority Matrix

| Priority | Feature | Description |
|----------|---------|-------------|
| **P0** | Chat Interface | Text conversation with streaming responses |
| **P0** | LLM Integration | Connect to remote LLM providers (OpenAI, Anthropic, etc.) |
| **P0** | Native Tool Calling | LLM can call tools in a single inference pass |
| **P0** | Conversation Persistence | Chat history saved locally across sessions |
| **P1** | Built-in Tools | Web search, file operations, calculator, timer |
| **P1** | Local LLM | llama.cpp integration for fully offline operation |
| **P1** | Memory System | Long-term memory with semantic recall |
| **P1** | Context Awareness | System info, time, user profile injected into prompts |
| **P1** | Agent Mode | Multi-step ReAct reasoning for complex tasks |
| **P2** | Plugin System | Third-party tool extensions (sandboxed) |
| **P2** | Voice I/O | Speech-to-text input + text-to-speech output |
| **P2** | Persona System | Customizable personality, mood, response style |
| **P2** | Widget System | Rich UI components in chat (tables, charts, forms) |
| **P3** | MCP Integration | Model Context Protocol server/client support |
| **P3** | Multi-modal | Image input/output, file preview |
| **P3** | Automation | Scheduled tasks, event-driven triggers |
| **P3** | Mobile Companion | React Native app synced with desktop |

### 6.2 Feature Specifications

#### F1: Chat Interface (P0)

**Description**: Real-time conversational interface with streaming text output.

**Requirements**:
- Stream tokens as they arrive from LLM (Server-Sent Events style over WebSocket)
- Markdown rendering with syntax highlighting for code blocks
- Message editing and regeneration
- Conversation branching (fork from any message)
- Copy, share, export individual messages or full conversations
- Inline image preview for multi-modal messages
- "Stop generating" button with immediate cancellation

**Acceptance Criteria**:
- First token appears < 500ms after sending message (remote LLM)
- Smooth token-by-token rendering at 60fps, no jank
- Conversation loads < 200ms from stored history

#### F2: LLM Provider System (P0)

**Description**: Unified adapter layer supporting multiple LLM providers.

**Supported Providers** (via Vercel AI SDK):

| Provider | Type | Notes |
|----------|------|-------|
| OpenAI | Remote | GPT-4o, GPT-4.1, o3/o4-mini |
| Anthropic | Remote | Claude Sonnet 4, Opus 4 |
| Groq | Remote | Fast inference, Llama/Mixtral |
| OpenRouter | Remote | Multi-model gateway |
| Cerebras | Remote | Ultra-fast inference |
| xAI (Grok) | Remote | Grok-3 |
| Local (llama.cpp) | Local | Any GGUF model |

**Requirements**:
- Hot-swap providers without restart
- Per-request provider override (e.g., use fast model for routing, strong model for agent)
- Automatic fallback: if primary provider fails, try secondary
- Token usage tracking and display
- Streaming support for all providers
- Native tool/function calling support

**Configuration**:
```json
{
  "providers": {
    "default": {
      "provider": "anthropic",
      "model": "claude-sonnet-4-20250514",
      "apiKey": "${ANTHROPIC_API_KEY}"
    },
    "fast": {
      "provider": "groq",
      "model": "llama-3.3-70b-versatile",
      "apiKey": "${GROQ_API_KEY}"
    },
    "local": {
      "provider": "llamacpp",
      "modelPath": "~/.lynx/models/qwen3-8b-q4.gguf"
    }
  },
  "routing": {
    "simple": "fast",
    "agent": "default",
    "fallback": "local"
  }
}
```

#### F3: Tool System (P0/P1)

**Description**: Extensible tool registry with JSON Schema definitions and TypeScript implementations.

**Tool Definition Format**:
```typescript
// tools/web-search.ts
import { defineTool } from '@lynx/tools'

export default defineTool({
  name: 'web_search',
  description: 'Search the web for current information',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      maxResults: { type: 'number', default: 5 }
    },
    required: ['query']
  },
  execute: async ({ query, maxResults }) => {
    // Implementation
    return { results: [...] }
  }
})
```

**Built-in Tools (P1)**:

| Category | Tools |
|----------|-------|
| **Information** | `web_search`, `url_fetch`, `wikipedia`, `calculator` |
| **File System** | `read_file`, `write_file`, `list_directory`, `search_files` |
| **System** | `run_command` (sandboxed), `system_info`, `open_app`, `notification` |
| **Productivity** | `create_todo`, `set_timer`, `set_reminder`, `take_note` |
| **Knowledge** | `memory_store`, `memory_recall`, `memory_forget` |
| **Media** | `screenshot`, `image_describe`, `text_to_image` (API) |

**Execution Model**:
- Tools run in-process by default (TypeScript functions)
- `run_command` uses a sandboxed subprocess with allowlists
- Third-party plugins run in isolated-vm or WASM sandbox
- All tool calls logged with input/output for debugging
- User confirmation required for destructive operations (delete, run_command, etc.)

#### F4: Memory System (P1)

**Description**: Persistent, semantically searchable memory that gives the assistant long-term context.

**Memory Types**:

| Type | TTL | Description |
|------|-----|-------------|
| `conversation` | Session | Current conversation context |
| `episodic` | 30 days | What happened in past conversations |
| `semantic` | Permanent | Facts about the user (preferences, info) |
| `procedural` | Permanent | Learned workflows and patterns |

**Storage Architecture**:
```
SQLite Database (single file: ~/.lynx/memory.db)
├── conversations    — full conversation logs
├── memories         — extracted facts/preferences
├── embeddings       — vector embeddings (sqlite-vec)
└── daily_summaries  — compressed daily digests
```

**Operations**:
- **Auto-extract**: After each conversation turn, background LLM call extracts memorable facts
- **Recall**: Before each response, retrieve top-K relevant memories via vector similarity
- **Forget**: User can delete specific memories or entire time ranges
- **Export**: Full memory export as JSON for portability

#### F5: Context Awareness (P1)

**Description**: Automatically gathered environment context injected into system prompts.

**Context Sources**:

| Source | Update Frequency | Content |
|--------|-----------------|---------|
| System | On boot | OS, CPU, RAM, GPU, hostname |
| DateTime | Every request | Current date, time, timezone, day of week |
| User Profile | On change | Name, language, preferences |
| Active Window | Every 30s | Currently focused application |
| File Context | On demand | Recent files, project structure |
| Weather | Hourly | Location-based weather (opt-in) |
| Calendar | Every 15min | Upcoming events (opt-in, via MCP) |

**Implementation**: Context is assembled as a compact markdown block prepended to the system prompt. Total context budget: ~500 tokens.

#### F6: Agent Mode (P1)

**Description**: ReAct-style multi-step reasoning for complex tasks requiring planning and multiple tool calls.

**Trigger**: Automatically activated when the LLM's first response requires 3+ tool calls or when the user prefixes with `/agent`.

**Flow**:
```
1. PLAN    — Generate a step-by-step plan (shown to user as progress widget)
2. EXECUTE — Execute each step, calling tools as needed
3. OBSERVE — Evaluate results, decide next action
4. REPLAN  — If a step fails, adjust the plan
5. ANSWER  — Synthesize final response from all gathered information
```

**Constraints**:
- Max 15 execution steps per request
- Max 3 replans per request
- Total timeout: 5 minutes
- User can cancel at any point
- Each step visible in real-time via plan progress widget

#### F7: Plugin System (P2)

**Description**: Third-party tool extensions that run in sandboxed environments.

**Plugin Format**:
```
~/.lynx/plugins/
├── my-plugin/
│   ├── plugin.json      ← metadata + tool definitions
│   ├── index.ts         ← entry point
│   └── ...
```

**Security Model**:
- Plugins run in `isolated-vm` (V8 isolate, no filesystem access by default)
- Permissions declared in `plugin.json`, approved by user on install
- Available permissions: `fs.read`, `fs.write`, `network`, `shell`, `clipboard`
- Plugin store (future): curated + community plugins

#### F8: Voice I/O (P2)

**Description**: Optional speech input/output for hands-free operation.

**Implementation**:
- **STT**: Web Speech API (browser-native, zero deps) or Whisper.cpp (local)
- **TTS**: Web Speech API or cloud TTS (ElevenLabs / OpenAI TTS)
- **Wake Word**: Optional "Hey Lynx" via Porcupine WASM
- **Voice Activity Detection**: Silero VAD (ONNX, runs in browser)

#### F9: Widget System (P2)

**Description**: Rich interactive components rendered inline in chat messages.

**Widget Types**:
- `table` — Sortable data tables
- `chart` — Bar, line, pie charts (via Recharts)
- `form` — Input forms for multi-field data collection
- `progress` — Agent plan progress tracker
- `code` — Executable code blocks with run button
- `image` — Image gallery with lightbox
- `todo` — Interactive todo list with checkboxes
- `card` — Rich preview cards (URLs, files, etc.)

**Implementation**: Widgets are React components rendered from a schema returned by tools.

---

## 7. Technical Specifications

### 7.1 Technology Stack

```
┌─────────────────────────────────────────────────┐
│ Layer          │ Technology                       │
├────────────────┼──────────────────────────────────┤
│ Desktop Shell  │ Tauri 2.x (Rust)                │
│ Frontend       │ React 19 + TypeScript 5.x       │
│ Build          │ Vite 8                           │
│ Styling        │ Tailwind CSS v4                  │
│ UI Components  │ shadcn/ui + Radix UI            │
│ Animations     │ Magic UI + Motion Primitives     │
│ Animation Eng. │ Motion (Framer Motion)           │
│ State Mgmt     │ Zustand                          │
│ Icons          │ Lucide React                     │
│ Font           │ Geist (Sans + Mono)              │
│ Core Server    │ Node.js 22+ (ESM, TypeScript)   │
│ HTTP           │ Hono                             │
│ WebSocket      │ ws (native)                      │
│ LLM SDK        │ Vercel AI SDK (ai)              │
│ Local LLM      │ node-llama-cpp                   │
│ Database       │ better-sqlite3                   │
│ Vector Search  │ sqlite-vec                       │
│ Testing        │ Vitest + Playwright              │
│ Package Mgr    │ pnpm                             │
│ Monorepo       │ pnpm workspaces                  │
│ Linting        │ ESLint + Biome                   │
│ CI/CD          │ GitHub Actions                   │
└────────────────┴──────────────────────────────────┘
```

### 7.2 Project Structure

```
lynx/
├── apps/
│   ├── desktop/                 # Tauri app shell
│   │   ├── src-tauri/           # Rust backend
│   │   │   ├── src/
│   │   │   │   └── main.rs      # Tauri entry, IPC commands
│   │   │   ├── Cargo.toml
│   │   │   └── tauri.conf.json
│   │   ├── src/                 # React frontend
│   │   │   ├── app.tsx
│   │   │   ├── components/
│   │   │   │   ├── chat/        # Chat view components
│   │   │   │   ├── sidebar/     # Left sidebar
│   │   │   │   ├── panels/      # Right context panels
│   │   │   │   ├── widgets/     # Inline chat widgets
│   │   │   │   ├── settings/    # Settings UI
│   │   │   │   └── ui/          # shadcn/ui base components
│   │   │   ├── hooks/           # React hooks
│   │   │   ├── stores/          # Zustand stores
│   │   │   ├── lib/             # Frontend utilities
│   │   │   └── styles/          # Global styles, theme
│   │   ├── index.html
│   │   └── vite.config.ts
│   │
│   └── server/                  # Core server (Node.js sidecar)
│       ├── src/
│       │   ├── index.ts         # Server entry point
│       │   ├── server.ts        # WebSocket + HTTP setup
│       │   ├── router.ts        # Request routing logic
│       │   ├── agent/           # ReAct agent engine
│       │   │   ├── agent.ts
│       │   │   ├── planner.ts
│       │   │   ├── executor.ts
│       │   │   └── types.ts
│       │   ├── llm/             # LLM adapter layer
│       │   │   ├── adapter.ts   # Unified LLM interface
│       │   │   ├── providers.ts # Provider registry
│       │   │   └── streaming.ts # Stream handling
│       │   ├── tools/           # Built-in tools
│       │   │   ├── registry.ts  # Tool registration
│       │   │   ├── executor.ts  # Sandboxed execution
│       │   │   ├── web-search.ts
│       │   │   ├── file-ops.ts
│       │   │   ├── system.ts
│       │   │   └── ...
│       │   ├── memory/          # Memory system
│       │   │   ├── manager.ts
│       │   │   ├── repository.ts
│       │   │   ├── extractor.ts # Auto-extract from conversations
│       │   │   ├── recall.ts    # Vector similarity search
│       │   │   └── schema.sql
│       │   ├── context/         # Context awareness
│       │   │   ├── manager.ts
│       │   │   ├── system.ts
│       │   │   ├── user-profile.ts
│       │   │   └── assembler.ts # Build context block
│       │   ├── persona/         # Personality system
│       │   │   ├── persona.ts
│       │   │   └── prompts.ts
│       │   └── types.ts
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── shared/                  # Shared types & utilities
│   │   ├── src/
│   │   │   ├── types.ts         # Shared type definitions
│   │   │   ├── protocol.ts      # WebSocket message protocol
│   │   │   └── constants.ts
│   │   └── package.json
│   │
│   └── tools-sdk/               # SDK for building plugins
│       ├── src/
│       │   ├── define-tool.ts
│       │   └── types.ts
│       └── package.json
│
├── tools/                       # Community/example tools
│   ├── todo-list/
│   ├── weather/
│   └── ...
│
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── README.md
```

### 7.3 WebSocket Protocol

```typescript
// Message types (shared/src/protocol.ts)

// Client → Server
interface ClientMessage {
  type: 'chat' | 'cancel' | 'widget-action' | 'voice-audio'
  id: string  // unique message ID
  payload: {
    text?: string
    conversationId?: string
    attachments?: Attachment[]
    widgetAction?: { widgetId: string; action: string; data: unknown }
  }
}

// Server → Client
interface ServerEvent {
  type:
    | 'token'           // streaming text token
    | 'tool-start'      // tool execution started
    | 'tool-result'     // tool execution completed
    | 'plan-update'     // agent plan step update
    | 'widget'          // render widget in chat
    | 'message-done'    // response complete
    | 'error'           // error occurred
    | 'status'          // system status (typing, thinking)
  id: string
  messageId: string
  payload: unknown
}
```

---

## 8. UI/UX Design Specification

### 8.1 Design System

#### Color Palette

```
Background (Dark):
  --bg-primary:     #0a0a0f     (near-black with blue undertone)
  --bg-secondary:   #12121a     (card/panel background)
  --bg-tertiary:    #1a1a28     (hover states)
  --bg-elevated:    #222233     (modals, dropdowns)

Text:
  --text-primary:   #e8e8ed     (main text)
  --text-secondary: #8888a0     (muted text)
  --text-tertiary:  #55556a     (disabled text)

Brand Accent:
  --accent:         #6366f1     (indigo-500, primary actions)
  --accent-glow:    #6366f1/20  (glow effect, 20% opacity)
  --accent-hover:   #818cf8     (indigo-400)

Status:
  --success:        #22c55e     (green-500)
  --warning:        #f59e0b     (amber-500)
  --error:          #ef4444     (red-500)
  --info:           #3b82f6     (blue-500)

Surfaces:
  --border:         #ffffff08   (subtle borders, 3% white)
  --border-active:  #ffffff15   (active borders, 8% white)
  --glass:          #ffffff05   (glassmorphism fill)
```

#### Typography

```
Font Family:
  Sans:  'Geist Sans', system-ui, sans-serif
  Mono:  'Geist Mono', 'JetBrains Mono', monospace

Scale:
  --text-xs:    0.75rem / 1rem      (12px, labels)
  --text-sm:    0.875rem / 1.25rem  (14px, secondary)
  --text-base:  1rem / 1.5rem       (16px, body)
  --text-lg:    1.125rem / 1.75rem  (18px, emphasis)
  --text-xl:    1.25rem / 1.75rem   (20px, headings)
  --text-2xl:   1.5rem / 2rem       (24px, page titles)
```

#### Spacing & Radius

```
Spacing: 4px grid (0.25rem increments)
Border Radius:
  --radius-sm:  6px   (buttons, inputs)
  --radius-md:  8px   (cards)
  --radius-lg:  12px  (panels, modals)
  --radius-xl:  16px  (large containers)
```

#### Effects

```
Glassmorphism:
  background: var(--glass)
  backdrop-filter: blur(12px) saturate(150%)
  border: 1px solid var(--border)

Glow:
  box-shadow: 0 0 20px var(--accent-glow), 0 0 60px var(--accent-glow)

Elevation:
  --shadow-sm:  0 1px 2px rgba(0,0,0,0.3)
  --shadow-md:  0 4px 12px rgba(0,0,0,0.4)
  --shadow-lg:  0 8px 24px rgba(0,0,0,0.5)
```

### 8.2 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Title Bar (Tauri custom)                              ─  □  ✕  │
│ ┌──────┐  Lynx  ●  Online │ Claude Sonnet 4 ▼ │ ⚙️           │
├─────────┬───────────────────────────────────────┬───────────────┤
│         │                                       │               │
│  240px  │              Main Chat Area            │   280px      │
│         │           (flex, scrollable)           │               │
│ Sidebar │                                       │  Context      │
│         │  ┌─────────────────────────────────┐  │  Panel        │
│ ┌─────┐ │  │  Assistant message with          │  │  (collapsible)│
│ │ New │ │  │  streaming text, widgets,        │  │               │
│ │Chat │ │  │  tool call indicators            │  │ ┌───────────┐│
│ └─────┘ │  └─────────────────────────────────┘  │ │ Memory    ││
│         │                                       │ │ ─────────  ││
│ Today   │  ┌─────────────────────────────────┐  │ │ Recent    ││
│ ├ Chat1 │  │  Agent Plan Progress Widget      │  │ │ memories  ││
│ ├ Chat2 │  │  ✓ Step 1: Search web            │  │ │ relevant  ││
│         │  │  → Step 2: Analyzing...          │  │ │ to current││
│ Yester. │  │  ○ Step 3: Generate report       │  │ │ query     ││
│ ├ Chat3 │  └─────────────────────────────────┘  │ └───────────┘│
│         │                                       │               │
│ ─────── │                                       │ ┌───────────┐│
│         │                                       │ │ Context   ││
│ ┌─────┐ │                                       │ │ ─────────  ││
│ │Tools│ │                                       │ │ System:   ││
│ │     │ │                                       │ │ macOS 15  ││
│ │Sett.│ │                                       │ │ 16GB RAM  ││
│ └─────┘ │                                       │ │ 14:32 CST ││
│         │                                       │ └───────────┘│
│         ├───────────────────────────────────────┤               │
│         │ ┌─────────────────────────────┐       │               │
│         │ │ Message input...       🎤 📎 ⚡│   │               │
│         │ └─────────────────────────────┘       │               │
└─────────┴───────────────────────────────────────┴───────────────┘
```

**Layout Rules**:
- Sidebar: 240px, collapsible to 60px (icon-only mode)
- Context Panel: 280px, collapsible, hidden by default on < 1200px
- Main Chat: fluid, min-width 480px
- Input Area: sticky bottom, auto-expanding textarea (max 200px height)
- Title Bar: 40px, Tauri custom (drag region + controls)

### 8.3 Animation Specifications

| Element | Animation | Library | Duration |
|---------|-----------|---------|----------|
| Message appear | Fade up + scale | Motion | 200ms ease-out |
| Token streaming | Character reveal | CSS | 16ms/char |
| Tool call start | Slide in + pulse border | Motion Primitives | 300ms |
| Plan step complete | Check mark + color change | Magic UI | 400ms spring |
| Sidebar open/close | Slide + opacity | Motion | 250ms ease |
| Panel toggle | Slide from right | Motion | 200ms ease |
| Hover on card | Subtle glow + lift | CSS transition | 150ms |
| Page transition | Cross-fade | Motion Primitives | 200ms |
| Loading state | Skeleton shimmer | Magic UI | 1.5s loop |
| Voice active | Particle wave animation | Magic UI particles | Continuous |
| Error shake | Horizontal shake | Motion | 400ms spring |

### 8.4 Key UI Components

#### Chat Message Component
```
┌─────────────────────────────────────────────┐
│ 🤖 Lynx                           14:32    │
│                                             │
│ Here's what I found about Tokyo weather:    │
│                                             │
│ ┌─ ☁️ Weather ─────────────────────────┐   │
│ │ Tokyo, Japan          18°C  Cloudy   │   │
│ │ Humidity: 65%    Wind: 12 km/h NE    │   │
│ └──────────────────────────────────────┘   │
│                                             │
│ The temperature is mild for this time of    │
│ year. Perfect for walking around Shibuya!   │
│                                             │
│                          📋  🔄  👍 👎    │
└─────────────────────────────────────────────┘
```

#### Agent Plan Widget
```
┌─ 🧠 Agent Plan ────────────────────────────┐
│                                             │
│  ✅ Search web for "Notion competitors"     │
│     └ Found 12 results                      │
│                                             │
│  ✅ Extract key features from top 5         │
│     └ Analyzed: Obsidian, Craft, Coda,      │
│       Logseq, Anytype                       │
│                                             │
│  🔄 Building comparison table...            │
│     └ ████████░░ 75%                        │
│                                             │
│  ○ Generate summary with recommendation     │
│                                             │
│  ⏱️ 2m 14s elapsed    Token: 3,847          │
│                               [Cancel]      │
└─────────────────────────────────────────────┘
```

#### Input Area
```
┌─────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────┐ │
│ │ Ask Lynx anything...                    │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│  📎 Attach   🎤 Voice   ⚡ /commands        │
│                                    ↵ Send   │
└─────────────────────────────────────────────┘
```

---

## 9. Data Architecture

### 9.1 SQLite Schema

```sql
-- Conversations
CREATE TABLE conversations (
  id          TEXT PRIMARY KEY,
  title       TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  archived    INTEGER DEFAULT 0
);

-- Messages
CREATE TABLE messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  role            TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system', 'tool')),
  content         TEXT NOT NULL,
  metadata        TEXT,  -- JSON: {model, tokens, duration, tool_calls}
  parent_id       TEXT REFERENCES messages(id),  -- for branching
  created_at      INTEGER NOT NULL
);
CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at);

-- Memories
CREATE TABLE memories (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK(type IN ('semantic', 'episodic', 'procedural')),
  content     TEXT NOT NULL,
  source      TEXT,  -- conversation_id or 'manual'
  embedding   BLOB,  -- sqlite-vec vector
  created_at  INTEGER NOT NULL,
  accessed_at INTEGER NOT NULL,
  access_count INTEGER DEFAULT 0,
  deleted_at  INTEGER  -- soft delete
);

-- Tool Call Logs
CREATE TABLE tool_calls (
  id          TEXT PRIMARY KEY,
  message_id  TEXT REFERENCES messages(id),
  tool_name   TEXT NOT NULL,
  input       TEXT,  -- JSON
  output      TEXT,  -- JSON
  status      TEXT CHECK(status IN ('success', 'error', 'timeout')),
  duration_ms INTEGER,
  created_at  INTEGER NOT NULL
);

-- User Profile (key-value with history)
CREATE TABLE user_profile (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- Provider Usage Tracking
CREATE TABLE usage_log (
  id          TEXT PRIMARY KEY,
  provider    TEXT NOT NULL,
  model       TEXT NOT NULL,
  input_tokens  INTEGER,
  output_tokens INTEGER,
  cost_usd    REAL,
  created_at  INTEGER NOT NULL
);
```

### 9.2 File Storage

```
~/.lynx/
├── config.json           # User configuration
├── memory.db             # SQLite database (all data)
├── models/               # Local GGUF models
│   └── *.gguf
├── plugins/              # Installed plugins
├── logs/                 # Application logs
│   ├── app.log
│   └── errors.log
├── cache/                # Temporary cache
│   ├── embeddings/
│   └── tts/
└── exports/              # Exported conversations
```

---

## 10. Security & Privacy

### 10.1 Data Security

| Concern | Mitigation |
|---------|-----------|
| API keys storage | OS keychain via Tauri's `tauri-plugin-stronghold` (encrypted) |
| Local data at rest | SQLite with SQLCipher encryption (optional, user toggle) |
| Plugin sandboxing | `isolated-vm` V8 isolates, declared permission model |
| Shell command execution | Allowlist-based, user confirmation for unknown commands |
| Network requests | Tools declare required domains; unexpected domains blocked |
| Memory data | User can view, edit, delete any memory; bulk purge available |

### 10.2 Privacy Model

- **Default**: No data leaves the machine unless user explicitly configures a remote LLM provider
- **Remote LLM usage**: Clear indicator in UI when data is sent to cloud
- **Telemetry**: Opt-in only, anonymous usage stats, no conversation content
- **Context collection**: Each context source is individually toggleable
- **Memory**: Auto-extraction can be disabled; manual-only mode available

### 10.3 Plugin Security

```
Permission Levels:
  Level 0 (Safe):     Pure computation, no I/O
  Level 1 (Read):     Read filesystem, read network
  Level 2 (Write):    Write filesystem, send network requests
  Level 3 (System):   Execute commands, access clipboard
  Level 4 (Full):     Unrestricted (requires explicit user trust)
```

---

## 11. Performance Requirements

| Metric | Target | Method |
|--------|--------|--------|
| App startup | < 2s to interactive | Tauri cold start + lazy load |
| First token (remote LLM) | < 800ms | Direct streaming, no routing pipeline |
| First token (local LLM) | < 2s | Model stays loaded in memory |
| Message render | 60fps during streaming | Virtual scrolling, CSS-based token animation |
| Memory recall | < 100ms for top-10 | sqlite-vec ANN search |
| Tool execution | < 5s per tool (soft limit) | Timeout + cancellation |
| Database query | < 50ms | Indexed SQLite, WAL mode |
| App memory (idle) | < 200MB | Lazy loading, no model in memory when idle |
| App memory (local LLM active) | < 4GB (8B model) | GGUF quantization, mmap |
| Conversation load | < 200ms for 1000 messages | Pagination + virtual list |

---

## 12. Development Roadmap

### Phase Overview

```
Phase 0: Foundation          ██░░░░░░░░  Weeks 1-3
Phase 1: Core Intelligence   ████░░░░░░  Weeks 4-7
Phase 2: Knowledge & Memory  ██████░░░░  Weeks 8-11
Phase 3: Agent & Tools       ████████░░  Weeks 12-16
Phase 4: Polish & Plugins    ██████████  Weeks 17-22
Phase 5: Voice & Beyond      ──────────  Weeks 23+
```

---

### Phase 0: Foundation (Weeks 1-3)

> Goal: Skeleton app that sends a message to an LLM and displays the streamed response.

#### Week 1: Project Bootstrap

- [ ] Initialize monorepo (pnpm workspaces)
- [ ] Set up Tauri 2 project with React frontend
- [ ] Configure Vite, TypeScript, Tailwind CSS v4
- [ ] Install and configure shadcn/ui
- [ ] Set up ESLint + Biome
- [ ] Create basic Tauri window with custom title bar
- [ ] Implement dark theme with design system tokens (colors, typography, spacing)

**Deliverable**: Empty Tauri app with styled shell, dark theme, custom title bar.

#### Week 2: Core Server + Chat

- [ ] Create Node.js server package (`apps/server`)
- [ ] Implement WebSocket server (`ws`)
- [ ] Define WebSocket message protocol (`packages/shared`)
- [ ] Set up Tauri sidecar to launch Node.js server
- [ ] Implement basic LLM adapter with one provider (Anthropic or OpenAI)
- [ ] Implement streaming: server → WebSocket → frontend
- [ ] Build chat input component (auto-expand textarea, send button)
- [ ] Build message list component (user + assistant messages)
- [ ] Implement Markdown rendering (react-markdown + syntax highlighting)

**Deliverable**: Can send a message, get streamed LLM response, rendered with Markdown.

#### Week 3: Conversations + Settings

- [ ] Set up SQLite database (better-sqlite3)
- [ ] Implement conversation CRUD (create, list, delete, rename)
- [ ] Build sidebar with conversation history
- [ ] Implement conversation persistence (save/load messages)
- [ ] Build settings page (LLM provider config, API key input)
- [ ] Support multiple LLM providers (add Groq, OpenRouter)
- [ ] Implement provider hot-swap (change model mid-session)
- [ ] Add "Stop generating" button with stream cancellation
- [ ] Message copy, regenerate actions

**Deliverable**: Fully functional chat app with conversation history and multi-provider support.

---

### Phase 1: Core Intelligence (Weeks 4-7)

> Goal: The assistant can call tools and do real things.

#### Week 4: Tool System Foundation

- [ ] Design tool definition format (`defineTool()` API)
- [ ] Implement tool registry (load, validate, list tools)
- [ ] Implement tool executor (call function, capture result, handle errors)
- [ ] Integrate tool calling with LLM adapter (AI SDK `tools` parameter)
- [ ] Build first tools: `calculator`, `current_datetime`, `web_search`
- [ ] Display tool calls in chat UI (tool call card: name, input, output, duration)
- [ ] Implement tool call confirmation flow for sensitive operations

**Deliverable**: LLM can call tools, results shown inline in chat.

#### Week 5: File & System Tools

- [ ] Implement `read_file`, `write_file`, `list_directory`
- [ ] Implement `search_files` (glob + content search)
- [ ] Implement `run_command` with allowlist sandbox
- [ ] Implement `system_info` tool
- [ ] Implement `open_url`, `open_app` (via Tauri shell)
- [ ] Implement `notification` (via Tauri notification API)
- [ ] Add file preview widget in chat (code files, images, PDFs)
- [ ] User confirmation dialog for write/delete/command operations

**Deliverable**: Assistant can read/write files, run commands, interact with OS.

#### Week 6: Context Awareness

- [ ] Implement context manager framework
- [ ] System context collector (OS, hardware, hostname)
- [ ] DateTime context (current time, timezone, day of week)
- [ ] User profile manager (name, language, preferences)
- [ ] Context assembler (build compact system prompt section)
- [ ] Settings UI for toggling individual context sources
- [ ] Active window detection (via Tauri plugin or system call)

**Deliverable**: LLM responses are contextually aware of system state and user preferences.

#### Week 7: UI Polish Pass 1

- [ ] Install and integrate Magic UI (particle background, glow effects)
- [ ] Install and integrate Motion Primitives (message animations, transitions)
- [ ] Animate message appearance (fade-up + scale)
- [ ] Animate tool call cards (slide-in, pulse border while running)
- [ ] Add glassmorphism to panels and modals
- [ ] Implement sidebar collapse animation (full → icon-only)
- [ ] Add skeleton loading states
- [ ] Polish input area (focus glow, attachment button, slash commands hint)
- [ ] Implement system tray with quick-access popup

**Deliverable**: Visually polished app with smooth animations and premium feel.

---

### Phase 2: Knowledge & Memory (Weeks 8-11)

> Goal: The assistant remembers things and gets smarter over time.

#### Week 8: Conversation Memory

- [ ] Implement conversation logger (persist all messages with metadata)
- [ ] Implement conversation search (full-text search via SQLite FTS5)
- [ ] Inject recent conversation history into system prompt
- [ ] Build conversation export (JSON, Markdown)
- [ ] Implement message branching (fork conversation from any message)
- [ ] Build conversation search UI in sidebar

**Deliverable**: Searchable conversation history with branching support.

#### Week 9: Long-Term Memory System

- [ ] Set up sqlite-vec for vector similarity search
- [ ] Implement embedding generation (local: transformers.js, or via LLM provider)
- [ ] Build memory repository (CRUD + vector search)
- [ ] Implement auto-extraction: after each turn, background LLM extracts facts
- [ ] Implement recall: before response, retrieve relevant memories
- [ ] Deduplication: detect similar memories, merge or skip
- [ ] Memory decay: reduce relevance of unaccessed old memories

**Deliverable**: Assistant remembers user preferences, facts, and past learnings.

#### Week 10: Memory UI + Controls

- [ ] Build memory panel in right sidebar (list of stored memories)
- [ ] Memory search and filter UI
- [ ] Manual memory creation ("Remember that I prefer dark mode")
- [ ] Memory deletion (individual + bulk + time-range)
- [ ] Memory export/import
- [ ] Visual indicator when a response uses recalled memory
- [ ] Settings: toggle auto-extraction, configure retention periods

**Deliverable**: Full user control over what the assistant remembers.

#### Week 11: Persona System

- [ ] Implement persona manager (system prompt builder)
- [ ] Customizable personality traits (formal/casual, verbose/concise, etc.)
- [ ] Dynamic mood system (adjusts based on time, conversation tone)
- [ ] Custom instructions editor (user-defined system prompt additions)
- [ ] Persona presets (Professional, Friendly, Technical, Creative)
- [ ] Settings UI for persona configuration

**Deliverable**: Customizable assistant personality with dynamic behavior.

---

### Phase 3: Agent & Advanced Tools (Weeks 12-16)

> Goal: The assistant can handle complex multi-step tasks autonomously.

#### Week 12: Agent Engine - Planning

- [ ] Implement ReAct loop framework (plan → execute → observe → replan)
- [ ] Build planner: LLM generates structured plan from user request
- [ ] Plan validation and constraint checking (max steps, allowed tools)
- [ ] Plan progress widget (React component, real-time updates via WebSocket)
- [ ] Implement smart routing: detect when agent mode is needed vs. simple tool call
- [ ] User can approve/modify plan before execution begins

**Deliverable**: Agent creates visible plans for complex tasks.

#### Week 13: Agent Engine - Execution

- [ ] Implement step executor with tool calling
- [ ] Observation system: evaluate each step's result
- [ ] Recovery planning: on failure, generate alternative approach
- [ ] Implement execution limits (max steps, timeout, token budget)
- [ ] Real-time plan widget updates (step status: pending → running → done/failed)
- [ ] Cancel button with graceful shutdown (finish current step, skip rest)
- [ ] History compaction (summarize long execution history to stay within context)

**Deliverable**: Agent executes multi-step plans with real-time visibility.

#### Week 14: Advanced Tools

- [ ] `url_fetch` — fetch and parse web pages (readability extraction)
- [ ] `create_note` / `search_notes` — local note-taking system
- [ ] `set_timer` / `set_reminder` — with Tauri notifications
- [ ] `todo_list` — create/manage todo lists with widget UI
- [ ] `image_generate` — via API (DALL-E, Flux, etc.)
- [ ] `code_execute` — sandboxed JavaScript execution (isolated-vm)
- [ ] `email_draft` — compose email (opens in default mail client)

**Deliverable**: Rich tool library covering common personal assistant tasks.

#### Week 15: Widget System

- [ ] Define widget schema format (JSON → React component mapping)
- [ ] Implement widget renderer in chat
- [ ] Build widgets: table, chart, form, progress, code, todo, card
- [ ] Widget interaction: user can click buttons, toggle checkboxes, submit forms
- [ ] Widget data flows back to tools (e.g., todo checkbox → update state)
- [ ] Widget persistence in conversation history

**Deliverable**: Rich interactive components in chat messages.

#### Week 16: UI Polish Pass 2

- [ ] Keyboard shortcuts (Cmd+K search, Cmd+N new chat, Cmd+/ toggle sidebar)
- [ ] Slash command system (/agent, /search, /note, /settings, etc.)
- [ ] Token usage display per message and cumulative
- [ ] Model info display (provider, model name, speed)
- [ ] Dark/light theme toggle (with system preference sync)
- [ ] Responsive layout (handle window resize gracefully)
- [ ] Loading states, empty states, error states — all designed
- [ ] Tauri auto-updater integration

**Deliverable**: Production-quality UI with keyboard-driven workflows.

---

### Phase 4: Polish & Plugins (Weeks 17-22)

> Goal: Plugin ecosystem and production readiness.

#### Week 17-18: Plugin System

- [ ] Define plugin manifest format (`plugin.json`)
- [ ] Plugin loader (discover, validate, load from `~/.lynx/plugins/`)
- [ ] Sandboxed execution environment (`isolated-vm`)
- [ ] Permission system (declare + prompt user on install)
- [ ] Plugin settings UI (install, enable/disable, configure, uninstall)
- [ ] Plugin SDK package (`@lynx/plugin-sdk`)
- [ ] Example plugins: Hacker News reader, GitHub PR reviewer, Spotify control
- [ ] Plugin development documentation

**Deliverable**: Working plugin system with example plugins and SDK.

#### Week 19-20: MCP Integration

- [ ] Implement MCP client (connect to external MCP servers)
- [ ] Implement MCP server (expose Lynx tools to external agents)
- [ ] Auto-discover local MCP servers
- [ ] MCP tool → Lynx tool adapter (seamless integration)
- [ ] Settings UI for MCP server management

**Deliverable**: Lynx can both consume and provide tools via MCP protocol.

#### Week 21-22: Production Hardening

- [ ] Error handling audit (every error path has user-friendly message)
- [ ] Logging system (structured logs, log rotation, error reporting)
- [ ] Performance profiling and optimization pass
- [ ] Memory leak audit (long-running sessions)
- [ ] SQLite database maintenance (auto-vacuum, integrity checks)
- [ ] Crash recovery (resume from last state after unexpected shutdown)
- [ ] Build pipeline (GitHub Actions: lint, test, build, sign, release)
- [ ] Auto-update system (Tauri updater with GitHub Releases)
- [ ] Installer for Windows (.msi), macOS (.dmg), Linux (.AppImage)
- [ ] End-to-end tests (Playwright)
- [ ] First public beta release

**Deliverable**: Production-ready beta with auto-update and cross-platform installers.

---

### Phase 5: Voice & Beyond (Weeks 23+)

> Goal: Voice interface and advanced capabilities.

#### Weeks 23-24: Voice I/O

- [ ] Implement STT via Web Speech API (zero deps, works in Tauri WebView)
- [ ] Implement TTS via Web Speech API (or ElevenLabs/OpenAI TTS API)
- [ ] Voice activation button with recording indicator
- [ ] Voice energy visualization (particle wave animation via Magic UI)
- [ ] Push-to-talk and hands-free modes
- [ ] Wake word detection (Porcupine WASM, optional)
- [ ] Streaming STT → LLM → TTS pipeline for conversational voice

#### Weeks 25-26: Multi-Modal

- [ ] Image input: paste/drag images into chat
- [ ] Image understanding via multi-modal LLM (GPT-4o, Claude)
- [ ] Screenshot tool: capture screen region, send to LLM for analysis
- [ ] PDF reading: extract text, summarize, Q&A
- [ ] File drag-and-drop: auto-detect type and process

#### Weeks 27-28: Automation

- [ ] Scheduled tasks (run a prompt on a cron schedule)
- [ ] Event triggers (file change → action, time-based → action)
- [ ] Workflow builder (chain tools into reusable sequences)
- [ ] Quick actions (pin frequent tasks to sidebar or tray menu)

#### Weeks 29+: Future Vision

- [ ] Mobile companion app (React Native, synced conversations)
- [ ] Multi-assistant: run multiple persona instances
- [ ] Team features: shared tool configs, shared memory spaces
- [ ] Local knowledge base: index local documents for RAG
- [ ] Screen awareness: periodic screenshots for context (opt-in, privacy-first)

---

## 13. Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Local LLM too slow on consumer hardware | High | Medium | Default to remote providers; optimize with quantization; clear hardware requirements |
| Tauri WebView inconsistencies across OS | Medium | Medium | Extensive cross-platform testing; fallback to simpler CSS when needed |
| Tool execution security breach | Critical | Low | Sandbox by default; permission model; allowlists; user confirmation |
| LLM provider API changes | Medium | Medium | Vercel AI SDK abstracts this; pin versions; adapter pattern |
| sqlite-vec performance at scale | Medium | Low | Benchmark early; fallback to separate vector DB (Qdrant) if needed |
| Plugin ecosystem doesn't develop | Medium | Medium | Build comprehensive built-in tools first; plugins are a bonus, not a dependency |
| Competitor ships similar product | Medium | High | Focus on open-source, privacy, and extensibility as differentiators |
| Memory system extracts incorrect info | Low | Medium | User review UI; conservative extraction; easy deletion |

---

## 14. Success Metrics

### Phase 0-1 (Foundation)
- [ ] App launches in < 2s on Windows/Mac/Linux
- [ ] First token appears in < 800ms (remote LLM)
- [ ] 5+ built-in tools working end-to-end
- [ ] Zero-config setup: download → launch → enter API key → start chatting

### Phase 2-3 (Intelligence)
- [ ] Memory recall accuracy > 80% (relevant memories retrieved)
- [ ] Agent completes 3-step tasks > 90% of the time
- [ ] Widget renders correctly for all built-in tool outputs
- [ ] < 1% crash rate in 4-hour sessions

### Phase 4 (Production)
- [ ] 100+ beta users
- [ ] 3+ community plugins published
- [ ] < 5s average response time for agent tasks
- [ ] 4.5+ star rating on GitHub

### Long-Term
- [ ] 10,000+ GitHub stars
- [ ] 50+ community plugins
- [ ] Featured in major tech publications
- [ ] Sustainable open-source funding (sponsors / premium plugins)

---

## Appendix A: Comparison with Leon 2.0 Architecture Decisions

| Decision | Leon 2.0 | Lynx | Rationale |
|----------|----------|------|-----------|
| Runtime | Node.js + Python (TCP bridge) | Node.js only | Eliminates process management complexity |
| Intent routing | 4-step LLM pipeline | Single LLM call with tool calling | Faster, simpler, leverages native LLM capabilities |
| UI Framework | Vanilla JS + Socket.IO | React + WebSocket (native) | Better component model, lighter transport |
| Desktop shell | Electron-like (web server) | Tauri | 10x smaller binary, native performance |
| State management | Singleton modules | Zustand stores | More React-idiomatic, easier testing |
| Tool definition | Python scripts + JSON config | TypeScript functions + JSON schema | Single language, type-safe, no bridge layer |
| Plugin sandbox | None (direct subprocess) | isolated-vm / WASM | Security by default |
| Vector search | QMD (custom) | sqlite-vec (native SQLite extension) | Simpler, single-database architecture |
| Context system | 17 custom file collectors | Modular collectors + MCP integration | Extensible via standard protocol |
| TTS/STT | Python VITS + Coqui (TCP) | Web Speech API + optional cloud API | Zero deps by default, cloud for quality |

## Appendix B: Key Technical Decisions Log

| # | Decision | Chosen | Alternatives Considered | Rationale |
|---|----------|--------|------------------------|-----------|
| 1 | Desktop framework | Tauri 2 | Electron, Neutralinojs | Smallest binary, native perf, Rust backend |
| 2 | Frontend framework | React 19 | Solid, Svelte, Vue | Largest ecosystem, shadcn/ui compatibility |
| 3 | Server runtime | Node.js 22 | Bun, Deno | Most mature, best library compat (node-llama-cpp) |
| 4 | Database | SQLite | PostgreSQL, DuckDB | Zero config, single file, embedded, perfect for desktop |
| 5 | LLM SDK | Vercel AI SDK | LangChain, LlamaIndex | Lighter weight, streaming-first, provider agnostic |
| 6 | Package manager | pnpm | npm, yarn, bun | Workspaces, disk efficient, fast |
| 7 | Styling | Tailwind CSS v4 | CSS Modules, Vanilla Extract | Utility-first, design system tokens, shadcn compat |
| 8 | State management | Zustand | Redux, Jotai, Signals | Minimal boilerplate, good TypeScript support |
| 9 | Animation | Motion + Magic UI | GSAP, Anime.js | React-native, declarative, shadcn ecosystem |
| 10 | Monorepo | pnpm workspaces | Turborepo, Nx | Simple, no extra tooling needed |

---

*This document is a living artifact. Update as decisions are made and requirements evolve.*
