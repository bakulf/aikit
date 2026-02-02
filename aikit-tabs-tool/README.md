# AIKit Tabs Tool

Example tool add-on that provides tab management functionality for AIKit Orchestrator.

## Features

Provides 6 tools for tab management:

### `tab.open`
Open a new tab with specified URL.
```
"Open google.com"
"Open https://github.com in a new tab"
```

### `tab.close`
Close tabs by ID or URL.
```
"Close the tab with google.com"
"Close all facebook tabs"
```

### `tab.list`
List all open tabs.
```
"What tabs do I have open?"
"List all tabs"
```

### `tab.activate`
Activate/switch to a specific tab.
```
"Go to the tab with github"
"Activate tab 5"
```

### `tab.reload`
Reload a tab.
```
"Reload this tab"
"Refresh the current tab"
```

### `tab.search`
Search tabs by title or URL.
```
"Search for tabs with 'youtube'"
"Find all mozilla.org tabs"
```

## Build

```bash
npm install
npm run build  # Production build
npm run dev    # Watch mode for development
```

## Installation

1. Make sure **AIKit Orchestrator** is installed
2. Load Temporary Add-on in Firefox (about:debugging)
3. Select `dist/manifest.json`
4. Tools will be automatically registered on startup

## How It Works

1. On startup, the add-on sends a registration message to the orchestrator
2. Defines available tools with parameter schemas (TypeBox)
3. When the AI decides to use a tool, the orchestrator sends a request to this add-on
4. The add-on executes the action using the `browser.tabs` API
5. Returns the result to the orchestrator

## Structure

```typescript
// Tool descriptor
{
  name: "tab.open",
  label: "Open Tab",
  description: "Open a new tab with the specified URL",
  parameters: Type.Object({
    url: Type.String({ description: "The URL to open" }),
    active: Type.Optional(Type.Boolean())
  })
}

// Tool handler
toolHandlers["tab.open"] = async (params) => {
  const tab = await browser.tabs.create({ url: params.url });
  return {
    content: [{ type: "text", text: `Opened tab ${tab.id}` }],
    details: { tabId: tab.id }
  };
};
```

## Extending with New Tools

To add new tools:

1. Add the descriptor to the `tools` array
2. Implement the handler in `toolHandlers`
3. Rebuild

Example:

```typescript
// Add to tools[]
{
  name: "tab.duplicate",
  label: "Duplicate Tab",
  description: "Duplicate a tab",
  parameters: Type.Object({
    tabId: Type.Number({ description: "Tab ID to duplicate" })
  })
}

// Add handler
toolHandlers["tab.duplicate"] = async (params) => {
  const tab = await browser.tabs.duplicate(params.tabId);
  return {
    content: [{ type: "text", text: `Duplicated tab ${params.tabId}` }],
    details: { newTabId: tab.id }
  };
};
```

## Permissions

- `tabs` - For tab operations
- `activeTab` - To access the current tab

## Dependencies

- `@sinclair/typebox` - Schema validation for parameters
