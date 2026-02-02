/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2026 Andrea Marchesini
 */

import type {
  PermissionDecision,
  PermissionContext,
  PermissionCheckResult,
  PermissionsData,
  PermissionMetadata
} from "./types";

const STORAGE_KEYS = {
  TOOLS: "aikit.permissions.tools",
  DOMAINS: "aikit.permissions.domains",
  METADATA: "aikit.permissions.metadata",
  AUTO_APPROVE: "aikit.permissions.autoApprove"
};

const DOMAIN_AWARE_PREFIXES = ["dom.", "screenshot."];

export class PermissionManager {
  async checkPermission(
    toolName: string,
    context: PermissionContext = {}
  ): Promise<PermissionCheckResult> {
    const autoApprove = await this.getAutoApprove();
    if (autoApprove) {
      return { allowed: true, requiresPrompt: false };
    }
    const data = await this.loadPermissions();
    const isDomainAware = this.isDomainAwareTool(toolName);
    const domain = context.url ? this.extractDomain(context.url) : undefined;

    if (isDomainAware && domain) {
      const domainPermission = data.domains[toolName]?.[domain];
      if (domainPermission === "allow") {
        await this.updateMetadata(toolName);
        return { allowed: true, requiresPrompt: false, domain };
      }
      if (domainPermission === "deny") {
        return { allowed: false, requiresPrompt: false, domain };
      }
    }

    const globalDecision = data.tools[toolName];

    if (globalDecision === "always_allow") {
      await this.updateMetadata(toolName);
      return { allowed: true, requiresPrompt: false, existingDecision: globalDecision };
    }

    if (globalDecision === "always_deny") {
      return { allowed: false, requiresPrompt: false, existingDecision: globalDecision };
    }

    return {
      allowed: false,
      requiresPrompt: true,
      existingDecision: globalDecision,
      domain
    };
  }

  async storePermission(
    toolName: string,
    decision: PermissionDecision,
    domain?: string
  ): Promise<void> {
    const data = await this.loadPermissions();

    if (domain && this.isDomainAwareTool(toolName)) {
      if (!data.domains[toolName]) {
        data.domains[toolName] = {};
      }
      data.domains[toolName][domain] = decision === "always_allow" ? "allow" : "deny";
    } else {
      data.tools[toolName] = decision;
    }

    if (decision === "always_allow") {
      data.metadata[toolName] = {
        grantedAt: Date.now(),
        lastUsed: Date.now(),
        useCount: 1
      };
    }

    await this.savePermissions(data);
  }

  async revokePermission(toolName: string, domain?: string): Promise<void> {
    const data = await this.loadPermissions();

    if (domain && data.domains[toolName]) {
      delete data.domains[toolName][domain];
      if (Object.keys(data.domains[toolName]).length === 0) {
        delete data.domains[toolName];
      }
    } else {
      delete data.tools[toolName];
      delete data.metadata[toolName];
    }

    await this.savePermissions(data);
  }

  async getGrantedPermissions(): Promise<PermissionsData> {
    return this.loadPermissions();
  }

  extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return "";
    }
  }

  isDomainAwareTool(toolName: string): boolean {
    return DOMAIN_AWARE_PREFIXES.some(prefix => toolName.startsWith(prefix));
  }

  async setAutoApprove(enabled: boolean): Promise<void> {
    await browser.storage.local.set({
      [STORAGE_KEYS.AUTO_APPROVE]: enabled
    });
  }

  async getAutoApprove(): Promise<boolean> {
    const result = await browser.storage.local.get(STORAGE_KEYS.AUTO_APPROVE);
    return result[STORAGE_KEYS.AUTO_APPROVE] || false;
  }

  private async updateMetadata(toolName: string): Promise<void> {
    const data = await this.loadPermissions();

    if (data.metadata[toolName]) {
      data.metadata[toolName].lastUsed = Date.now();
      data.metadata[toolName].useCount++;
      await this.savePermissions(data);
    }
  }

  private async loadPermissions(): Promise<PermissionsData> {
    const result = await browser.storage.local.get([
      STORAGE_KEYS.TOOLS,
      STORAGE_KEYS.DOMAINS,
      STORAGE_KEYS.METADATA
    ]);

    return {
      tools: result[STORAGE_KEYS.TOOLS] || {},
      domains: result[STORAGE_KEYS.DOMAINS] || {},
      metadata: result[STORAGE_KEYS.METADATA] || {}
    };
  }

  private async savePermissions(data: PermissionsData): Promise<void> {
    await browser.storage.local.set({
      [STORAGE_KEYS.TOOLS]: data.tools,
      [STORAGE_KEYS.DOMAINS]: data.domains,
      [STORAGE_KEYS.METADATA]: data.metadata
    });
  }
}
