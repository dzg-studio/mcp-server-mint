import assert from "node:assert/strict";
import test from "node:test";
import { resolveMintCLI } from "../lib/resolve-mint-cli.js";

test("prefers an explicit MINT_CLI_PATH", () => {
  const result = resolveMintCLI({
    environment: { MINT_CLI_PATH: "/custom/mint-cli" },
    exists: (path) => path === "/custom/mint-cli",
    realpath: (path) => `/resolved${path}`,
  });

  assert.equal(result, "/resolved/custom/mint-cli");
});

test("falls back to the app-bundled CLI", () => {
  const bundled = "/Applications/Mint.app/Contents/Resources/mint-cli";
  const result = resolveMintCLI({
    environment: {},
    exists: (path) => path === bundled,
    realpath: (path) => path,
  });

  assert.equal(result, bundled);
});

test("returns undefined when Mint is not installed", () => {
  const result = resolveMintCLI({
    environment: {},
    exists: () => false,
    realpath: (path) => path,
  });

  assert.equal(result, undefined);
});
