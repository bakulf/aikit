/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http:
 *
 * Copyright (c) 2026 Andrea Marchesini
 */

import { ToolDescriptor, OrchestratorMessage, ToolHandlers, ToolResult } from "./types";

const ORCHESTRATOR_ID = "aikit-orchestrator@bnode.dev";
const MAX_REGISTRATION_ATTEMPTS = 20;
const RETRY_INTERVAL = 3000;

export class ToolProvider {
  private toolName: string;
  private tools: ToolDescriptor[];
  private handlers: ToolHandlers = {};
  private registrationAttempts = 0;

  constructor(toolName: string, tools: ToolDescriptor[]) {
    this.toolName = toolName;
    this.tools = tools;
    this.setupListeners();
  }

  registerHandlers(handlers: ToolHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  async register(): Promise<boolean> {
    try {
      this.registrationAttempts++;
      console.log(`[${this.toolName}] Registering tools (attempt ${this.registrationAttempts})...`);

      await browser.runtime.sendMessage(ORCHESTRATOR_ID, {
        type: "REGISTER_TOOLS",
        tools: this.tools
      });

      console.log(`[${this.toolName}] Successfully registered tools:`, this.tools.map(t => t.name));
      return true;
    } catch (error) {
      console.error(`[${this.toolName}] Failed to register tools:`, error);

      if (this.registrationAttempts < MAX_REGISTRATION_ATTEMPTS) {
        console.log(`[${this.toolName}] Will retry in ${RETRY_INTERVAL / 1000} seconds...`);
        setTimeout(() => this.register(), RETRY_INTERVAL);
      } else {
        console.error(`[${this.toolName}] Max registration attempts reached`);
      }
      return false;
    }
  }

  private setupListeners(): void {
    browser.runtime.onMessageExternal.addListener(async (message: OrchestratorMessage, sender) => {
      if (message.type === "ORCHESTRATOR_READY") {
        console.log(`[${this.toolName}] Orchestrator is ready, registering tools...`);
        this.registrationAttempts = 0;
        this.register();
        return;
      }

      if (message.type === "TOOL_EXECUTE" && message.toolName) {
        const handler = this.handlers[message.toolName];

        if (!handler) {
          return { error: `Unknown tool: ${message.toolName}` };
        }

        try {
          const result = await handler(message.params);
          return result;
        } catch (error: any) {
          console.error(`[${this.toolName}] Error executing ${message.toolName}:`, error);
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            error: error.message || "Unknown error"
          };
        }
      }
    });

    browser.runtime.onInstalled.addListener(() => {
      setTimeout(() => this.register(), 1000);
    });
  }

  start(): void {
    this.register();
    console.log(`[${this.toolName}] Tool provider loaded`);
  }
}
