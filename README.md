# Mint MCP Server

**Smart Storage. For you and your agent.** Mint brings storage analysis, file-preserving optimization, reviewed cleanup, Auto Care, file organization and memory management into one Mac workflow.

## The product method

Mint distinguishes **Optimizable**, **Safe to clean**, **Yours** and **Keep**. Eligible duplicate copies can share storage while both files remain; supported Codex optimization preserves the pictures needed to continue a conversation. Identified caches and leftovers have different consequences from personal files, conversations and media. Required, active, protected or uncertain data stays unchanged. Auto Care continues supported routines within the scope and schedule the person enables while Mint is running.

This launcher exposes the Direct edition’s supported agent interface, not every app feature. Agents can inspect storage and use the native MCP cleanup tools; conversation optimization, media removal, storage sharing, folder setup and memory management are reviewed in the app. Auto Care requires paid access, and availability differs by edition. See the [complete workflow and current boundaries](https://mintstorage.app/agent-safe-file-operations-mac/) and [canonical product facts](https://mintstorage.app/product-facts.json).

This npm package is a small open-source launcher. It locates the signed `mint-cli` bundled with the direct edition of Mint, verifies the DZG Studio LLC code signature, and starts its local stdio MCP server. It does not contain Mint itself or send storage data to DZG Studio. Tool results are shared with the MCP client you connect; that client may use a remote AI provider.

## Requirements

- macOS 14 Sonoma or later
- Node.js 18 or later
- Mint Direct from https://mintstorage.app/ (macOS 14 or later); keep the native app updated

Install Mint and launch it once from Finder. Mint normally links `mint-cli` into `/opt/homebrew/bin` or `/usr/local/bin`; the launcher can also use the binary inside `/Applications/Mint.app`.

The npm launcher’s currently published version is 1.0.1. The native app supplies the tools, so installing the launcher alone does not update the scanner or execution engine. Setapp and Mac App Store editions do not include CLI/MCP. See [current product and edition facts](https://mintstorage.app/build-journey/how-mint-works/) and [Direct pricing](https://mintstorage.app/pricing/).

## Configure an MCP client

```json
{
  "mcpServers": {
    "mint": {
      "command": "npx",
      "args": ["-y", "@dzg-studio/mcp-server-mint@1.0.1"]
    }
  }
}
```

Or, if `mint-cli` is already on `PATH`:

```bash
mint-cli mcp
```

Set `MINT_CLI_PATH=/absolute/path/to/mint-cli` to use a nonstandard installation.

## Claude Desktop extension

The `mcpb/` source in the public repository packages this launcher as a one-click Claude Desktop extension. Build it with `npx -y @anthropic-ai/mcpb pack mcpb/ mint-safe-mac-storage.mcpb`, then install the resulting file from **Settings → Extensions → Advanced Settings → Install Extension**.

## Tools

- `mint_status` — disk trends, recent activity, and managed-folder status.
- `mint_why` — storage-growth attribution or operations involving a path.
- `mint_scan` — read-only reclaimable-space survey.
- `mint_agents` — read-only AI-tool storage from Mint's latest scan: usage by tool, conversation age and state, and compressible archived Codex media.
- `mint_recent` and `mint_activity` — operation history and reasons.
- `mint_rules` — list and dry-run cleanup rules.
- `mint_execute` — journaled cleanup with a reason and returned `batchId`.

Tool schemas and supported operations depend on the installed native app. Read the current tool schema before execution; do not reuse an older example as authorization.

## Safety model

`mint_execute` can only move items to Trash, and only inside Mint’s cleanup roots or user-managed folders. Protected paths are refused, and Needs Review paths must be confirmed in Mint.app. Recoverable actions enter Mint’s 90-day operation journal and can be undone while both the journal entry and underlying trashed item remain available. Permanent deletion is not exposed to agents.

The server asks clients to use reviewed Mint operations. It cannot prevent an agent from invoking another deletion tool. A scan is not user consent to change files. Moving files to Trash on the same volume does not itself recover disk space; do not report moved bytes as physically reclaimed bytes.

## License

The launcher in this repository is MIT licensed. Mint is commercial software published by DZG Studio LLC under its own terms.
