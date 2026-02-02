# AIKit Orchestrator

The main add-on that provides the AI interface and manages tool orchestration.

## Features

- 🤖 Sidebar interface for AI interaction
- 🔌 Extensible tool registration system
- 🎯 Multi-provider support (Anthropic, OpenAI, Google)
- 💬 Chat interface with response streaming
- 🛠️ Real-time display of registered tools

## Build

```bash
npm install
npm run build  # Production build
npm run dev    # Watch mode for development
```

Compiled files will be in `dist/`.

## Development

For development with hot reload:

```bash
npm run dev
```

Then in Firefox (about:debugging):
- Load Temporary Add-on → select `dist/manifest.json`
- Each TypeScript file change will be automatically recompiled
- Reload the add-on in about:debugging to see changes

## Configuration

1. Open the sidebar: View → Sidebar → AIKit Assistant
2. Click ⚙️ for settings
3. Select the AI provider
4. Enter your API key
5. Enter the model name (e.g., `claude-sonnet-4-20250514`)
6. Click "Save & Initialize"

### API Keys

- **Anthropic**: [console.anthropic.com](https://console.anthropic.com)
- **OpenAI**: [platform.openai.com](https://platform.openai.com)
- **Google**: [makersuite.google.com](https://makersuite.google.com)

## Architecture

```
src/
  background.ts  - Tool registry and AI agent management
  sidebar.ts     - Sidebar UI
sidebar.html     - Sidebar layout
sidebar.css      - Styles
```

### Background Script

The background script manages:
- `ToolRegistry`: Registration and management of tools from external add-ons
- `Agent`: AI agent initialization and execution
- Message passing between sidebar and tool providers

### API for Tool Providers

External add-ons can register tools by sending a message:

```typescript
browser.runtime.sendMessage("aikit-orchestrator@example.com", {
  type: "REGISTER_TOOLS",
  tools: [/* tool descriptors */]
});
```

## Dependencies

- `@anthropic-ai/sdk` - Anthropic Claude API
- `openai` - OpenAI API
- `@google/generative-ai` - Google Gemini API
- `@sinclair/typebox` - Schema validation
- `marked` - Markdown rendering

## Permissions

- `storage` - To save configuration, API keys, and permission settings
- `tabs` - To get current tab context for domain-aware permission checks
- `management` - To discover and communicate with tool add-ons
