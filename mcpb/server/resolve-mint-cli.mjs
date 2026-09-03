import { existsSync, realpathSync } from "node:fs";
import { spawnSync } from "node:child_process";

const EXPECTED_IDENTIFIER = "mint-cli";
const EXPECTED_TEAM_ID = "DRV5ZMT5U8";

function verifyMintCLI(candidate) {
  const verification = spawnSync(
    "/usr/bin/codesign",
    ["--verify", "--strict", "--verbose=2", "--", candidate],
    { encoding: "utf8" },
  );

  if (verification.error || verification.status !== 0) return false;

  const details = spawnSync(
    "/usr/bin/codesign",
    ["-dv", "--verbose=4", "--", candidate],
    { encoding: "utf8" },
  );

  if (details.error || details.status !== 0) return false;

  const output = `${details.stdout ?? ""}\n${details.stderr ?? ""}`;
  const lines = output.split("\n");
  return lines.includes(`Identifier=${EXPECTED_IDENTIFIER}`)
    && lines.includes(`TeamIdentifier=${EXPECTED_TEAM_ID}`);
}

export function resolveMintCLI() {
  const candidates = [
    process.env.MINT_CLI_PATH,
    "/opt/homebrew/bin/mint-cli",
    "/usr/local/bin/mint-cli",
    "/Applications/Mint.app/Contents/Resources/mint-cli",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;

    let resolved;
    try {
      resolved = realpathSync(candidate);
    } catch {
      resolved = candidate;
    }

    if (verifyMintCLI(resolved)) return resolved;
  }

  return undefined;
}
