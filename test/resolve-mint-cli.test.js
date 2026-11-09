import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as npmLauncher from "../lib/resolve-mint-cli.js";

// The Claude Desktop `.mcpb` kit (distribution/claude-mint-extension) was retired at the 1.2.0 cut
// (P15, 2026-11-04); its successor, the Claude plugin, runs the installed Mint's `mint-cli mcp` and has
// no resolver of its own, so only the npm launcher is tested here.

const bundled = "/Applications/Mint.app/Contents/Resources/mint-cli";
const signed = "Identifier=mint-cli\nTeamIdentifier=DRV5ZMT5U8\n";
const capable = JSON.stringify({ capabilities: ["mcp.cleanup-plan.v1", "mcp.native-actions.v1", "mcp.jobs.v1", "mcp.native-approval.v1"] });

function probeRun({ signature = signed, verificationStatus = 0, version = capable, versionError } = {}) {
  const calls = [];
  return {
    calls,
    run(command, args, options) {
      calls.push({ command, args, options });
      if (command === "/usr/bin/codesign") {
        return args[0] === "--verify"
          ? { status: verificationStatus }
          : { status: 0, stderr: signature };
      }
      assert.deepEqual(args, ["version", "--json"], "discovery must never start MCP");
      return versionError
        ? { status: null, error: versionError }
        : { status: 0, stdout: version };
    },
  };
}

for (const [name, launcher] of [["npm", npmLauncher]]) {
  test(`${name}: prefers a capable explicit MINT_CLI_PATH after verifying the resolved target`, () => {
    const { run, calls } = probeRun();
    const result = launcher.resolveMintCLI({
      environment: { MINT_CLI_PATH: "/custom/mint-cli" },
      exists: (path) => path === "/custom/mint-cli",
      realpath: (path) => `/resolved${path}`,
      run,
    });
    assert.equal(result, "/resolved/custom/mint-cli");
    assert.deepEqual(calls.map((call) => call.command), [
      "/usr/bin/codesign", "/usr/bin/codesign", result,
    ]);
    assert.equal(calls[0].args.at(-1), result);
    assert.equal(calls[1].args.at(-1), result);
    for (const { options } of calls) {
      assert.equal(options.timeout, 5_000);
      assert.equal(options.killSignal, "SIGKILL");
      assert.equal(options.maxBuffer, 64 * 1024);
    }
  });

  test(`${name}: prefers the app-bundled CLI over a PATH copy, which is never run`, () => {
    const { run, calls } = probeRun();
    const result = launcher.resolveMintCLI({
      environment: {},
      home: "/Users/someone",
      exists: (path) => path === "/opt/homebrew/bin/mint-cli" || path === bundled,
      realpath: (path) => path,
      run,
    });
    assert.equal(result, bundled);
    assert.ok(calls.every(({ command, args }) =>
      command !== "/opt/homebrew/bin/mint-cli" && args.at(-1) !== "/opt/homebrew/bin/mint-cli"));
  });

  test(`${name}: finds Mint in ~/Applications before the PATH folders`, () => {
    const userBundled = "/Users/someone/Applications/Mint.app/Contents/Resources/mint-cli";
    const { run } = probeRun();
    assert.equal(launcher.resolveMintCLI({
      environment: {},
      home: "/Users/someone",
      exists: (path) => path === userBundled || path === "/usr/local/bin/mint-cli",
      realpath: (path) => path,
      run,
    }), userBundled);
  });

  test(`${name}: falls back from an outdated app copy to a capable PATH CLI`, () => {
    const probe = probeRun();
    const result = launcher.resolveMintCLI({
      environment: {},
      home: "/Users/someone",
      exists: (path) => path === bundled || path === "/opt/homebrew/bin/mint-cli",
      realpath: (path) => path,
      run(command, args, options) {
        if (command === bundled) {
          assert.deepEqual(args, ["version", "--json"]);
          return { status: 0, stdout: '{"capabilities":["mcp.cleanup-plan.v1"]}' };
        }
        return probe.run(command, args, options);
      },
    });
    assert.equal(result, "/opt/homebrew/bin/mint-cli");
  });

  for (const [failure, settings] of [
    ["invalid signature", { verificationStatus: 1 }],
    ["wrong signing team", { signature: "Identifier=mint-cli\nTeamIdentifier=OTHER\n" }],
    ["wrong binary identifier", { signature: "Identifier=other-cli\nTeamIdentifier=DRV5ZMT5U8\n" }],
  ]) {
    test(`${name}: never executes a CLI with ${failure}`, () => {
      const { run, calls } = probeRun(settings);
      assert.equal(launcher.resolveMintCLI({
        environment: {}, exists: (path) => path === bundled, realpath: (path) => path, run,
      }), undefined);
      assert.ok(calls.length > 0);
      assert.ok(calls.every(({ command }) => command === "/usr/bin/codesign"));
    });
  }

  for (const [failure, settings] of [
    ["old capability", { version: '{"capabilities":["mcp.cleanup.v0"]}' }],
    ["missing capability", { version: '{"version":"1.0.25"}' }],
    ["non-array capability", { version: '{"capabilities":"mcp.cleanup-plan.v1"}' }],
    ["malformed JSON", { version: "not JSON" }],
    ["null JSON", { version: "null" }],
    ["timed-out version probe", { versionError: Object.assign(new Error("timed out"), { code: "ETIMEDOUT" }) }],
    ["oversized version output", { versionError: Object.assign(new Error("output too large"), { code: "ENOBUFS" }) }],
  ]) {
    test(`${name}: refuses ${failure}`, () => {
      const { run, calls } = probeRun(settings);
      assert.equal(launcher.resolveMintCLI({
        environment: {}, exists: (path) => path === bundled, realpath: (path) => path, run,
      }), undefined);
      const executableCalls = calls.filter(({ command }) => command !== "/usr/bin/codesign");
      assert.equal(executableCalls.length, 1);
      assert.deepEqual(executableCalls[0].args, ["version", "--json"]);
    });
  }

  test(`${name}: refuses an unsuccessful version command even when stdout claims support`, () => {
    assert.equal(launcher.supportsCleanupPlans(bundled, () => ({ status: 1, stdout: capable })), false);
  });

  test(`${name}: missing or unresolvable candidates are never executed`, () => {
    for (const exists of [() => false, () => true]) {
      const calls = [];
      assert.equal(launcher.resolveMintCLI({
        environment: {}, exists,
        realpath: () => { throw new Error("unresolvable path"); },
        run: (...args) => { calls.push(args); return { status: 1 }; },
      }), undefined);
      assert.equal(calls.length, 0, "must not execute an unresolved target");
    }
  });

  test(`${name}: inspects aliases of an outdated binary only once`, () => {
    const { run, calls } = probeRun({ version: '{"capabilities":[]}' });
    assert.equal(launcher.resolveMintCLI({
      environment: {}, exists: () => true, realpath: () => bundled, run,
    }), undefined);
    assert.equal(calls.filter(({ command }) => command === bundled).length, 1);
  });
}

test("new launcher refuses backends missing native actions, jobs or human approval", () => {
  for (const capabilities of [["mcp.cleanup-plan.v1"], ["mcp.native-actions.v1"], ["mcp.native-actions.v1", "mcp.jobs.v1"], ["mcp.native-actions.v1", "mcp.native-approval.v1"]]) {
    const probe = probeRun({version: JSON.stringify({capabilities})});
    assert.equal(npmLauncher.resolveMintCLI({environment: {}, exists: p => p === bundled,
      realpath: p => p, run: probe.run}), undefined);
  }
});
