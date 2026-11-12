import type { EngineInterface } from 'claude-code'

import { parseFrontmatter } from './parse-frontmatter.ts'
import type { DiscoveredSkill } from './types.ts'

const SKILL_MD = 'SKILL.md'

async function listSkillDirs(
  $: EngineInterface,
  skillsRoot: string,
): Promise<string[]> {
  const listing = await $.fs
    .readdir(skillsRoot)
    .catch(() => [] as string[])
  const dirs: string[] = []
  for (const name of listing) {
    if (name.startsWith('.')) continue
    const dir = `${skillsRoot.replace(/\/$/, '')}/${name}`
    const st = await $.fs.stat(dir).catch(() => undefined)
    if (st?.isDirectory) dirs.push(dir)
  }
  return dirs
}

async function readSkill(
  $: EngineInterface,
  dir: string,
  scope: DiscoveredSkill['scope'],
): Promise<DiscoveredSkill | undefined> {
  const skillFile = `${dir}/${SKILL_MD}`
  const text = await $.fs.read(skillFile).catch(() => undefined)
  if (typeof text !== 'string' || text.length === 0) return undefined
  const { name, description } = parseFrontmatter(text)
  const basename = dir.split('/').filter(Boolean).at(-1) ?? 'skill'
  const commandName = (name && /^[a-z0-9][a-z0-9-]{0,63}$/.test(name)
    ? name
    : basename
  ).toLowerCase()
  return {
    name: basename,
    dir,
    skillFile,
    description: description ?? '',
    commandName,
    scope,
  }
}

/**
 * Walk cwd → ancestors for `<dir>/.agents/skills`, stop at git root when known.
 */
export async function discoverProjectSkills(
  $: EngineInterface,
): Promise<DiscoveredSkill[]> {
  const cwd = await $.session.cwd()
  const root = await $.session.root().catch(() => undefined)
  const out: DiscoveredSkill[] = []
  const seen = new Set<string>()

  let dir = cwd
  for (;;) {
    const skillsRoot = `${dir}/.agents/skills`
    for (const skillDir of await listSkillDirs($, skillsRoot)) {
      const skill = await readSkill($, skillDir, 'project')
      if (!skill || seen.has(skill.commandName)) continue
      seen.add(skill.commandName)
      out.push(skill)
    }
    if (root && dir === root) break
    const parent = dir.replace(/\/[^/]+\/?$/, '') || '/'
    if (parent === dir) break
    dir = parent
    if (!root && dir === '/') break
  }
  return out
}

/**
 * Scan `~/.agents/skills/*/SKILL.md`.
 */
export async function discoverUserSkills(
  $: EngineInterface,
): Promise<DiscoveredSkill[]> {
  const home =
    (await $.env.get('HOME').catch(() => undefined)) ||
    (await $.env.get('USERPROFILE').catch(() => undefined))
  if (!home) return []
  const out: DiscoveredSkill[] = []
  for (const skillDir of await listSkillDirs($, `${home}/.agents/skills`)) {
    const skill = await readSkill($, skillDir, 'user')
    if (skill) out.push(skill)
  }
  return out
}

/**
 * Project skills win over user skills on the same commandName.
 */
export async function discoverAll(
  $: EngineInterface,
  opts: { project: boolean; user: boolean },
): Promise<DiscoveredSkill[]> {
  const project = opts.project ? await discoverProjectSkills($) : []
  const names = new Set(project.map(s => s.commandName))
  const user = opts.user ? await discoverUserSkills($) : []
  return [...project, ...user.filter(s => !names.has(s.commandName))]
}
