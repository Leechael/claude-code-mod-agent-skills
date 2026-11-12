# agents-skills

Claude Code **mod** that bridges the shared Agent Skills tree (`.agents/skills`) into Claude Code **without** native engine support and **without** symlinking into `.claude/skills`.

Draft for Claude Code Mods / Function Hooks. Not an Anthropic product.

## Why

- Codex and Pi load skills from `.agents/skills` (and `~/.agents/skills`).
- Claude Code natively loads `.claude/skills` (and plugins).
- PR [#95409](https://github.com/anthropics/claude-code/pull/95409) adds `AGENTS.md` as project instructions — **not** `.agents/skills`.
- Community interoperability today is mostly **symlink / install into `.claude/skills`** (e.g. `vercel-labs/add-skill`). GitHub search found **no** existing mod that discovers `.agents/skills` via Mods.

This mod is the Mods-native blank: discover → slash commands → optional Skill-tool intercept → optional prompt catalog.

## What it does

| Path | Hook / API | Effect |
|------|------------|--------|
| Discover | `session.start` + `$.fs` | Scan project ancestors for `.agents/skills/*/SKILL.md` and `~/.agents/skills/*/SKILL.md` |
| Slash commands | `$.command.register` + `command.run` | `/name` expands that skill’s body (with `$ARGUMENTS` / `$0`) |
| Catalog | `prompt.context` | Inject a short “Available skills (.agents/skills)” list |
| Skill tool | `tool.call` on `Skill` | If the engine misses the name, load our SKILL.md instead |

Project skills win over user skills on the same `commandName`. With `preferClaudeSkills` (default), a name already owned by `.claude/skills` is left alone.

## Layout expected

```
<project>/
  .agents/
    skills/
      my-skill/
        SKILL.md          # YAML frontmatter: name, description
~/.agents/
  skills/
    shared-skill/
      SKILL.md
```

Frontmatter (minimal):

```yaml
---
name: my-skill
description: One line on when to use this skill.
---
Body the model should follow…
```

## Install

### From marketplace

```bash
claude plugin marketplace add Leechael/claude-code-mod-agent-skills
claude plugin install agents-skills@claude-code-mod-agent-skills
```

### Development (local checkout)

```bash
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude --plugin-dir ./plugins/agents-skills
```

To persist function hooks across sessions, add to your Claude Code settings.json:

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_FUNCTION_HOOKS": "1"
  }
}
```

## Options (`userConfig`)

| Option | Default | Meaning |
|--------|---------|---------|
| `projectSkills` | `true` | Scan ancestor `.agents/skills` |
| `userSkills` | `true` | Scan `~/.agents/skills` |
| `registerCommands` | `true` | Register `/name` commands |
| `injectCatalog` | `true` | Add catalog block on `prompt.context` |
| `interceptSkillTool` | `true` | Bridge Skill tool for our names |
| `preferClaudeSkills` | `true` | On clash, keep native `.claude/skills` |

## Limits (read before shipping)

1. **Not native discovery.** Claude Code still does not walk `.agents` itself. Skills only appear through this mod’s hooks.
2. **API surface is draft-shaped.** Field names on `command.run` (`prompt` / `handled`), `prompt.context` (`additionalContext`), and Skill `tool.call` results must be checked against the installed `mods/types/claude-code.d.ts` before release. Adjust merge keys if the host rejects them.
3. **No progress / permission UI parity** with first-party Skill loading unless the host exposes those nouns — this draft returns body text only.
4. **Name clashes.** Prefer Claude’s skills when `preferClaudeSkills` is on; otherwise last register wins or the host errors.
5. **Does not replace symlinks** for tools that only scan `.claude/skills` outside the Mods path (other CLIs, CI, editors).

## Out of scope (v0)

- Writing skills into `.claude/skills`
- Auto-update after marketplace installation
- Full YAML frontmatter (only `name` + `description`)
- Watching the filesystem for hot reload (re-discover on next `session.start`)

## Smoke

```bash
./tests/smoke.sh
```

Parses a fixture SKILL.md and prints the discovered `commandName` + description (no Claude Code runtime required).

## Related

- Anthropic `mods/agents-md` — AGENTS.md as instruction files (`prompt.context`)
- Issue [#91870](https://github.com/anthropics/claude-code/issues/91870) — Function Hooks / Mods discussion
- Community symlink approach — `vercel-labs/add-skill`, `PaulRBerg/dot-agents`, etc.
