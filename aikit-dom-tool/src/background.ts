/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http:
 *
 * Copyright (c) 2026 Andrea Marchesini
 */

import { Type } from "@sinclair/typebox";
import { ToolProvider, ToolDescriptor } from "aikit-common";

const tools: ToolDescriptor[] = [
  {
    name: "dom.executeScript",
    label: "Execute JavaScript",
    description: "Execute JavaScript code in the current page to manipulate the DOM. Use this when the user wants to change, modify, or interact with elements on the current webpage. Generate JavaScript code that accomplishes what the user asks for.",
    parameters: Type.Object({
      code: Type.String({ description: "JavaScript code to execute in the page context. The code has full access to the DOM and can use document.querySelector, modify styles, add event listeners, etc." })
    })
  },
  {
    name: "dom.getPageInfo",
    label: "Get Page Info",
    description: "Get information about the current page (title, URL, HTML snippet)",
    parameters: Type.Object({})
  },
  {
    name: "dom.querySelector",
    label: "Query Selector",
    description: "Query elements in the page using CSS selector and get information about them",
    parameters: Type.Object({
      selector: Type.String({ description: "CSS selector to query elements (e.g., 'button', '.class-name', '#id')" })
    })
  }
];

const toolHandlers: Record<string, (params: any) => Promise<any>> = {
  "dom.executeScript": async (params) => {
    const { code } = params;

    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      throw new Error("No active tab found");
    }

    const tab = tabs[0];
    if (!tab.id) {
      throw new Error("Invalid tab ID");
    }

    const response = await browser.tabs.sendMessage(tab.id, {
      type: "EXECUTE_SCRIPT",
      code
    });

    if (response.success) {
      return {
        content: [
          {
            type: "text",
            text: `JavaScript executed successfully. Result: ${response.result}`
          }
        ],
        details: { result: response.result }
      };
    } else {
      throw new Error(response.error);
    }
  },

  "dom.getPageInfo": async (params) => {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      throw new Error("No active tab found");
    }

    const tab = tabs[0];
    if (!tab.id) {
      throw new Error("Invalid tab ID");
    }

    const response = await browser.tabs.sendMessage(tab.id, {
      type: "GET_PAGE_INFO"
    });

    if (response.success) {
      const info = response.info;
      return {
        content: [
          {
            type: "text",
            text: `Page Info:\nTitle: ${info.title}\nURL: ${info.url}\nHTML Preview: ${info.html.substring(0, 200)}...`
          }
        ],
        details: info
      };
    } else {
      throw new Error(response.error);
    }
  },

  "dom.querySelector": async (params) => {
    const { selector } = params;

    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      throw new Error("No active tab found");
    }

    const tab = tabs[0];
    if (!tab.id) {
      throw new Error("Invalid tab ID");
    }

    const response = await browser.tabs.sendMessage(tab.id, {
      type: "QUERY_SELECTOR",
      selector
    });

    if (response.success) {
      const summary = response.elements
        .map((el: any, i: number) => `${i + 1}. <${el.tag}> ${el.id ? `#${el.id}` : ""} ${el.classes.join(".")} - ${el.text}`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${response.count} element(s) matching "${selector}":\n${summary}`
          }
        ],
        details: { count: response.count, elements: response.elements }
      };
    } else {
      throw new Error(response.error);
    }
  }
};

const toolProvider = new ToolProvider("aikit-dom-tool", tools);
toolProvider.registerHandlers(toolHandlers);
toolProvider.start();
