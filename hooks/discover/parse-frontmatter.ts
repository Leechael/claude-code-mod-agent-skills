/**
 * Minimal YAML frontmatter reader for SKILL.md (name + description only).
 * Not a full YAML parser — enough for Agent Skills frontmatter.
 */
export function parseFrontmatter(text: string): {
  name?: string
  description?: string
  body: string
} {
  if (!text.startsWith('---')) {
    return { body: text }
  }
  const end = text.indexOf('\n---', 3)
  if (end === -1) {
    return { body: text }
  }
  const raw = text.slice(4, end).trim()
  const body = text.slice(end + 4).replace(/^\n/, '')
  let name: string | undefined
  let description: string | undefined
  for (const line of raw.split('\n')) {
    const m = /^(name|description)\s*:\s*(.*)$/.exec(line)
    if (!m) continue
    const key = m[1]
    let val = m[2].trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (key === 'name') name = val
    if (key === 'description') description = val
  }
  return { name, description, body }
}
