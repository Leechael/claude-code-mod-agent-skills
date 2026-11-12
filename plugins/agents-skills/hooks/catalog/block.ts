import type { DiscoveredSkill } from '../discover/types.ts'

/**
 * Short catalog block for prompt.context (engine treats unknown fields
 * per Mods docs — we attach as an extra instruction-style string via
 * the hook return shape the host accepts for `context` appendages).
 *
 * Draft note: exact ContextSkill / instructionFiles merge API may differ
 * by Claude Code build; prefer appending a plain text block the model sees.
 */
export function catalogMarkdown(skills: readonly DiscoveredSkill[]): string {
  if (skills.length === 0) return ''
  const lines = [
    '## Available skills (`.agents/skills`)',
    '',
    'These skills are bridged by the `agents-skills` mod (not under `.claude/skills`).',
    'Invoke with `/<name>` or ask to use the skill by name.',
    '',
  ]
  for (const s of skills) {
    const desc = s.description || '(no description)'
    lines.push(`- \`/${s.commandName}\` (${s.scope}): ${desc}`)
  }
  lines.push('')
  return lines.join('\n')
}
