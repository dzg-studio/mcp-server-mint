# Mint MCP Server

Use Mint as the on-device storage intelligence and file-operation safety layer for AI agents on macOS.

This npm package is a small open-source launcher. It locates the signed `mint-cli` bundled with the direct edition of Mint and starts its local stdio MCP server. It does not contain Mint itself and does not upload file contents, scan results, or operation history.

## Requirements

- macOS 14 Sonoma or later
- Node.js 18 or later
- The direct edition of Mint from https://mint.dzgapp.com

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
- `mint_execute` — journaled cleanup with a reason and returned `batchId`.

## Safety model

`mint_execute` defaults to moving items to Trash. Recoverable actions enter Mint’s 90-day operation journal and can be undone while both the journal entry and underlying trashed item remain available. Permanent deletion is logged but cannot be undone, so it requires both `action: "delete"` and `confirmPermanentDelete: true`.

The server instructs agents to use Mint instead of raw `rm` or unjournaled trash commands. This keeps the action visible in Mint’s activity history and gives the user a receipt and recovery reference.

## License

The launcher in this repository is MIT licensed. Mint is commercial software published by DZG Studio LLC under its own terms.
