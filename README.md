# AIKit - Extensible AI Assistant for Firefox

**Note: This is a Proof of Concept (PoC) demonstrating AI-powered browser automation through an extensible tool system. Built with vibecoding - following the flow and exploring what's possible.**

AIKit is a modular add-on system for Firefox that enables interaction with various AI models (Anthropic, OpenAI, Google) through a sidebar interface, using an extensible tool system.

## ⚠️ Security and Privacy Warning

**This project is a security and privacy nightmare by design.** Before using AIKit, understand what you're sharing:

### What Gets Transmitted to Third Parties

When you use AIKit, the following data is sent to AI providers (Anthropic, OpenAI, or Google):

- **Your prompts and commands** - Everything you type in the chat
- **Tab information** - URLs, titles, and metadata of all your open tabs
- **Browsing history** - When using history search
- **Bookmark data** - All your saved bookmarks with URLs and titles
- **Page content** - Full HTML, text, and DOM structure when using DOM tools
- **Screenshots** - Visual content of web pages
- **Download information** - Files you're downloading, their URLs and names
- **Container data** - Your Firefox container setup and organization

### Privacy Risks

- **Data aggregation**: AI providers could theoretically build detailed profiles of your browsing behavior
- **Third-party storage**: Your data passes through and may be stored by big tech companies
- **No control**: Once data is sent, you have no control over how it's processed or stored
- **Potential logging**: Conversations and tool calls might be logged for AI training or monitoring
- **Sensitive information**: Personal data, credentials, financial info visible in tabs/history could be exposed
- **Cross-site tracking**: Your browsing patterns across different sites become visible to a single entity

### Recommendations

- **DO NOT use with sensitive data**: Banking, healthcare, personal communications
- **DO NOT use on work computers**: Company data could be exposed
- **Use a separate browser profile**: Create a dedicated Firefox profile for AIKit
- **Review what you share**: Be conscious of what tabs are open and what you're asking
- **Consider self-hosted alternatives**: Look into local AI models if privacy is critical
- **Read provider policies**: Understand Anthropic/OpenAI/Google's data retention policies
- **This is a PoC**: Not intended for production use or sensitive environments

### Why This Architecture?

This design prioritizes functionality and ease of development over privacy. The AI needs context to be useful, but this comes at a significant privacy cost. Future iterations could explore:
- Local AI models (though limited capabilities)
- Differential privacy techniques
- User-controlled data filtering
- On-device processing where possible

**Use AIKit knowing that you're trading privacy for convenience. Consider the risks carefully.**

![AIKit Screenshot](screenshot.png)

## Architecture

The project consists of:

### aikit-orchestrator (Main Add-on)
The main orchestrator that:
- Provides a sidebar with chat interface
- Integrates various AI providers (Anthropic, OpenAI, Google)
- Manages tool registration and execution from other add-ons
- Allows compatible add-ons to register and provide functionality

### aikit-common (Shared Library)
Shared library that simplifies tool development:
- `ToolProvider` class for automatic tool registration
- Type definitions and interfaces
- Message handling and error management

### Tool Add-ons

Available tools:
- **aikit-tabs-tool** - Tab management (open, close, list, activate, reload, search) and container management
- **aikit-bookmarks-tool** - Bookmark management (create, search, list, remove, organize)
- **aikit-dom-tool** - DOM manipulation (execute JavaScript, query elements, get page info)
- **aikit-downloads-tool** - Download management (list, pause, resume, cancel)
- **aikit-history-tool** - Browser history (search, recent items)
- **aikit-screenshot-tool** - Screenshot capture (visible area, full page, download)

## How It Works

1. Tool add-ons register themselves with the orchestrator on startup
2. When the user makes a request, the AI analyzes the prompt and decides which tools to use
3. The orchestrator sends execution requests to the appropriate tool add-ons
4. Tool add-ons execute actions and return results
5. The AI uses the results to complete the response

## Setup and Build

### Prerequisites
- Node.js 18+
- npm

### Build

```bash
./build.sh
```

