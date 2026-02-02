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
    name: "screenshot.visible",
    label: "Screenshot Visible Area",
    description: "Capture screenshot of the visible area of the current tab",
    parameters: Type.Object({})
  },
  {
    name: "screenshot.full",
    label: "Screenshot Full Page",
    description: "Capture screenshot of the entire page (full height)",
    parameters: Type.Object({})
  },
  {
    name: "screenshot.download",
    label: "Download Screenshot",
    description: "Take a screenshot and automatically download it",
    parameters: Type.Object({
      filename: Type.Optional(Type.String({ description: "Filename for the screenshot (default: screenshot-[timestamp].png)" }))
    })
  }
];

const provider = new ToolProvider("aikit-screenshot-tool", tools);

provider.registerHandlers({
  "screenshot.visible": async (params) => {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) throw new Error("No active tab found");
    if (!tabs[0].id) throw new Error("Invalid tab ID");

    const dataUrl = await browser.tabs.captureVisibleTab();

    return {
      content: [{ type: "text", text: `Screenshot captured of visible area (${dataUrl.length} bytes)` }],
      details: { dataUrl: dataUrl.substring(0, 100) + "...", size: dataUrl.length }
    };
  },

  "screenshot.full": async (params) => {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) throw new Error("No active tab found");
    if (!tabs[0].id) throw new Error("Invalid tab ID");

    const dataUrl = await browser.tabs.captureVisibleTab();

    return {
      content: [{ type: "text", text: `Full page screenshot captured (${dataUrl.length} bytes). Note: Firefox captures visible area only, full page requires scrolling.` }],
      details: { dataUrl: dataUrl.substring(0, 100) + "...", size: dataUrl.length }
    };
  },

  "screenshot.download": async (params) => {
    const { filename } = params;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const finalFilename = filename || `screenshot-${timestamp}.png`;

    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) throw new Error("No active tab found");

    const dataUrl = await browser.tabs.captureVisibleTab();

    await browser.downloads.download({
      url: dataUrl,
      filename: finalFilename,
      saveAs: true
    });

    return {
      content: [{ type: "text", text: `Screenshot saved as "${finalFilename}"` }],
      details: { filename: finalFilename, size: dataUrl.length }
    };
  }
});

provider.start();
