import { existsSync, realpathSync } from "node:fs";

export function resolveMintCLI(options = {}) {
  const environment = options.environment ?? process.env;
  const exists = options.exists ?? existsSync;
  const realpath = options.realpath ?? realpathSync;
  const candidates = [
    environment.MINT_CLI_PATH,
    "/opt/homebrew/bin/mint-cli",
    "/usr/local/bin/mint-cli",
    "/Applications/Mint.app/Contents/Resources/mint-cli",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!exists(candidate)) continue;

    try {
      return realpath(candidate);
    } catch {
      return candidate;
    }
  }

  return undefined;
}
