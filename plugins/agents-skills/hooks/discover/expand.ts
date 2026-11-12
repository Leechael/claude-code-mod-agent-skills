import type { EngineInterface } from 'claude-code'

import { parseFrontmatter } from './parse-frontmatter.ts'
import type { DiscoveredSkill } from './types.ts'

/**
 * Load SKILL.md body and substitute $ARGUMENTS / $0.. style placeholders.
 */
export async function expandSkillBody(
  $: EngineInterface,
  skill: DiscoveredSkill,
  args: string,
): Promise<string> {
  const text = await $.fs.read(skill.skillFile)
  const { body } = parseFrontmatter(text)
  const parts = shellSplit(args)
  let out = body
  out = out.replaceAll('$ARGUMENTS', args)
  out = out.replace(/\$ARGUMENTS\[(\d+)\]/g, (_, i) => parts[Number(i)] ?? '')
  out = out.replace(/\$(\d+)\b/g, (_, i) => parts[Number(i)] ?? '')
  out = out.replaceAll('${CLAUDE_SKILL_DIR}', skill.dir)
  out = out.replaceAll('$CLAUDE_SKILL_DIR', skill.dir)
  return out
}

function shellSplit(args: string): string[] {
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(args))) {
    out.push(m[1] ?? m[2] ?? m[3] ?? '')
  }
  return out
}
