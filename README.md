# Mint MCP Server

Smart disk and memory. For you and your agents.

Mint is a Mac app that keeps disk and memory healthy for you and the AI agents
working on your Mac. It gets space back, much of it without deleting a file,
frees memory from apps you aren't using, knows what coding agents leave behind,
and can run on its own. This launcher connects your MCP client to Mint's own
engine: it finds the signed Mint CLI on your Mac, checks that it is compatible
and starts its local stdio server (`mint-cli mcp`). It does not include or
install Mint, and there is no hosted MCP service. Tool results are shared with
the AI client you connect.

## Requirements

- macOS 14 or later and Node.js 18 or later.
- Mint for Mac 1.2.0 or later, the edition from
  [mintstorage.app/download](https://mintstorage.app/download/). Open it once
  after installing. The Mac App Store and Setapp editions have no command-line
  tool. Updating this launcher does not update Mint itself.

The launcher looks for `mint-cli` inside `/Applications/Mint.app` first, then
`~/Applications/Mint.app`, `/opt/homebrew/bin` and `/usr/local/bin`.
`MINT_CLI_PATH` can name another official copy. Every candidate must carry
DZG Studio's Developer ID signature (team DRV5ZMT5U8) before its bounded
version probe runs, and must report `mcp.native-actions.v1`, `mcp.jobs.v1` and
`mcp.native-approval.v1`; an older Mint is refused with an update message.

## Set up your client

Most clients take this entry in their MCP configuration:

```json
{"mcpServers":{"mint":{"command":"npx","args":["-y","@dzg-studio/mcp-server-mint@1.2.1"]}}}
```

**Cursor:** [![Add Mint to Cursor](https://cursor.com/deeplink/mcp-install-dark.png)](https://cursor.com/install-mcp?name=mint&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBkemctc3R1ZGlvL21jcC1zZXJ2ZXItbWludEAxLjIuMSJdfQ%3D%3D)
or add the entry above to `~/.cursor/mcp.json`.

**Claude Code:** `claude mcp add mint -- npx -y @dzg-studio/mcp-server-mint@1.2.1`,
or install the [Mint for Mac plugin](https://github.com/dzg-studio/mint-claude-plugin).

Without Node, any client can start Mint's server directly:

```json
{"mcpServers":{"mint":{"command":"/Applications/Mint.app/Contents/Resources/mint-cli","args":["mcp"]}}}
```

The 58 tools cover these workflows:

| Workflow | Tools |
| --- | --- |
| Compatibility and access | `mint_capabilities`, `mint_access` |
| Saved storage observations | `mint_status`, `mint_why`, `mint_agents`, `mint_recent`, `mint_activity` |
| Full native Disk | `mint_disk_scan`, `mint_disk_clean` |
| Lossless optimization | `mint_storage_scan`, `mint_storage_optimize`; `mint_sharing_scan`, `mint_sharing_execute` for copies only |
| AI conversations | `mint_conversations_scan/optimize/remove_media/delete`, `mint_archives_optimize` |
| Claude conversation media | `mint_compression_scan`, `mint_compression_execute` |
| Individual pictures | `mint_pictures_scan/keep/remove`, `mint_picture_preview`, `mint_picture_file_scan` |
| Trash | `mint_trash_scan`, `mint_trash_remove` |
| Memory | `mint_memory_scan`, `mint_memory_release` |
| Apps | `mint_apps_list`, `mint_uninstall_scan`, `mint_uninstall_execute` |
| Organize | `mint_organize_folders/add/remove/configure/preview/run` |
| Auto Care | `mint_autocare_status/disk/folder/memory` |
| Rules | `mint_rules`, `mint_rule_create/update/enable/disable/remove/scan` |
| Handling permissions | `mint_handling_list`, `mint_handling_set` |
| History and recovery | `mint_history`, `mint_undo_list`, `mint_undo` |
| Progress and Stop | `mint_job_status`, `mint_job_cancel` |
| Compatible limited cleanup | `mint_scan`, `mint_execute` |

Discover `tools/list` for exact names and schemas. A scan is not consent.
New mutating tools require `confirmed:true` for the exact user-approved action
and selection. Permanent cleanup/deletion and irreversible media removal also
require `confirmPermanent:true`. Advanced memory termination requires
`allowAdvanced:true` and `confirmAdvanced:true`. Configuration and handling
changes are separate operations requiring their own approval.

Native scan sessions expire after 15 minutes and are consumed once. Use exact
reviewed IDs. Protection, current identities, native access and macOS permission
checks remain in effect. The App owns automation scheduling and owner-managed
conversation actions. There is no shell-command tool or permission bypass.

Long operations return `jobId` by default. Poll `mint_job_status` for native
progress and the final receipt. Stop is cooperative only where the native
workflow supports it. A lost response means the outcome is unknown: consult
the saved receipt/History before retrying. Never infer that a request changed
nothing merely because its connection was lost.

Report actual partial failures and measurements. Processed or trashed bytes
are not physical free space. Undo is available only where the native receipt
and `mint_undo_list` offer it. Lossless compression preserves logical contents;
conversation media removal permanently removes pictures while retaining text.

Legacy `mint_scan`/`mint_execute` retain their restricted Trash-only contract:
`planId`, 1–100 unique `itemIds`, a reason, and optional `action:"trash"`.
Only legacy rows marked `executable:true` are eligible there. Old clients do not
gain permanent-delete authority by using their old execute tool.

**Usage data.** Mint (the app, not this launcher) records which tool your
assistant called and the assistant's name (for example Claude Code or Cursor),
whether it worked and how long it took, so we can see what helps and fix what
breaks. It never records your files, file names, paths, prompts or arguments,
or what came back. It follows the Share my usage statistics switch on Mint's
About page; turn it off there and nothing is recorded.

High-risk operations require the person to review and click confirmation inside
Mint. Caller confirmation fields only request the operation; they cannot answer
that dialog. Do not click it on the person's behalf or use CLI/shell workarounds.
The review expires after two minutes. Cancel, close, timeout or changed targets
refuse the request without starting its effects. Poll the job receipt; never
retry automatically. This rule includes permanent and picture removal, app
quit/termination, protection reduction and enabling standing automation.

The launcher is MIT licensed. Mint has separate product
[terms](https://mintstorage.app/terms).
