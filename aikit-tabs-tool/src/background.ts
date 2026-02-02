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
    name: "tab.open",
    label: "Open Tab",
    description: "Open a new tab with the specified URL, optionally in a specific container",
    parameters: Type.Object({
      url: Type.String({ description: "The URL to open" }),
      active: Type.Optional(Type.Boolean({ description: "Whether to activate the tab (default: true)" })),
      cookieStoreId: Type.Optional(Type.String({ description: "Container ID to open the tab in (e.g., 'firefox-container-1')" }))
    })
  },
  {
    name: "tab.close",
    label: "Close Tab",
    description: "Close a tab by its ID or URL",
    parameters: Type.Object({
      tabId: Type.Optional(Type.Number({ description: "The ID of the tab to close" })),
      url: Type.Optional(Type.String({ description: "Close tab(s) matching this URL" }))
    })
  },
  {
    name: "tab.list",
    label: "List Tabs",
    description: "List all open tabs",
    parameters: Type.Object({
      currentWindow: Type.Optional(Type.Boolean({ description: "Only list tabs in current window (default: false)" }))
    })
  },
  {
    name: "tab.activate",
    label: "Activate Tab",
    description: "Switch to a specific tab",
    parameters: Type.Object({
      tabId: Type.Optional(Type.Number({ description: "The ID of the tab to activate" })),
      url: Type.Optional(Type.String({ description: "Activate tab matching this URL" }))
    })
  },
  {
    name: "tab.reload",
    label: "Reload Tab",
    description: "Reload a tab",
    parameters: Type.Object({
      tabId: Type.Optional(Type.Number({ description: "The ID of the tab to reload (default: current tab)" }))
    })
  },
  {
    name: "tab.search",
    label: "Search Tabs",
    description: "Search for tabs by title or URL",
    parameters: Type.Object({
      query: Type.String({ description: "Search query to match against tab titles and URLs" })
    })
  },
  {
    name: "container.list",
    label: "List Containers",
    description: "List all available containers (contextual identities)",
    parameters: Type.Object({})
  },
  {
    name: "container.create",
    label: "Create Container",
    description: "Create a new container with specified name and color",
    parameters: Type.Object({
      name: Type.String({ description: "Name of the container" }),
      color: Type.Optional(Type.String({ description: "Color of the container (blue, turquoise, green, yellow, orange, red, pink, purple)" })),
      icon: Type.Optional(Type.String({ description: "Icon for the container (fingerprint, briefcase, dollar, cart, circle, gift, vacation, food, fruit, pet, tree, chill)" }))
    })
  },
  {
    name: "container.remove",
    label: "Remove Container",
    description: "Remove a container by its cookie store ID",
    parameters: Type.Object({
      cookieStoreId: Type.String({ description: "The cookie store ID of the container to remove" })
    })
  }
];

