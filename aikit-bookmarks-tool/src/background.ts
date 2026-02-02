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
    name: "bookmark.create",
    label: "Create Bookmark",
    description: "Create a new bookmark with the specified title and URL",
    parameters: Type.Object({
      title: Type.String({ description: "The title of the bookmark" }),
      url: Type.String({ description: "The URL of the bookmark" }),
      parentId: Type.Optional(Type.String({ description: "The ID of the parent folder (default: unfiled bookmarks)" }))
    })
  },
  {
    name: "bookmark.search",
    label: "Search Bookmarks",
    description: "Search for bookmarks by title or URL",
    parameters: Type.Object({
      query: Type.String({ description: "Search query to match against bookmark titles and URLs" })
    })
  },
  {
    name: "bookmark.list",
    label: "List Bookmarks",
    description: "List bookmarks in a specific folder",
    parameters: Type.Object({
      folderId: Type.Optional(Type.String({ description: "The ID of the folder to list (omit to list root bookmarks)" }))
    })
  },
  {
    name: "bookmark.remove",
    label: "Remove Bookmark",
    description: "Remove a bookmark by its ID",
    parameters: Type.Object({
      bookmarkId: Type.String({ description: "The ID of the bookmark to remove" })
    })
  },
  {
    name: "bookmark.getTree",
    label: "Get Bookmark Tree",
    description: "Get the complete bookmark tree structure",
    parameters: Type.Object({})
  },
  {
    name: "bookmark.createFolder",
    label: "Create Folder",
    description: "Create a new bookmark folder",
    parameters: Type.Object({
      title: Type.String({ description: "The title of the folder" }),
      parentId: Type.Optional(Type.String({ description: "The ID of the parent folder" }))
    })
  },
  {
    name: "bookmark.move",
    label: "Move Bookmark",
    description: "Move a bookmark to a different folder",
    parameters: Type.Object({
      bookmarkId: Type.String({ description: "The ID of the bookmark to move" }),
      parentId: Type.String({ description: "The ID of the destination folder" })
    })
  },
  {
    name: "bookmark.update",
    label: "Update Bookmark",
    description: "Update a bookmark's title or URL",
    parameters: Type.Object({
      bookmarkId: Type.String({ description: "The ID of the bookmark to update" }),
      title: Type.Optional(Type.String({ description: "New title for the bookmark" })),
      url: Type.Optional(Type.String({ description: "New URL for the bookmark" }))
    })
  }
];

function formatBookmarkTree(nodes: browser.bookmarks.BookmarkTreeNode[], indent = 0): string {
  let result = "";
  const indentStr = "  ".repeat(indent);

  for (const node of nodes) {
    if (node.type === "folder") {
      result += `${indentStr}📁 ${node.title} [${node.id}]\n`;
      if (node.children) {
        result += formatBookmarkTree(node.children, indent + 1);
      }
    } else if (node.type === "bookmark") {
      result += `${indentStr}🔖 ${node.title} - ${node.url} [${node.id}]\n`;
    }
  }

  return result;
}

