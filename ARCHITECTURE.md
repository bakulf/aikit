# AIKit Architecture

This document describes the technical architecture of AIKit and how the different components interact.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Firefox Browser                      │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          AIKit Orchestrator (Main Add-on)              │ │
│  │                                                        │ │
│  │  ┌──────────────┐         ┌──────────────────────┐     │ │
│  │  │   Sidebar    │         │  Background Script   │     │ │
│  │  │     UI       │◄────────┤  - ToolRegistry      │     │ │
│  │  │  (sidebar.ts)│  Port   │  - AI Adapter        │     │ │
│  │  └──────────────┘         └──────────┬───────────┘     │ │
│  │                                       │                │ │
│  └───────────────────────────────────────┼────────────────┘ │
│                                          │                  │
│              External Message API        │                  │
│         (browser.runtime.sendMessage)    │                  │
│                                          │                  │
│  ┌───────────────────────────────────────┼────────────────┐ │
│  │              Tool Provider Add-ons    ▼                │ │
│  │            (using aikit-common)                        │ │
│  │                                                        │ │
│  │  ┌─────────────────┐    ┌──────────────────┐           │ │
│  │  │ AIKit Tabs Tool │    │  Your Custom     │           │ │
│  │  │                 │    │  Tool Add-on     │           │ │
│  │  │ ToolProvider    │    │  ToolProvider    │    ...    │ │
│  │  │ - tab.open      │    │  - your.tool     │           │ │
│  │  │ - tab.close     │    │  - your.action   │           │ │
│  │  └─────────────────┘    └──────────────────┘           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    External AI Provider
                  (Anthropic, OpenAI, Google)
```

## Component Details

### 1. AIKit Orchestrator

The main add-on that coordinates everything.

#### Sidebar UI (`sidebar.ts`, `sidebar.html`, `sidebar.css`)

**Responsibilities:**
- Display chat interface
- Handle user input
- Show AI responses with streaming
- Display registered tools
- Manage configuration (API keys, model selection)

**Key Features:**
- Real-time tool registration display
- Message streaming via Port API
- Persistent configuration storage
- Error handling and user feedback

**Communication:**
- Uses `browser.runtime.connect()` for streaming agent events
- Uses `browser.runtime.sendMessage()` for configuration and queries
- Uses `browser.storage.local` for persisting settings

#### Background Script (`background.ts`)

**Components:**

##### ToolRegistry Class

Manages the lifecycle of tool registration:

```typescript
class ToolRegistry {
  // Maps tool names to their registration info
  private registeredTools: Map<string, ToolRegistration>

  // The AI adapter instance
  private adapter: AIAdapter | null

  // Permission manager for tool access control
  private permissionManager: PermissionManager

  // Register tools from an external add-on
  registerExtension(extensionId, tools)

  // Remove all tools from an add-on
  unregisterExtension(extensionId)

  // Initialize the AI adapter
  initializeAdapter(apiKey, provider, model)

  // Execute a prompt through the adapter
  executePrompt(prompt, onEvent)
}
```

**AI Integration:**

The background script integrates multiple AI providers directly:
- `@anthropic-ai/sdk`: Claude models from Anthropic
- `openai`: GPT models from OpenAI
- `@google/generative-ai`: Gemini models from Google

The `ai-adapter.ts` module provides a unified interface that:
1. Adapts different provider APIs to a common format
2. Handles tool calling for each provider's format
3. Manages streaming responses
4. Routes tool execution to provider add-ons via messaging

**Message Handling:**

Listens for two types of messages:

1. **External Messages** (from tool provider add-ons):
   ```typescript
   browser.runtime.onMessageExternal.addListener((message, sender) => {
     // REGISTER_TOOLS: Add tools from an add-on
     // UNREGISTER_TOOLS: Remove tools from an add-on
   })
   ```

2. **Internal Messages** (from sidebar):
   ```typescript
   browser.runtime.onMessage.addListener((message) => {
     // INIT_AGENT: Initialize the AI agent
     // GET_TOOLS: Get list of registered tools
   })
   ```

3. **Port Connections** (for streaming):
   ```typescript
   browser.runtime.onConnect.addListener((port) => {
     // "agent-stream" port for real-time agent events
   })
   ```

### 2. AIKit Common Library

The `aikit-common` package provides shared utilities for tool development, significantly simplifying tool implementation.

#### ToolProvider Class

The `ToolProvider` class abstracts away the complexities of tool registration and message handling:

```typescript
export class ToolProvider {
  constructor(toolName: string, tools: ToolDescriptor[])

  registerHandlers(handlers: ToolHandlers): void
  register(): Promise<boolean>
  start(): void
}
```

**Features:**
- Automatic tool registration with retry logic (up to 20 attempts)
- Message listener setup and routing
- Error handling and formatting
- Response to `ORCHESTRATOR_READY` events
- Lifecycle management (startup, install events)

**Benefits:**
- Reduces boilerplate code by ~70 lines per tool
- Consistent error handling across all tools
- Automatic reconnection on orchestrator updates
- Type-safe interfaces

#### Shared Types

```typescript
export interface ToolDescriptor {
  name: string;
  label: string;
  description: string;
  parameters: any;
}

export interface ToolResult {
  content: Array<{ type: string; text: string }>;
  details?: any;
  error?: string;
}

export type ToolHandler = (params: any) => Promise<ToolResult>;
```

### 3. Tool Provider Add-ons

Add-ons that register and implement tools using `aikit-common`.

#### Modern Implementation (with ToolProvider)

```typescript
import { Type } from "@sinclair/typebox";
import { ToolProvider, ToolDescriptor } from "aikit-common";

