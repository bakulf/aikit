# Contributing to AIKit

Thank you for your interest in contributing to AIKit!

## Before You Start

Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand:
- How the system works
- How to use `aikit-common` library
- Message flow and tool implementation
- All technical details you need

## Contributing Code

### Creating a New Tool

1. Read [ARCHITECTURE.md](ARCHITECTURE.md) thoroughly
2. Look at existing tools (e.g., `aikit-tabs-tool`, `aikit-bookmarks-tool`) for reference
3. Use `aikit-common` library - never implement registration/messaging manually
4. Follow the existing code structure and patterns

### Code Style

- Use TypeScript with strict mode enabled
- No single-line comments (code should be self-explanatory)
- Use meaningful variable and function names
- Always use `aikit-common` for tool implementation
- Add copyright header to all source files:

```typescript
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
```

### Best Practices

**Tool Design:**
- Clear, concise descriptions for tools and parameters
- Use TypeBox schemas for parameter validation
- Handle errors gracefully with descriptive messages
- Use dot notation for tool names (e.g., `category.action`)

**Response Format:**
```typescript
{
  content: [{ type: "text", text: "Human-readable result" }],
  details?: { /* structured data */ }
}
```

**Security:**
- Validate and sanitize all input
- Request only minimum required permissions
- Consider confirmation dialogs for sensitive operations

## Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-tool`)
3. Implement your changes following the guidelines above
4. Build and test locally: `./build.sh`
5. Commit with clear messages
6. Push to your fork
7. Open a pull request with:
   - Clear description of what the tool does
   - Why it's useful
   - Any special permissions required
   - Testing instructions

## Testing Your Changes

```bash
./build.sh
```

Load the extensions in Firefox (`about:debugging#/runtime/this-firefox`) and test thoroughly.

## Questions?

- Check existing issues on GitHub
- Create a new issue with the "question" label
- Provide as much context as possible

## License

By contributing to AIKit, you agree that your contributions will be licensed under the MPL-2.0 License.