const toolHandlers: Record<string, (params: any) => Promise<any>> = {
  "tab.open": async (params) => {
    const { url, active = true, cookieStoreId } = params;

    let finalUrl = url;
    if (!url.match(/^https?:\/\//)) {
      finalUrl = `https://${url}`;
    }

    const createOptions: any = {
      url: finalUrl,
      active
    };

    if (cookieStoreId) {
      createOptions.cookieStoreId = cookieStoreId;
    }

    const tab = await browser.tabs.create(createOptions);

    const containerInfo = cookieStoreId ? ` in container ${cookieStoreId}` : "";

    return {
      content: [
        {
          type: "text",
          text: `Opened tab ${tab.id} with URL: ${finalUrl}${containerInfo}`
        }
      ],
      details: {
        tabId: tab.id,
        url: finalUrl,
        active,
        cookieStoreId: tab.cookieStoreId
      }
    };
  },

  "tab.close": async (params) => {
    const { tabId, url } = params;

    if (tabId !== undefined) {
      await browser.tabs.remove(tabId);
      return {
        content: [{ type: "text", text: `Closed tab ${tabId}` }],
        details: { tabId }
      };
    } else if (url) {
      const tabs = await browser.tabs.query({ url });
      const tabIds = tabs.map(t => t.id!).filter(id => id !== undefined);

      if (tabIds.length === 0) {
        throw new Error(`No tabs found with URL: ${url}`);
      }

      await browser.tabs.remove(tabIds);
      return {
        content: [{ type: "text", text: `Closed ${tabIds.length} tab(s) matching URL: ${url}` }],
        details: { closedTabs: tabIds.length }
      };
    } else {
      throw new Error("Either tabId or url must be provided");
    }
  },

  "tab.list": async (params) => {
    const { currentWindow = false } = params;

    const tabs = await browser.tabs.query(currentWindow ? { currentWindow: true } : {});

    const tabList = tabs.map(tab => ({
      id: tab.id,
      title: tab.title,
      url: tab.url,
      active: tab.active,
      windowId: tab.windowId,
      cookieStoreId: tab.cookieStoreId
    }));

    const summary = tabList
      .map((tab, index) => {
        const activeStr = tab.active ? " (active)" : "";
        const containerStr = tab.cookieStoreId && tab.cookieStoreId !== "firefox-default"
          ? ` [container: ${tab.cookieStoreId}]`
          : "";
        return `${index + 1}. [${tab.id}] ${tab.title} - ${tab.url}${activeStr}${containerStr}`;
      })
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Found ${tabList.length} tab(s):\n${summary}`
        }
      ],
      details: { tabs: tabList }
    };
  },

  "tab.activate": async (params) => {
    const { tabId, url } = params;

    if (tabId !== undefined) {
      await browser.tabs.update(tabId, { active: true });
      return {
        content: [{ type: "text", text: `Activated tab ${tabId}` }],
        details: { tabId }
      };
    } else if (url) {
      const tabs = await browser.tabs.query({ url });

      if (tabs.length === 0) {
        throw new Error(`No tabs found with URL: ${url}`);
      }

      const tab = tabs[0];
      await browser.tabs.update(tab.id!, { active: true });

      return {
        content: [{ type: "text", text: `Activated tab ${tab.id}: ${tab.title}` }],
        details: { tabId: tab.id, title: tab.title }
      };
    } else {
      throw new Error("Either tabId or url must be provided");
    }
  },

  "tab.reload": async (params) => {
    const { tabId } = params;

    if (tabId !== undefined) {
      await browser.tabs.reload(tabId);
      return {
        content: [{ type: "text", text: `Reloaded tab ${tabId}` }],
        details: { tabId }
      };
    } else {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0) {
        const tab = tabs[0];
        await browser.tabs.reload(tab.id!);
        return {
          content: [{ type: "text", text: `Reloaded current tab: ${tab.title}` }],
          details: { tabId: tab.id, title: tab.title }
        };
      } else {
        throw new Error("No active tab found");
      }
    }
  },

  "tab.search": async (params) => {
    const { query } = params;
    const queryLower = query.toLowerCase();

    const allTabs = await browser.tabs.query({});

    const matchingTabs = allTabs.filter(tab => {
      const titleMatch = tab.title?.toLowerCase().includes(queryLower);
      const urlMatch = tab.url?.toLowerCase().includes(queryLower);
      return titleMatch || urlMatch;
    });

    const tabList = matchingTabs.map(tab => ({
      id: tab.id,
      title: tab.title,
      url: tab.url,
      active: tab.active
    }));

    const summary = tabList
      .map((tab, index) => `${index + 1}. [${tab.id}] ${tab.title} - ${tab.url}`)
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: matchingTabs.length > 0
            ? `Found ${matchingTabs.length} tab(s) matching "${query}":\n${summary}`
            : `No tabs found matching "${query}"`
        }
      ],
      details: { tabs: tabList }
    };
  },

  "container.list": async (params) => {
    if (!browser.contextualIdentities) {
      return {
        content: [
          {
            type: "text",
            text: "Containers are not supported in this browser"
          }
        ],
        error: "Containers not supported"
      };
    }

    const containers = await browser.contextualIdentities.query({});

    const containerList = containers.map(c => ({
      cookieStoreId: c.cookieStoreId,
      name: c.name,
      color: c.color,
      icon: c.icon
    }));

    const summary = containerList
      .map((c, index) => `${index + 1}. ${c.name} [${c.cookieStoreId}] (${c.color}, ${c.icon})`)
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: containers.length > 0
            ? `Found ${containers.length} container(s):\n${summary}`
            : "No containers found"
        }
      ],
      details: { containers: containerList }
    };
  },

  "container.create": async (params) => {
    if (!browser.contextualIdentities) {
      return {
        content: [
          {
            type: "text",
            text: "Containers are not supported in this browser"
          }
        ],
        error: "Containers not supported"
      };
    }

    const { name, color = "blue", icon = "fingerprint" } = params;

    const container = await browser.contextualIdentities.create({
      name,
      color,
      icon
    });

    return {
      content: [
        {
          type: "text",
          text: `Created container "${name}" [${container.cookieStoreId}] with color ${color} and icon ${icon}`
        }
      ],
      details: {
        cookieStoreId: container.cookieStoreId,
        name: container.name,
        color: container.color,
        icon: container.icon
      }
    };
  },

  "container.remove": async (params) => {
    if (!browser.contextualIdentities) {
      return {
        content: [
          {
            type: "text",
            text: "Containers are not supported in this browser"
          }
        ],
        error: "Containers not supported"
      };
    }

    const { cookieStoreId } = params;

    const container = await browser.contextualIdentities.get(cookieStoreId);

    await browser.contextualIdentities.remove(cookieStoreId);

    return {
      content: [
        {
          type: "text",
          text: `Removed container "${container.name}" [${cookieStoreId}]`
        }
      ],
      details: {
        cookieStoreId,
        name: container.name
      }
    };
  }
};

const toolProvider = new ToolProvider("aikit-tabs-tool", tools);
toolProvider.registerHandlers(toolHandlers);
toolProvider.start();
