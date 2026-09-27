import type { EngineInterface } from 'claude-code'

import type { DiscoveredSkill } from '../discover/types.ts'

/**
 * Register slash commands via EngineInterface during session.start.
 * Host may reject duplicate names — we log and skip.
 */
export async function registerViaEngine(
  $: EngineInterface,
  skills: readonly DiscoveredSkill[],
): Promise<string[]> {
  const registered: string[] = []
  const register = $.command?.register
  if (typeof register !== 'function') {
    $.ui?.log?.(
      'agents-skills: $.command.register unavailable — slash commands skipped',
    )
    return registered
  }

  for (const skill of skills) {
    try {
      await register({
        name: skill.commandName,
        description:
          skill.description ||
          `Agent skill from .agents/skills (${skill.scope})`,
        argumentHint: '[args]',
      })
      registered.push(skill.commandName)
    } catch (err) {
      $.ui?.log?.(
        `agents-skills: skip /${skill.commandName} (${String(err)})`,
      )
    }
  }
  return registered
}
