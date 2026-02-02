/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http:
 *
 * Copyright (c) 2026 Andrea Marchesini
 */

browser.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
  if (message.type === "EXECUTE_SCRIPT") {
    try {
      const result = eval(message.code);
      sendResponse({
        success: true,
        result: result !== undefined ? String(result) : "Script executed successfully"
      });
    } catch (error: any) {
      sendResponse({
        success: false,
        error: error.message || "Unknown error"
      });
    }
    return true;
  }

  if (message.type === "GET_PAGE_INFO") {
    try {
      const info = {
        title: document.title,
        url: window.location.href,
        html: document.documentElement.outerHTML.substring(0, 5000)
      };
      sendResponse({
        success: true,
        info
      });
    } catch (error: any) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
    return true;
  }

  if (message.type === "QUERY_SELECTOR") {
    try {
      const elements = Array.from(document.querySelectorAll(message.selector));
      const info = elements.slice(0, 10).map(el => ({
        tag: el.tagName.toLowerCase(),
        id: el.id,
        classes: Array.from(el.classList),
        text: el.textContent?.substring(0, 100)
      }));
      sendResponse({
        success: true,
        count: elements.length,
        elements: info
      });
    } catch (error: any) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
    return true;
  }
});

console.log("AIKit DOM Tool content script loaded");
