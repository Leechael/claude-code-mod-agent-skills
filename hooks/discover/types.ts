/**
 * One Agent Skill found under an `.agents/skills` tree.
 */
export type DiscoveredSkill = {
  /** Directory basename; also the default slash / Skill name. */
  name: string
  /** Absolute path to the skill folder (contains SKILL.md). */
  dir: string
  /** Absolute path to SKILL.md. */
  skillFile: string
  /** Frontmatter description, or empty. */
  description: string
  /** Frontmatter name when present and valid; else basename. */
  commandName: string
  /** Where it was found. */
  scope: 'project' | 'user'
}
