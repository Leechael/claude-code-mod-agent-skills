import type { On, PluginOptions } from 'claude-code'

import { catalogMarkdown } from './catalog/block.ts'
import { registerViaEngine } from './commands/register-all.ts'
import {
  discoverAll,
  expandSkillBody,
  type DiscoveredSkill,
} from './discover/index.ts'
import { interceptSkillTool } from './skill-tool/intercept.ts'

type Options = {
  projectSkills?: boolean
  userSkills?: boolean
  registerCommands?: boolean
  injectCatalog?: boolean
  interceptSkillTool?: boolean
  preferClaudeSkills?: boolean
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback
}

/**
 * agents-skills mod entry — Mods-only bridge for `.agents/skills`.
 *
 * Does not teach the engine a native `.agents` walk. See README / DESIGN.
 */
export function register(on: On, options: PluginOptions): void {
  const o = options as Options
  const wantProject = bool(o.projectSkills, true)
  const wantUser = bool(o.userSkills, true)
  const doCommands = bool(o.registerCommands, true)
  const doCatalog = bool(o.injectCatalog, true)
  const doIntercept = bool(o.interceptSkillTool, true)
  const preferClaude = bool(o.preferClaudeSkills, true)

  let skills: DiscoveredSkill[] = []
  let ready = false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function ensure($: any): Promise<void> {
    if (ready) return
    skills = await discoverAll($, { project: wantProject, user: wantUser })
    ready = true
  }

  on('session.start', async ($, e, next) => {
    await ensure($)
    if (doCommands) await registerViaEngine($, skills)
    $.ui?.log?.(
      skills.length === 0
        ? 'agents-skills: no skills under .agents/skills'
        : `agents-skills: ${skills.length} — ${skills.map(s => s.commandName).join(', ')}`,
    )
    return next(e)
  })

  if (doCommands) {
    on('command.run', async ($, e, next) => {
      await ensure($)
      const skill = skills.find(s => s.commandName === e.name)
      if (!skill) return next(e)
      if (preferClaude && (e as { source?: string }).source === 'claude') {
        return next(e)
      }
      const body = await expandSkillBody($, skill, e.args ?? '')
      return next({ ...e, prompt: body, handled: true })
    })
  }

  if (doCatalog) {
    on('prompt.context', async ($, e, next) => {
      await ensure($)
      const block = catalogMarkdown(skills)
      if (!block) return next(e)
      const prev =
        typeof (e as { additionalContext?: string }).additionalContext ===
        'string'
          ? (e as { additionalContext: string }).additionalContext
          : ''
      return next({
        ...e,
        additionalContext: prev ? `${prev}\n\n${block}` : block,
      })
    })
  }

  if (doIntercept) {
    interceptSkillTool(on, () => skills, preferClaude)
  }
}
