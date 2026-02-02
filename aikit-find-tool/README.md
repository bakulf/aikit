# AIKit Find Tool

Find in page tools for AIKit Orchestrator.

## Features

- 🔍 Search for text in the current page
- ✨ Highlight all matches
- ➡️ Navigate to next/previous occurrence
- 🧹 Clear highlights

## Tools

### `find.search`
Search for text in the current page and highlight all matches.

**Parameters:**
- `query` (string, required): Text to search for
- `caseSensitive` (boolean, optional): Case sensitive search (default: false)
- `entireWord` (boolean, optional): Match entire words only (default: false)

**Example:**
```
"Find all occurrences of 'error' in the page"
"Search for 'TODO' case sensitive"
```

### `find.highlight`
Highlight search results without clearing previous highlights.

**Parameters:**
- `query` (string, required): Text to highlight
- `caseSensitive` (boolean, optional): Case sensitive search (default: false)

**Example:**
```
"Highlight the word 'important'"
```

### `find.clear`
Remove all search highlights from the current page.

**Example:**
```
"Clear all highlights"
"Remove search highlights"
```

### `find.next`
Navigate to the next occurrence of the search term.

**Parameters:**
- `query` (string, required): Text to search for

**Example:**
```
"Go to next 'TODO'"
```

### `find.previous`
Navigate to the previous occurrence of the search term.

**Parameters:**
- `query` (string, required): Text to search for

**Example:**
```
"Go to previous match"
```

## Build

```bash
npm install
npm run build
```

## Permissions

- `tabs` - To access the current tab
- `find` - To use the Find API
- `activeTab` - To search in the active tab

## License

MPL-2.0
