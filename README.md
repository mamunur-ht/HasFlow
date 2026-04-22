# webflow-agent

A Claude skill for working with Webflow sites through the [Webflow MCP server](https://developers.webflow.com/mcp). Provides safe, structured workflows for CMS management, publishing, auditing, and (upcoming) HTML→Webflow conversion.

## What It Does

| Skill | Description |
|---|---|
| `safe-publish` | Two-phase publish: static pages + CMS items, with real deployment verification |
| `bulk-cms-update` | Batch create/update CMS items with preview and granular approval |
| `cms-collection-setup` | Create CMS collections with custom fields and relationships |
| `cms-best-practices` | Architecture guidance for planning CMS structure |
| `site-audit` | Health score (0–100), SEO, page structure, CMS content quality |
| `asset-audit` | Image size, format, and compression analysis |
| `link-checker` | Find and fix broken/insecure links across all pages and CMS content |
| `accessibility-audit` | WCAG 2.1 audit — missing labels, focus issues, heading hierarchy |
| `flowkit-naming` | Apply Webflow's official FlowKit CSS naming conventions |
| `custom-code-management` | Safely manage tracking scripts and custom code (up to 10,000 chars) |

## Installation

### 1. Add the Webflow MCP server to Claude Code

```bash
claude mcp add --transport http webflow https://mcp.webflow.com/mcp
```

### 2. Install the skill

Copy `skills/webflow-agent/SKILL.md` into your Claude skills directory.

### 3. Verify

Ask Claude to list your Webflow sites — it should call `data_sites_tool` with `list_sites` automatically.

## Key Design Decisions

**Why two publish steps?**
Webflow's `publish_site` only publishes static pages and design changes. CMS draft items require a separate `publish_collection_items` call per collection. Skipping this is the most common cause of blank pages after publishing.

**Why inside-out element building?**
`element_builder` has a hard 3-level nesting limit per call. Real HTML structures are deeper. The skill handles this by building the deepest subtrees first as components, then assembling outward.

**Why cursor tracking on rate limits?**
Retrying a full batch after a rate limit hit causes duplicate CMS writes. The skill tracks `lastSuccessfulIndex` so retries resume from exactly where they stopped.

## Bugs Fixed (v1.0)

- 🔴 Blank page on publish: `safe-publish` now publishes CMS collections separately
- 🔴 `publish_items` → `publish_collection_items` (correct tool name)
- 🔴 Script size limit corrected: 2,000 → 10,000 chars
- 🟡 Deployment verification is now real (checks `lastPublished` timestamp)
- 🟡 `element_builder` depth limit documented with inside-out chunking strategy
- 🟡 Batch cursor tracking prevents duplicate writes on rate limit recovery
- 🟠 Designer pre-flight check added before all Designer-dependent tool calls

## Roadmap

- [ ] HTML/CSS/JS → Webflow converter
- [ ] Multi-page batch operations
- [ ] CMS content export/import
- [ ] Style guide generation from existing site

## License

MIT
