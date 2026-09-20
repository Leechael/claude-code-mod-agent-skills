# Design notes (draft)

## Goal

Make Codex/Pi-style `.agents/skills` usable inside Claude Code **only** through the Mods / Function Hooks API — no engine patch, no required symlink into `.claude/skills`.

## Data flow

```
session.start
  └─ discoverAll(project ancestors + ~/.agents/skills)
       ├─ $.command.register(each)          [optional]
       ├─ prompt.context ← catalog block    [optional]
       ├─ command.run → expandSkillBody     [optional]
       └─ tool.call(Skill) → expand or next [optional]
```

## Precedence

1. Project `.agents/skills` (nearest ancestor first; first win on `commandName`)
2. User `~/.agents/skills`
3. If `preferClaudeSkills`: native `.claude/skills` / plugins keep the name

## Why three surfaces

| Surface | Who triggers | Why needed |
|---------|--------------|------------|
| Slash `/name` | User | Explicit invoke without Skill tool |
| Catalog in context | Model | Awareness without native Skill index |
| Skill tool intercept | Model | Same UX as first-party skills when the tool is used |

Any one can be disabled via `userConfig`.

## Verification before v0.1 release

Against installed `claude-code.d.ts`:

- [ ] `$.command.register` signature
- [ ] `command.run` event fields (`name`, `args`, result `prompt` / `handled`)
- [ ] `prompt.context` merge key (`additionalContext` vs instructionFiles / skills[])
- [ ] `tool.call` filter `{ tool: 'Skill' }` and result shape
- [ ] `$.fs.readdir` / `read` / `stat` / `$.session.cwd` / `root` / `$.env.get`

## Non-goals

Engine-level `.agents` walk (that belongs in Claude Code core, like AGENTS.md did via agents-md + engine cooperation).
