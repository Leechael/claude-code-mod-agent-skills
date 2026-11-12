import type { On } from 'claude-code'

import { expandSkillBody, type DiscoveredSkill } from '../discover/index.ts'

/**
 * Intercept Skill tool for names we discovered under .agents/skills.
 */
export function interceptSkillTool(
  on: On,
  getSkills: () => readonly DiscoveredSkill[],
  preferClaude: boolean,
): void {
  on('tool.call', { tool: 'Skill' }, async ($, e, next) => {
    const input = (e.input ?? (e as { args?: unknown }).args ?? {}) as {
      skill?: string
      name?: string
      args?: string
      arguments?: string
    }
    const name = (input.skill || input.name || '').toLowerCase()
    const skill = getSkills().find(s => s.commandName === name)
    if (!skill) return next(e)

    if (preferClaude) {
      const result = await next(e)
      const failed =
        result &&
        typeof result === 'object' &&
        ('error' in (result as object) ||
          (result as { isError?: boolean }).isError === true ||
          /not found|unknown skill/i.test(
            String((result as { content?: string }).content ?? ''),
          ))
      if (!failed) return result
    }

    const body = await expandSkillBody(
      $,
      skill,
      input.args ?? input.arguments ?? '',
    )
    return { result: { content: body, isError: false }, handled: true }
  })
}
