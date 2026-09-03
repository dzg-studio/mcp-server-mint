import { existsSync, realpathSync } from "node:fs";
import { spawnSync } from "node:child_process";

const EXPECTED_IDENTIFIER = "mint-cli";
const EXPECTED_TEAM_ID = "DRV5ZMT5U8";

export function verifyMintCLI(candidate, run = spawnSync) {
  const verification = run(
    "/usr/bin/codesign",
    ["--verify", "--strict", "--verbose=2", "--", candidate],
    { encoding: "utf8" },
  );

  if (verification.error || verification.status !== 0) return false;

  const details = run(
    "/usr/bin/codesign",
    ["-dv", "--verbose=4", "--", candidate],
    { encoding: "utf8" },
  );

  if (details.error || details.status !== 0) return false;

  const output = `${details.stdout ?? ""}\n${details.stderr ?? ""}`;
  return output.split("\n").includes(`Identifier=${EXPECTED_IDENTIFIER}`)
    && output.split("\n").includes(`TeamIdentifier=${EXPECTED_TEAM_ID}`);
}

export function resolveMintCLI(options = {}) {
  const environment = options.environment ?? process.env;
  const exists = options.exists ?? existsSync;
  const realpath = options.realpath ?? realpathSync;
  const verify = options.verify ?? verifyMintCLI;
  const candidates = [
    environment.MINT_CLI_PATH,
    "/opt/homebrew/bin/mint-cli",
    "/usr/local/bin/mint-cli",
    "/Applications/Mint.app/Contents/Resources/mint-cli",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!exists(candidate)) continue;

    try {
      const resolved = realpath(candidate);
      if (verify(resolved)) return resolved;
    } catch {
      if (verify(candidate)) return candidate;
    }
  }

  return undefined;
}
