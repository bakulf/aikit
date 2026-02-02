/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http:
 *
 * Copyright (c) 2026 Andrea Marchesini
 */

import { Type } from "@sinclair/typebox";
import { ToolProvider } from "aikit-common";

const tools = [
  {
    name: "history.search",
    label: "Search History",
    description: "Search browser history by text query",
    parameters: Type.Object({
      query: Type.String({ description: "Search query to match against page titles and URLs" }),
      maxResults: Type.Optional(Type.Number({ description: "Maximum number of results to return (default: 20)" }))
    })
  },
  {
    name: "history.recent",
    label: "Get Recent History",
    description: "Get most recent history items",
    parameters: Type.Object({
      count: Type.Optional(Type.Number({ description: "Number of recent items to return (default: 10)" }))
    })
  },
  {
    name: "history.delete",
    label: "Delete History Item",
    description: "Delete a specific URL from history",
    parameters: Type.Object({
      url: Type.String({ description: "URL to delete from history" })
    })
  },
  {
    name: "history.deleteRange",
    label: "Delete History Range",
    description: "Delete all history items in a time range",
    parameters: Type.Object({
      startTime: Type.Number({ description: "Start time in milliseconds since epoch" }),
      endTime: Type.Number({ description: "End time in milliseconds since epoch" })
    })
  }
];

const provider = new ToolProvider("aikit-history-tool", tools);

provider.registerHandlers({
  "history.search": async (params) => {
    const { query, maxResults = 20 } = params;
    const results = await browser.history.search({
      text: query,
      maxResults,
      startTime: 0
    });

    const formatted = results
      .map((item, i) => `${i + 1}. ${item.title} - ${item.url}\n   Last visit: ${new Date(item.lastVisitTime!).toLocaleString()}`)
      .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: results.length > 0
            ? `Found ${results.length} history item(s) matching "${query}":\n\n${formatted}`
            : `No history items found matching "${query}"`
        }
      ],
      details: { results }
    };
  },

  "history.recent": async (params) => {
    const { count = 10 } = params;
    const results = await browser.history.search({
      text: "",
      maxResults: count,
      startTime: 0
    });

    const formatted = results
      .map((item, i) => `${i + 1}. ${item.title} - ${item.url}\n   Last visit: ${new Date(item.lastVisitTime!).toLocaleString()}`)
      .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: `Recent ${results.length} history item(s):\n\n${formatted}`
        }
      ],
      details: { results }
    };
  },

  "history.delete": async (params) => {
    const { url } = params;
    await browser.history.deleteUrl({ url });

    return {
      content: [
        {
          type: "text",
          text: `Deleted "${url}" from history`
        }
      ],
      details: { url }
    };
  },

  "history.deleteRange": async (params) => {
    const { startTime, endTime } = params;
    await browser.history.deleteRange({ startTime, endTime });

    const startDate = new Date(startTime).toLocaleString();
    const endDate = new Date(endTime).toLocaleString();

    return {
      content: [
        {
          type: "text",
          text: `Deleted history from ${startDate} to ${endDate}`
        }
      ],
      details: { startTime, endTime }
    };
  }
});

provider.start();
