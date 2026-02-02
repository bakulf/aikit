/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2026 Andrea Marchesini
 */

const globalPermissionsDiv = document.getElementById("globalPermissions") as HTMLDivElement;
const domainPermissionsDiv = document.getElementById("domainPermissions") as HTMLDivElement;
const refreshBtn = document.getElementById("refreshBtn") as HTMLButtonElement;
const allowAllBtn = document.getElementById("allowAllBtn") as HTMLButtonElement;
const revokeAllBtn = document.getElementById("revokeAllBtn") as HTMLButtonElement;
const autoApproveToggle = document.getElementById("autoApproveToggle") as HTMLInputElement;

interface PermissionsData {
  tools: Record<string, string>;
  domains: Record<string, Record<string, string>>;
  metadata: Record<string, {
    grantedAt: number;
    lastUsed: number;
    useCount: number;
  }>;
}

async function loadPermissions(): Promise<void> {
  try {
    const data = await browser.runtime.sendMessage({ type: "GET_PERMISSIONS" }) as PermissionsData;
    displayGlobalPermissions(data);
    displayDomainPermissions(data);
  } catch (error) {
    console.error("Failed to load permissions:", error);
  }
}

async function loadAutoApprove(): Promise<void> {
  try {
    const response = await browser.runtime.sendMessage({ type: "GET_AUTO_APPROVE" }) as { enabled: boolean };
    autoApproveToggle.checked = response.enabled;
  } catch (error) {
    console.error("Failed to load auto-approve setting:", error);
  }
}

function displayGlobalPermissions(data: PermissionsData): void {
  const globalTools = Object.entries(data.tools).filter(
    ([_, decision]) => decision === "always_allow" || decision === "always_deny"
  );

  if (globalTools.length === 0) {
    globalPermissionsDiv.innerHTML = '<div class="empty-state">No global permissions granted yet</div>';
    return;
  }

  globalPermissionsDiv.innerHTML = "";

  for (const [toolName, decision] of globalTools) {
    const metadata = data.metadata[toolName];
    const item = createPermissionItem(toolName, decision, metadata);
    globalPermissionsDiv.appendChild(item);
  }
}

function displayDomainPermissions(data: PermissionsData): void {
  const domainEntries = Object.entries(data.domains).flatMap(([toolName, domains]) =>
    Object.entries(domains).map(([domain, decision]) => ({ toolName, domain, decision }))
  );

  if (domainEntries.length === 0) {
    domainPermissionsDiv.innerHTML = '<div class="empty-state">No domain-specific permissions granted yet</div>';
    return;
  }

  domainPermissionsDiv.innerHTML = "";

  for (const { toolName, domain, decision } of domainEntries) {
    const metadata = data.metadata[toolName];
    const item = createPermissionItem(toolName, decision, metadata, domain);
    domainPermissionsDiv.appendChild(item);
  }
}

function createPermissionItem(
  toolName: string,
  decision: string,
  metadata?: { grantedAt: number; lastUsed: number; useCount: number },
  domain?: string
): HTMLElement {
  const item = document.createElement("div");
  item.className = "permission-item";

  const statusClass = decision === "always_allow" || decision === "allow" ? "allowed" : "denied";
  const statusText = decision === "always_allow" || decision === "allow" ? "Allowed" : "Denied";

  const grantedDate = metadata ? new Date(metadata.grantedAt).toLocaleDateString() : "Unknown";
  const lastUsedDate = metadata ? new Date(metadata.lastUsed).toLocaleDateString() : "Never";
  const useCount = metadata?.useCount ?? 0;

  item.innerHTML = `
    <div class="permission-header">
      <div class="permission-info">
        <div class="permission-name">${toolName}</div>
        ${domain ? `<span class="permission-domain">${domain}</span>` : ""}
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>
      <button class="btn btn-revoke" data-tool="${toolName}" data-domain="${domain || ""}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        Revoke
      </button>
    </div>
    ${metadata ? `
    <div class="permission-metadata">
      <div class="metadata-item">
        <span class="metadata-label">Granted</span>
        <span class="metadata-value">${grantedDate}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Last Used</span>
        <span class="metadata-value">${lastUsedDate}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Use Count</span>
        <span class="metadata-value">${useCount}</span>
      </div>
    </div>
    ` : ""}
  `;

  const revokeBtn = item.querySelector(".btn-revoke") as HTMLButtonElement;
  revokeBtn.addEventListener("click", () => {
    revokePermission(toolName, domain);
  });

  return item;
}

async function revokePermission(toolName: string, domain?: string): Promise<void> {
  const confirmMessage = domain
    ? `Revoke permission for "${toolName}" on ${domain}?`
    : `Revoke global permission for "${toolName}"?`;

  if (!confirm(confirmMessage)) {
    return;
  }

  try {
    await browser.runtime.sendMessage({
      type: "REVOKE_PERMISSION",
      toolName,
      domain: domain || undefined
    });

    await loadPermissions();
  } catch (error) {
    console.error("Failed to revoke permission:", error);
    alert("Failed to revoke permission");
  }
}

async function allowAllTools(): Promise<void> {
  if (!confirm("Allow all registered tools to execute without prompting?")) {
    return;
  }

  try {
    await browser.runtime.sendMessage({ type: "ALLOW_ALL_TOOLS" });
    await loadPermissions();
    alert("All tools have been approved");
  } catch (error) {
    console.error("Failed to allow all tools:", error);
    alert("Failed to allow all tools");
  }
}

async function revokeAllPermissions(): Promise<void> {
  if (!confirm("Are you sure you want to revoke ALL permissions? This cannot be undone.")) {
    return;
  }

  try {
    const data = await browser.runtime.sendMessage({ type: "GET_PERMISSIONS" }) as PermissionsData;

    for (const toolName of Object.keys(data.tools)) {
      await browser.runtime.sendMessage({
        type: "REVOKE_PERMISSION",
        toolName
      });
    }

    for (const [toolName, domains] of Object.entries(data.domains)) {
      for (const domain of Object.keys(domains)) {
        await browser.runtime.sendMessage({
          type: "REVOKE_PERMISSION",
          toolName,
          domain
        });
      }
    }

    await loadPermissions();
  } catch (error) {
    console.error("Failed to revoke all permissions:", error);
    alert("Failed to revoke all permissions");
  }
}

async function setAutoApprove(enabled: boolean): Promise<void> {
  try {
    await browser.runtime.sendMessage({
      type: "SET_AUTO_APPROVE",
      enabled
    });
  } catch (error) {
    console.error("Failed to set auto-approve:", error);
    alert("Failed to update auto-approve setting");
    autoApproveToggle.checked = !enabled;
  }
}

refreshBtn.addEventListener("click", () => {
  loadPermissions();
  loadAutoApprove();
});

allowAllBtn.addEventListener("click", allowAllTools);
revokeAllBtn.addEventListener("click", revokeAllPermissions);

autoApproveToggle.addEventListener("change", () => {
  setAutoApprove(autoApproveToggle.checked);
});

loadPermissions();
loadAutoApprove();

console.log("Options page loaded");
