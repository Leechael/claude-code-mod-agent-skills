#!/usr/bin/env bash
# Offline smoke: parse fixture SKILL.md the way discover/parse-frontmatter does.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FIX="$ROOT/tests/fixtures/project/.agents/skills/demo-skill/SKILL.md"

python3 - <<PY
from pathlib import Path
text = Path("$FIX").read_text()
assert text.startswith("---"), "missing frontmatter"
end = text.find("\n---", 3)
raw, body = text[4:end].strip(), text[end+4:].lstrip("\n")
meta = {}
for line in raw.splitlines():
    if ":" in line:
        k, v = line.split(":", 1)
        meta[k.strip()] = v.strip().strip("\"'")
assert meta.get("name") == "demo-skill"
assert "smoke-testing" in meta.get("description", "")
assert "\$ARGUMENTS" in body or "\$ARGUMENTS" in body.replace("\\\\","")
print("ok: demo-skill —", meta["description"])
print("body lines:", len(body.splitlines()))
PY

# also list tree
find "$ROOT/tests/fixtures" -name SKILL.md | sort
echo "smoke passed"