const tools: ToolDescriptor[] = [
  {
    name: "tab.open",
    label: "Open Tab",
    description: "Open a new tab with the specified URL",
    parameters: Type.Object({
      url: Type.String({ description: "The URL to open" })
    })
  }
];

const toolHandlers = {
  "tab.open": async (params) => {
    const tab = await browser.tabs.create({ url: params.url });
    return {
      content: [{ type: "text", text: `Opened tab ${tab.id}` }],
      details: { tabId: tab.id }
    };
  }
};

const toolProvider = new ToolProvider("aikit-tabs-tool", tools);
toolProvider.registerHandlers(toolHandlers);
toolProvider.start();
```

This replaces the manual implementation that required:
- Defining interfaces (ToolDescriptor, OrchestratorMessage)
- Implementing registration function with retry logic
- Setting up external message listeners
- Handling ORCHESTRATOR_READY events
- Managing registration state

#### Execution Flow

1. User types prompt in sidebar
2. Sidebar sends prompt to background script via port
3. Background script calls `adapter.sendMessage()` with available tools
4. AI analyzes prompt and determines which tools to call
5. ToolRegistry checks permissions and executes tool
6. Execute function sends message to provider add-on
7. Provider executes action and returns result
8. Result flows back through AI adapter to sidebar
9. Sidebar displays result to user

## Message Flow Diagram

```
User Input ("Open google.com")
    │
    ▼
┌─────────────────┐
│  Sidebar UI     │
│  (sidebar.ts)   │
└────────┬────────┘
         │ Port.postMessage({ type: "EXECUTE_PROMPT" })
         ▼
┌─────────────────────────┐
│  Background Script      │
│  ToolRegistry           │
│    │                    │
│    ├─► adapter.sendMessage()
│    │                    │
│    │   AI analyzes      │
│    │   decides to call  │
│    │   "tab.open" tool  │
│    │                    │
│    ▼                    │
│  PermissionCheck        │
│    ▼                    │
│  executeTool()          │
└──────────┬──────────────┘
           │ browser.runtime.sendMessage(
           │   "aikit-tabs-tool@example.com",
           │   { type: "TOOL_EXECUTE", toolName: "tab.open", params: {...} }
           │ )
           ▼
┌────────────────────────┐
│  Tabs Tool Add-on      │
│                        │
│  toolHandlers["tab.open"]()
│    │                   │
│    ├─► browser.tabs.create()
│    │                   │
│    └─► Return result   │
└──────────┬─────────────┘
           │ { content: [...], details: {...} }
           ▼
┌─────────────────────────┐
│  Background Script      │
│  AI processes result    │
└──────────┬──────────────┘
           │ Port.postMessage({ type: "AGENT_EVENT", event: {...} })
           ▼
┌─────────────────┐
│  Sidebar UI     │
│  Display result │
└─────────────────┘
```

## Data Structures

### Tool Descriptor

```typescript
interface ToolDescriptor {
  name: string;           // Unique identifier (e.g., "tab.open")
  label: string;          // Display name
  description: string;    // AI uses this to understand the tool
  parameters: TypeBoxSchema; // TypeBox schema for validation
}
```

### Tool Execution Request

```typescript
interface ToolExecutionRequest {
  type: "TOOL_EXECUTE";
  toolName: string;       // Which tool to execute
  params: any;            // Validated parameters
  toolCallId: string;     // Unique ID for this execution
}
```

### Tool Execution Response

```typescript
interface ToolExecutionResponse {
  content: Array<{        // Content for the AI
    type: "text";
    text: string;
  }>;
  details?: any;          // Optional structured data
  error?: string;         // Set if execution failed
}
```

## AI Event Flow

The AI adapter emits events during execution:

1. **message_start**: AI starts generating response
2. **message_update**: Streaming response content
3. **tool_use**: Tool is being called
4. **tool_result**: Tool completed
5. **message_complete**: AI finished response
6. **error**: An error occurred

These events flow from background script to sidebar via Port API.

## Security Considerations

### Permission Model

- Tool provider add-ons request only permissions they need
- Orchestrator requires minimal permissions (storage, tabs)
- External message API prevents arbitrary add-ons from registering

### Message Validation

- TypeBox schemas validate tool parameters
- Unknown tools are rejected
- Errors are caught and reported safely

### API Key Storage

- API keys stored in `browser.storage.local`
- Only accessible by orchestrator add-on
- Never sent to tool providers

## Extension Points

The architecture supports extension through:

1. **New Tool Providers**: Any add-on can register tools
2. **Multiple AI Providers**: Support for Anthropic, OpenAI, and Google
3. **UI Customization**: Sidebar CSS can be themed
4. **Tool Categories**: Tools can be organized by namespace (e.g., `tab.*`, `bookmark.*`)

## Performance Considerations

- **Tool Registration**: Happens once at startup
- **Message Passing**: Async with promises
- **Streaming**: Port API for real-time updates
- **Build System**: Webpack bundles for optimal size

## Future Enhancements

Potential areas for expansion:

1. **Tool Discovery**: Marketplace or registry for tool add-ons
2. **Permissions UI**: Show what permissions tools request
3. **Tool Chaining**: Allow tools to call other tools
4. **Context Sharing**: Share browser context between tools
5. **Analytics**: Track tool usage and performance
6. **Multi-modal Tools**: Support image/file inputs