This will build aikit-common, aikit-orchestrator, and all tool add-ons.

Other available commands:
- `./build.sh install` - Install all dependencies
- `./build.sh clean` - Clean build artifacts
- `./build.sh build --addon aikit-tabs-tool` - Build specific addon
- `./build.sh help` - Show all options

### Installation in Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `aikit-orchestrator/dist/manifest.json`
4. Load each tool's `dist/manifest.json` you want to use

### Configuration

1. Open the AIKit sidebar (View → Sidebar → AIKit Assistant)
2. Click the ⚙️ icon to open settings
3. Enter your API key for the chosen provider (Anthropic, OpenAI, or Google)
4. Save and initialize

## Developing New Tool Add-ons

The beauty of AIKit's architecture is that **the sky's the limit** - you can create tools for virtually anything your browser can access. The current tools are just the beginning.

### Potential Tool Ideas

The extensible system opens up endless possibilities:

**Communication & Social**
- Gmail integration (read, compose, search emails)
- WhatsApp Web automation (send messages, read conversations)
- Slack, Discord, Teams integration
- Twitter/X posting and timeline management
- LinkedIn automation

**Productivity**
- Google Calendar/Drive integration
- Notion, Trello, Asana task management
- GitHub/GitLab issue and PR management
- Jira ticket automation
- Cloud storage operations (Dropbox, OneDrive)

**E-commerce & Finance**
- Amazon shopping and order tracking
- Banking operations (balance checks, transaction history)
- Stock market monitoring
- Price comparison across sites
- Shopping cart automation

**Content & Media**
- YouTube video management
- Spotify/music control
- Netflix/streaming automation
- RSS feed aggregation
- PDF manipulation and reading

**Development Tools**
- Code execution and testing
- API testing and monitoring
- Database queries
- Server management
- DevOps automation

**And Much More...**
The only limit is your imagination! Any web service or browser capability can become an AI-controlled tool.

### Getting Started

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed instructions on creating new tool add-ons.

Quick overview:
- Use `aikit-common` library for simplified implementation
- Define tools using TypeBox schemas
- Implement handlers for your tools
- Use `ToolProvider` class to handle registration automatically

Example:
```typescript
import { Type } from "@sinclair/typebox";
import { ToolProvider, ToolDescriptor } from "aikit-common";

const tools: ToolDescriptor[] = [
  {
    name: "my_tool.action",
    label: "My Action",
    description: "Description of what this tool does",
    parameters: Type.Object({
      param1: Type.String({ description: "Parameter description" })
    })
  }
];

const toolHandlers = {
  "my_tool.action": async (params) => {
    return {
      content: [{ type: "text", text: "Result..." }]
    };
  }
};

const toolProvider = new ToolProvider("aikit-my-tool", tools);
toolProvider.registerHandlers(toolHandlers);
toolProvider.start();
```

## Supported AI Providers

### Anthropic Claude
- **Models**: Visit [docs.anthropic.com](https://docs.anthropic.com/en/docs/about-claude/models) for current model list
- **Features**: Full tool calling support, streaming responses
- **API Key**: Get from [console.anthropic.com](https://console.anthropic.com)

### OpenAI
- **Models**: Visit [platform.openai.com/docs/models](https://platform.openai.com/docs/models) for current model list
- **Features**: Full tool calling support with function calling API
- **API Key**: Get from [platform.openai.com](https://platform.openai.com)

### Google Gemini
- **Models**: Visit [ai.google.dev/models](https://ai.google.dev/models) for current model list
- **Features**: Basic chat (limited tool support in current version)
- **API Key**: Get from [makersuite.google.com](https://makersuite.google.com)

## License

MPL-2.0

Copyright (c) 2026 Andrea Marchesini

## Credits

Built with browser-compatible SDKs from:
- [@anthropic-ai/sdk](https://www.npmjs.com/package/@anthropic-ai/sdk)
- [openai](https://www.npmjs.com/package/openai)
- [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai)

Originally inspired by [pi-mono](https://github.com/badlogic/pi-mono) by @mariozechner.
