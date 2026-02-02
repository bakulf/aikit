# AIKit Bookmarks Tool

Browser extension that provides bookmark management tools for AIKit Orchestrator.

## Features

This extension provides the following tools for managing bookmarks:

- **bookmark.create** - Create a new bookmark with title and URL
- **bookmark.search** - Search bookmarks by title or URL
- **bookmark.list** - List bookmarks in a specific folder
- **bookmark.remove** - Remove a bookmark by ID
- **bookmark.getTree** - Get the complete bookmark tree structure
- **bookmark.createFolder** - Create a new bookmark folder
- **bookmark.move** - Move a bookmark to a different folder
- **bookmark.update** - Update a bookmark's title or URL

## Installation

1. Build the extension:
   ```bash
   npm install
   npm run build
   ```

2. Load the extension in Firefox:
   - Open `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the `dist/` folder

3. Make sure the AIKit Orchestrator extension is also installed

## Usage

Once installed, the bookmark tools will be automatically registered with the AIKit Orchestrator. You can then use them through the AI assistant in the sidebar.

### Example Commands

- "Create a bookmark for github.com with title GitHub"
- "Search for bookmarks about AI"
- "List all bookmarks in my work folder"
- "Create a new folder called Projects"
- "Move bookmark [id] to folder [folder-id]"

## Development

- **Build for production**: `npm run build`
- **Build for development** (with watch): `npm run dev`

## Requirements

- Firefox 109.0 or higher
- AIKit Orchestrator extension must be installed
