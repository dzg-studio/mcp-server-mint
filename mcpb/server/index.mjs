#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { resolveMintCLI } from "./resolve-mint-cli.mjs";

const cliPath = resolveMintCLI();

if (!cliPath) {
  console.error(`A trusted Mint CLI was not found.

Install Mint Direct from https://mint.dzgapp.com, launch Mint once from Finder,
then enable this extension again. Only mint-cli signed by DZG Studio LLC is accepted.`);
  process.exit(1);
}

const child = spawn(cliPath, ["mcp"], {
  stdio: ["pipe", "pipe", "inherit"],
  env: process.env,
});

const toolMetadata = {
  mint_status: {
    title: "Inspect Mint storage status",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  mint_why: {
    title: "Explain storage growth",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  mint_scan: {
    title: "Scan reclaimable Mac storage",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  mint_agents: {
    title: "Review AI-tool storage on this Mac",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  mint_recent: {
    title: "Review recent Mint operations",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  mint_activity: {
    title: "Review recent Mint activity",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  mint_rules: {
    title: "Inspect Mint cleanup rules",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  mint_execute: {
    title: "Move eligible items to Trash with Mint",
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  },
};

const pendingToolLists = new Set();
const inputLines = createInterface({ input: process.stdin, crlfDelay: Infinity });
const outputLines = createInterface({ input: child.stdout, crlfDelay: Infinity });

inputLines.on("line", (line) => {
  try {
    const message = JSON.parse(line);
    if (message.method === "tools/list" && message.id !== undefined) {
      pendingToolLists.add(JSON.stringify(message.id));
    }
  } catch {
    // The Mint server owns protocol validation and will return the JSON-RPC error.
  }

  child.stdin.write(`${line}\n`);
});

inputLines.on("close", () => child.stdin.end());

outputLines.on("line", (line) => {
  let output = line;

  try {
    const message = JSON.parse(line);
    const key = message.id === undefined ? undefined : JSON.stringify(message.id);
    if (key && pendingToolLists.delete(key) && Array.isArray(message.result?.tools)) {
      message.result.tools = message.result.tools.map((tool) => {
        const metadata = toolMetadata[tool.name];
        if (!metadata) return tool;
        return {
          ...tool,
          title: tool.title ?? metadata.title,
          annotations: {
            ...metadata.annotations,
            ...(tool.annotations ?? {}),
          },
        };
      });
      output = JSON.stringify(message);
    }
  } catch {
    // Preserve any non-JSON diagnostics exactly as the server emitted them.
  }

  process.stdout.write(`${output}\n`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", (error) => {
  console.error(`Unable to start Mint MCP server: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
