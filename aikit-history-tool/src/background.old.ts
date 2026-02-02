/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http:
 *
 * Copyright (c) 2026 Andrea Marchesini
 */

import { Type } from "@sinclair/typebox";

const ORCHESTRATOR_ID = "aikit-orchestrator@bnode.dev";

interface ToolDescriptor {
  name: string;
  label: string;
  description: string;
  parameters: any;
}

interface OrchestratorMessage {
  type: "ORCHESTRATOR_READY" | "TOOL_EXECUTE";
  toolName?: string;
  params?: any;
  toolCallId?: string;
}

const tools: ToolDescriptor[] = [
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

const toolHandlers: Record<string, (params: any) => Promise<any>> = {
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
};

let registrationAttempts = 0;
const MAX_REGISTRATION_ATTEMPTS = 20;
const RETRY_INTERVAL = 3000;

async function registerTools() {
  try {
    registrationAttempts++;
    console.log(`Registering history tools (attempt ${registrationAttempts})...`);

    await browser.runtime.sendMessage(ORCHESTRATOR_ID, {
      type: "REGISTER_TOOLS",
      tools
    });

    console.log("Successfully registered history tools:", tools.map(t => t.name));
    return true;
  } catch (error) {
    console.error("Failed to register history tools:", error);

    if (registrationAttempts < MAX_REGISTRATION_ATTEMPTS) {
      console.log(`Will retry in ${RETRY_INTERVAL / 1000} seconds...`);
      setTimeout(registerTools, RETRY_INTERVAL);
    }
    return false;
  }
}

browser.runtime.onMessageExternal.addListener(async (message: OrchestratorMessage, sender) => {
  if (message.type === "ORCHESTRATOR_READY") {
    registrationAttempts = 0;
    registerTools();
    return;
  }

  if (message.type === "TOOL_EXECUTE" && message.toolName) {
    const handler = toolHandlers[message.toolName];

    if (!handler) {
      return { error: `Unknown tool: ${message.toolName}` };
    }

    try {
      const result = await handler(message.params);
      return result;
    } catch (error: any) {
      console.error(`Error executing ${message.toolName}:`, error);
      return { error: error.message || "Unknown error" };
    }
  }
});

registerTools();

browser.runtime.onInstalled.addListener(() => {
  setTimeout(registerTools, 1000);
});

console.log("AIKit History Tool loaded");