const toolHandlers: Record<string, (params: any) => Promise<any>> = {
  "bookmark.create": async (params) => {
    const { title, url, parentId } = params;

    let finalUrl = url;
    if (!url.match(/^https?:\/\//)) {
      finalUrl = `https://${url}`;
    }

    const bookmark = await browser.bookmarks.create({
      title,
      url: finalUrl,
      parentId
    });

    return {
      content: [
        {
          type: "text",
          text: `Created bookmark "${title}" with URL: ${finalUrl} [${bookmark.id}]`
        }
      ],
      details: {
        bookmarkId: bookmark.id,
        title,
        url: finalUrl,
        parentId
      }
    };
  },

  "bookmark.search": async (params) => {
    const { query } = params;

    const bookmarks = await browser.bookmarks.search(query);

    if (bookmarks.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No bookmarks found matching "${query}"`
          }
        ],
        details: { bookmarks: [] }
      };
    }

    const bookmarkList = bookmarks
      .filter(b => b.type === "bookmark")
      .map((bookmark, index) => ({
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url
      }));

    const summary = bookmarkList
      .map((b, index) => `${index + 1}. ${b.title} - ${b.url} [${b.id}]`)
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Found ${bookmarkList.length} bookmark(s) matching "${query}":\n${summary}`
        }
      ],
      details: { bookmarks: bookmarkList }
    };
  },

  "bookmark.list": async (params) => {
    const { folderId } = params;

    let bookmarks: browser.bookmarks.BookmarkTreeNode[];

    if (folderId) {
      const results = await browser.bookmarks.getChildren(folderId);
      bookmarks = results;
    } else {
      const tree = await browser.bookmarks.getTree();
      bookmarks = tree[0].children || [];
    }

    const bookmarkList = bookmarks.map(b => ({
      id: b.id,
      title: b.title,
      url: b.url,
      type: b.type
    }));

    const summary = bookmarkList
      .map((b, index) => {
        const icon = b.type === "folder" ? "📁" : "🔖";
        const urlPart = b.url ? ` - ${b.url}` : "";
        return `${index + 1}. ${icon} ${b.title}${urlPart} [${b.id}]`;
      })
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Found ${bookmarkList.length} item(s)${folderId ? ` in folder ${folderId}` : ""}:\n${summary}`
        }
      ],
      details: { bookmarks: bookmarkList }
    };
  },

  "bookmark.remove": async (params) => {
    const { bookmarkId } = params;

    const bookmarks = await browser.bookmarks.get(bookmarkId);
    const bookmark = bookmarks[0];

    if (bookmark.type === "folder") {
      await browser.bookmarks.removeTree(bookmarkId);
    } else {
      await browser.bookmarks.remove(bookmarkId);
    }

    return {
      content: [
        {
          type: "text",
          text: `Removed ${bookmark.type} "${bookmark.title}" [${bookmarkId}]`
        }
      ],
      details: { bookmarkId, title: bookmark.title }
    };
  },

  "bookmark.getTree": async (params) => {
    const tree = await browser.bookmarks.getTree();

    const formatted = formatBookmarkTree(tree);

    return {
      content: [
        {
          type: "text",
          text: `Bookmark tree:\n${formatted}`
        }
      ],
      details: { tree }
    };
  },

  "bookmark.createFolder": async (params) => {
    const { title, parentId } = params;

    const folder = await browser.bookmarks.create({
      title,
      type: "folder",
      parentId
    });

    return {
      content: [
        {
          type: "text",
          text: `Created folder "${title}" [${folder.id}]`
        }
      ],
      details: {
        folderId: folder.id,
        title,
        parentId
      }
    };
  },

  "bookmark.move": async (params) => {
    const { bookmarkId, parentId } = params;

    const bookmarks = await browser.bookmarks.get(bookmarkId);
    const bookmark = bookmarks[0];

    await browser.bookmarks.move(bookmarkId, { parentId });

    return {
      content: [
        {
          type: "text",
          text: `Moved "${bookmark.title}" to folder ${parentId}`
        }
      ],
      details: {
        bookmarkId,
        title: bookmark.title,
        newParentId: parentId
      }
    };
  },

  "bookmark.update": async (params) => {
    const { bookmarkId, title, url } = params;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (url !== undefined) {
      updates.url = url.match(/^https?:\/\//) ? url : `https://${url}`;
    }

    const bookmark = await browser.bookmarks.update(bookmarkId, updates);

    const changes = [];
    if (title !== undefined) changes.push(`title to "${title}"`);
    if (url !== undefined) changes.push(`URL to "${updates.url}"`);

    return {
      content: [
        {
          type: "text",
          text: `Updated bookmark [${bookmarkId}]: ${changes.join(", ")}`
        }
      ],
      details: {
        bookmarkId,
        updates
      }
    };
  }
};

const toolProvider = new ToolProvider("aikit-bookmarks-tool", tools);
toolProvider.registerHandlers(toolHandlers);
toolProvider.start();
