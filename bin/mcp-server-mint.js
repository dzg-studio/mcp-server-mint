#!/usr/bin/env node

import { spawn } from "node:child_process";
import { resolveMintCLI } from "../lib/resolve-mint-cli.js";

const cliPath = resolveMintCLI();

if (!cliPath) {
  console.error(`Mint CLI was not found.

Install the direct edition from https://mint.dzgapp.com, launch Mint once from Finder,
then try again. You can also set MINT_CLI_PATH to the full path of mint-cli.`);
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
