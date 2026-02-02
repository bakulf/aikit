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
    name: "downloads.list",
    label: "List Downloads",
    description: "List recent downloads",
    parameters: Type.Object({
      limit: Type.Optional(Type.Number({ description: "Maximum number of downloads to list (default: 10)" }))
    })
  },
  {
    name: "downloads.pause",
    label: "Pause Download",
    description: "Pause an active download",
    parameters: Type.Object({
      downloadId: Type.Number({ description: "ID of the download to pause" })
    })
  },
  {
    name: "downloads.resume",
    label: "Resume Download",
    description: "Resume a paused download",
    parameters: Type.Object({
      downloadId: Type.Number({ description: "ID of the download to resume" })
    })
  },
  {
    name: "downloads.cancel",
    label: "Cancel Download",
    description: "Cancel an active or paused download",
    parameters: Type.Object({
      downloadId: Type.Number({ description: "ID of the download to cancel" })
    })
  },
  {
    name: "downloads.open",
    label: "Open Download",
    description: "Open a completed download file",
    parameters: Type.Object({
      downloadId: Type.Number({ description: "ID of the download to open" })
    })
  },
  {
    name: "downloads.showInFolder",
    label: "Show in Folder",
    description: "Show download in system file manager",
    parameters: Type.Object({
      downloadId: Type.Number({ description: "ID of the download" })
    })
  }
];

const provider = new ToolProvider("aikit-downloads-tool", tools);

provider.registerHandlers({
  "downloads.list": async (params) => {
    const { limit = 10 } = params;
    const downloads = await browser.downloads.search({ limit, orderBy: ["-startTime"] });

    const formatted = downloads
      .map((d, i) => `${i + 1}. [${d.id}] ${d.filename}\n   URL: ${d.url}\n   Status: ${d.state}\n   ${d.fileSize ? `Size: ${Math.round(d.fileSize / 1024)}KB` : ""}`)
      .join("\n\n");

    return {
      content: [{ type: "text", text: downloads.length > 0 ? `Recent ${downloads.length} download(s):\n\n${formatted}` : "No downloads found" }],
      details: { downloads }
    };
  },

  "downloads.pause": async (params) => {
    await browser.downloads.pause(params.downloadId);
    return {
      content: [{ type: "text", text: `Paused download ${params.downloadId}` }],
      details: { downloadId: params.downloadId }
    };
  },

  "downloads.resume": async (params) => {
    await browser.downloads.resume(params.downloadId);
    return {
      content: [{ type: "text", text: `Resumed download ${params.downloadId}` }],
      details: { downloadId: params.downloadId }
    };
  },

  "downloads.cancel": async (params) => {
    await browser.downloads.cancel(params.downloadId);
    return {
      content: [{ type: "text", text: `Cancelled download ${params.downloadId}` }],
      details: { downloadId: params.downloadId }
    };
  },

  "downloads.open": async (params) => {
    await browser.downloads.open(params.downloadId);
    return {
      content: [{ type: "text", text: `Opened download ${params.downloadId}` }],
      details: { downloadId: params.downloadId }
    };
  },

  "downloads.showInFolder": async (params) => {
    await browser.downloads.show(params.downloadId);
    return {
      content: [{ type: "text", text: `Showing download ${params.downloadId} in folder` }],
      details: { downloadId: params.downloadId }
    };
  }
});

provider.start();
