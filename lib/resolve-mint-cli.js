import { existsSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";

const EXPECTED_IDENTIFIER = "mint-cli";
const EXPECTED_TEAM_ID = "DRV5ZMT5U8";
export const REQUIRED_CAPABILITY = "mcp.native-actions.v1";
const PROBE_OPTIONS = {
  encoding: "utf8",
  timeout: 5_000,
  killSignal: "SIGKILL",
  maxBuffer: 64 * 1024,
};

export function verifyMintCLI(candidate, run = spawnSync) {
  const verification = run(
    "/usr/bin/codesign",
    ["--verify", "--strict", "--verbose=2", "--", candidate],
    PROBE_OPTIONS,
  );

  if (verification.error || verification.status !== 0) return false;

  const details = run(
    "/usr/bin/codesign",
    ["-dv", "--verbose=4", "--", candidate],
    PROBE_OPTIONS,
  );

  if (details.error || details.status !== 0) return false;

  const output = `${details.stdout ?? ""}\n${details.stderr ?? ""}`;
  return output.split("\n").includes(`Identifier=${EXPECTED_IDENTIFIER}`)
    && output.split("\n").includes(`TeamIdentifier=${EXPECTED_TEAM_ID}`);
}

export function supportsCleanupPlans(candidate, run = spawnSync) {
  const result = run(candidate, ["version", "--json"], PROBE_OPTIONS);
  if (result.error || result.status !== 0) return false;

  try {
    const version = JSON.parse(result.stdout);
    return Array.isArray(version?.capabilities)
      && version.capabilities.includes(REQUIRED_CAPABILITY)
      && version.capabilities.includes("mcp.jobs.v1")
      && version.capabilities.includes("mcp.native-approval.v1");
  } catch {
    return false;
  }
}

export function resolveMintCLI(options = {}) {
  const environment = options.environment ?? process.env;
  const exists = options.exists ?? existsSync;
  const realpath = options.realpath ?? realpathSync;
  const verify = options.verify ?? verifyMintCLI;
  const compatible = options.compatible ?? supportsCleanupPlans;
  const run = options.run ?? spawnSync;
  const home = options.home ?? homedir();
  // The app's own copy comes first, so the server matches the installed app. Mint keeps only a
  // symlink up to date in the PATH folders; a plain copy left there goes stale at the next update.
  const candidates = [
    environment.MINT_CLI_PATH,
    "/Applications/Mint.app/Contents/Resources/mint-cli",
    home && `${home}/Applications/Mint.app/Contents/Resources/mint-cli`,
    "/opt/homebrew/bin/mint-cli",
    "/usr/local/bin/mint-cli",
  ].filter(Boolean);

  const inspected = new Set();
  for (const candidate of candidates) {
    try {
      if (!exists(candidate)) continue;

      // Unresolved paths are refused: only the verified target may be executed.
      const resolved = realpath(candidate);
      if (inspected.has(resolved)) continue;
      inspected.add(resolved);
      if (verify(resolved, run) && compatible(resolved, run)) return resolved;
    } catch {
      // An unreadable, unverifiable, or incompatible candidate is not usable.
    }
  }

  return undefined;
}
