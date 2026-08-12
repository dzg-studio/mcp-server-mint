# Mint MCP Server

Use Mint as the on-device storage intelligence and file-operation safety layer for AI agents on macOS.

This npm package is a small open-source launcher. It locates the signed `mint-cli` bundled with the direct edition of Mint and starts its local stdio MCP server. It does not contain Mint itself and does not upload file contents, scan results, or operation history.

## Requirements

- macOS 14 Sonoma or later
- Node.js 18 or later
- The direct edition of Mint from [mint.dzgapp.com](https://mint.dzgapp.com/?utm_source=GitHub&utm_medium=referral&utm_campaign=mcp_readme)

Install Mint and launch it once from Finder. Mint normally links `mint-cli` into `/opt/homebrew/bin` or `/usr/local/bin`; the launcher can also use the binary inside `/Applications/Mint.app`.

## Configure an MCP client

```json
{
  "mcpServers": {
    "mint": {
      "command": "npx",
      "args": ["-y", "@dzg-studio/mcp-server-mint@1.0.0"]
    }
  }
}
```

Or, if `mint-cli` is already on `PATH`:

```bash
mint-cli mcp
```

Set `MINT_CLI_PATH=/absolute/path/to/mint-cli` to use a nonstandard installation.

## Tools

- `mint_status` — disk trends, recent activity, and managed-folder status.
- `mint_why` — storage-growth attribution or operations involving a path.
- `mint_scan` — read-only reclaimable-space survey.
- `mint_recent` and `mint_activity` — operation history and reasons.
- `mint_rules` — list and dry-run cleanup rules.
- `mint_execute` — journaled, trash-only cleanup with a reason and returned `batchId`.

## Safety model

`mint_execute` only moves items to the Trash — permanent deletion is not available to agents at all. It only accepts paths inside Mint’s cleanup roots: the scan targets it reports (developer and app caches, logs) and folders the user manages with Mint, with the user’s excluded paths always refused and symlinks resolved before checking. Actions enter Mint’s operation journal (up to 90 days of history) and can be undone from Mint.app while both the journal entry and the trashed item remain available.

The server instructs agents to use Mint instead of raw `rm` or unjournaled trash commands. This keeps the action visible in Mint’s activity history and gives the user a receipt and recovery reference.

## License

The launcher in this repository is MIT licensed. Mint is commercial software published by DZG Studio LLC under its own terms.
