/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Type } from "@sinclair/typebox";
import { ToolProvider, ToolDescriptor, ToolHandlers } from "aikit-common";

const tools: ToolDescriptor[] = [
  {
    name: "find.search",
    label: "Find in Page",
    description: "Search for text in the current page and return the number of matches found. Highlights all occurrences.",
    parameters: Type.Object({
      query: Type.String({ description: "Text to search for in the page" }),
      caseSensitive: Type.Optional(Type.Boolean({
        description: "Whether the search should be case sensitive",
        default: false
      })),
      entireWord: Type.Optional(Type.Boolean({
        description: "Whether to match entire words only",
        default: false
      }))
    })
  },
  {
    name: "find.highlight",
    label: "Highlight Search Results",
    description: "Highlight search results in the current page without clearing previous highlights.",
    parameters: Type.Object({
      query: Type.String({ description: "Text to highlight in the page" }),
      caseSensitive: Type.Optional(Type.Boolean({
        description: "Whether the search should be case sensitive",
        default: false
      }))
    })
  },
  {
    name: "find.clear",
    label: "Clear Highlights",
    description: "Remove all search highlights from the current page.",
    parameters: Type.Object({})
  },
  {
    name: "find.next",
    label: "Go to Next Match",
    description: "Navigate to the next occurrence of the search term in the current page.",
    parameters: Type.Object({
      query: Type.String({ description: "Text to search for" })
    })
  },
  {
    name: "find.previous",
    label: "Go to Previous Match",
    description: "Navigate to the previous occurrence of the search term in the current page.",
    parameters: Type.Object({
      query: Type.String({ description: "Text to search for" })
    })
  }
];

const toolHandlers: ToolHandlers = {
  "find.search": async (params) => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) {
        return {
          content: [{ type: "text", text: "No active tab found" }],
          error: "No active tab"
        };
      }

      const result = await browser.find.find(params.query, {
        tabId: tabs[0].id,
        caseSensitive: params.caseSensitive || false,
        entireWord: params.entireWord || false
      });

      if (result.count === 0) {
        return {
          content: [{ type: "text", text: `No matches found for "${params.query}"` }],
          details: { count: 0, query: params.query }
        };
      }

      await browser.find.highlightResults();

      return {
        content: [{
          type: "text",
          text: `Found ${result.count} match${result.count !== 1 ? 'es' : ''} for "${params.query}" in the page`
        }],
        details: {
          count: result.count,
          query: params.query,
          rangeData: result.rangeData
        }
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error searching: ${error.message}` }],
        error: error.message
      };
    }
  },

  "find.highlight": async (params) => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) {
        return {
          content: [{ type: "text", text: "No active tab found" }],
          error: "No active tab"
        };
      }

      const result = await browser.find.find(params.query, {
        tabId: tabs[0].id,
        caseSensitive: params.caseSensitive || false
      });

      if (result.count === 0) {
        return {
          content: [{ type: "text", text: `No matches found for "${params.query}"` }],
          details: { count: 0 }
        };
      }

      await browser.find.highlightResults();

      return {
        content: [{
          type: "text",
          text: `Highlighted ${result.count} occurrence${result.count !== 1 ? 's' : ''} of "${params.query}"`
        }],
        details: { count: result.count }
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error highlighting: ${error.message}` }],
        error: error.message
      };
    }
  },

  "find.clear": async () => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) {
        return {
          content: [{ type: "text", text: "No active tab found" }],
          error: "No active tab"
        };
      }

      await browser.find.removeHighlighting(tabs[0].id);

      return {
        content: [{ type: "text", text: "Cleared all search highlights from the page" }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error clearing highlights: ${error.message}` }],
        error: error.message
      };
    }
  },

  "find.next": async (params) => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) {
        return {
          content: [{ type: "text", text: "No active tab found" }],
          error: "No active tab"
        };
      }

      const result = await browser.find.find(params.query, {
        tabId: tabs[0].id
      });

      if (result.count === 0) {
        return {
          content: [{ type: "text", text: `No matches found for "${params.query}"` }],
          details: { count: 0 }
        };
      }

      await browser.find.highlightResults({
        rangeIndex: 0,
        noScroll: false
      });

      return {
        content: [{
          type: "text",
          text: `Navigated to next match (1 of ${result.count})`
        }],
        details: { count: result.count, currentIndex: 1 }
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error navigating: ${error.message}` }],
        error: error.message
      };
    }
  },

  "find.previous": async (params) => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) {
        return {
          content: [{ type: "text", text: "No active tab found" }],
          error: "No active tab"
        };
      }

      const result = await browser.find.find(params.query, {
        tabId: tabs[0].id
      });

      if (result.count === 0) {
        return {
          content: [{ type: "text", text: `No matches found for "${params.query}"` }],
          details: { count: 0 }
        };
      }

      const lastIndex = result.count - 1;
      await browser.find.highlightResults({
        rangeIndex: lastIndex,
        noScroll: false
      });

      return {
        content: [{
          type: "text",
          text: `Navigated to previous match (${result.count} of ${result.count})`
        }],
        details: { count: result.count, currentIndex: result.count }
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error navigating: ${error.message}` }],
        error: error.message
      };
    }
  }
};

const toolProvider = new ToolProvider("aikit-find-tool", tools);
toolProvider.registerHandlers(toolHandlers);
toolProvider.start();

console.log("AIKit Find Tool loaded");
