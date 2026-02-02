/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http:
 *
 * Copyright (c) 2026 Andrea Marchesini
 */

export interface ToolDescriptor {
  name: string;
  label: string;
  description: string;
  parameters: any;
}

export interface OrchestratorMessage {
  type: "ORCHESTRATOR_READY" | "TOOL_EXECUTE";
  toolName?: string;
  params?: any;
  toolCallId?: string;
}

export interface ToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  details?: any;
  error?: string;
}

export type ToolHandler = (params: any) => Promise<ToolResult>;

export interface ToolHandlers {
  [toolName: string]: ToolHandler;
}

export type PermissionDecision = "always_allow" | "always_deny" | "ask" | "domain_restricted";

export interface PermissionContext {
  url?: string;
  tabId?: number;
  toolDescriptor?: ToolDescriptor;
  aiReasoning?: string;
}

export interface PermissionCheckResult {
  allowed: boolean;
  requiresPrompt: boolean;
  existingDecision?: PermissionDecision;
  domain?: string;
}

export interface PermissionRequestMessage {
  type: "PERMISSION_REQUEST";
  toolName: string;
  toolDescriptor: ToolDescriptor;
  params: any;
  context: PermissionContext;
  requestId: string;
}

export interface PermissionResponseMessage {
  type: "PERMISSION_RESPONSE";
  requestId: string;
  granted: boolean;
  remember: boolean;
  scope?: "global" | "domain";
}

export interface GetPermissionsMessage {
  type: "GET_PERMISSIONS";
}

export interface RevokePermissionMessage {
  type: "REVOKE_PERMISSION";
  toolName: string;
  domain?: string;
}

export interface AllowAllToolsMessage {
  type: "ALLOW_ALL_TOOLS";
}

export interface SetAutoApproveMessage {
  type: "SET_AUTO_APPROVE";
  enabled: boolean;
}

export interface GetAutoApproveMessage {
  type: "GET_AUTO_APPROVE";
}

export interface PermissionMetadata {
  grantedAt: number;
  lastUsed: number;
  useCount: number;
}

export interface PermissionsData {
  tools: Record<string, PermissionDecision>;
  domains: Record<string, Record<string, "allow" | "deny">>;
  metadata: Record<string, PermissionMetadata>;
}
