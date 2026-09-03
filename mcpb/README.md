# Mint — Safe Mac Storage for Claude Desktop

This MCP Bundle connects Claude Desktop to the local MCP server included with Mint Direct. It does not contain the Mint app and does not send file contents, scan results, or operation history to DZG Studio.

## Requirements

- macOS 14 Sonoma or later
- Mint Direct 1.0.25 or later from https://mint.dzgapp.com
- Mint launched once from Finder so its local data and CLI are available

The launcher verifies that `mint-cli` is signed by DZG Studio LLC (Team ID `DRV5ZMT5U8`) before it starts the server.

## Install

In Claude Desktop, open **Settings → Extensions → Advanced Settings → Install Extension**, then choose the packaged `.mcpb` file.

## Safety

Mint exposes read-only storage status, AI-tool storage, scan, attribution, journal, activity, and rule-dry-run tools. Its only mutating MCP tool is Trash-only and limited to Mint cleanup roots or user-managed folders. Protected paths are refused; Needs Review paths must be confirmed in Mint. Eligible Trash actions are recorded in Mint's 90-day operation journal and can be undone while the underlying item remains in Trash. Permanent deletion is not exposed to agents.

## License

The extension launcher is MIT licensed. Mint is commercial software published by DZG Studio LLC under its own terms.
