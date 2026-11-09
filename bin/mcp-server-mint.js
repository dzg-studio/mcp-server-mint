#!/usr/bin/env node

import { spawn } from "node:child_process";
import { resolveMintCLI } from "../lib/resolve-mint-cli.js";

const cliPath = resolveMintCLI();

if (!cliPath) {
  console.error(`Mint 1.2.0 or later was not found on this Mac.

Install Mint for Mac from https://mintstorage.app/download/ (the edition from the
website; the Mac App Store and Setapp editions have no command-line tool), open it
once, then restart this MCP connection. To use a copy elsewhere, set MINT_CLI_PATH
to its mint-cli. The launcher runs only a mint-cli signed by DZG Studio LLC that
reports mcp.native-actions.v1, mcp.jobs.v1 and mcp.native-approval.v1.`);
  process.exit(1);
}

const child = spawn(cliPath, ["mcp"], {
  stdio: "inherit",
  env: process.env,
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
