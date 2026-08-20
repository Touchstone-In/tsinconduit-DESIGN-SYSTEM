#!/usr/bin/env bash
# Builds projects/assay-ui and publishes it to its own orphan branch, named
# assay-ui-vX.Y.Z, so consuming services can install a specific version as a git-branch
# dependency (see README.md). One branch per release (not a shared `dist` branch + tags):
# this org's GitHub ruleset rejects tag pushes from this session's credentials, so versions
# are addressed by branch name instead — same consumer-facing syntax either way
# (github:...#<ref>), just a branch ref instead of a tag ref. Run from the repo root.
set -euo pipefail

VERSION="${1:?Usage: scripts/release.sh <version, e.g. 0.1.0>}"
REF="assay-ui-v${VERSION}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "error: working tree has uncommitted changes — commit or stash first" >&2
  exit 1
fi

echo "==> Setting projects/assay-ui/package.json version to ${VERSION}"
node -e "
  const fs = require('fs');
  const p = 'projects/assay-ui/package.json';
  const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
  pkg.version = '${VERSION}';
  fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
"
git add projects/assay-ui/package.json
git diff --cached --quiet || git commit -m "assay-ui v${VERSION}"

echo "==> Building assay-ui"
npx --no-install ng build assay-ui

echo "==> Publishing dist/assay-ui to the ${REF} branch"
if git ls-remote --exit-code --heads origin "$REF" >/dev/null 2>&1; then
  echo "error: branch ${REF} already exists on origin — versions are immutable, bump the version" >&2
  exit 1
fi

WORKTREE="$(mktemp -d)"
rmdir "$WORKTREE"
trap 'git worktree remove "$WORKTREE" --force 2>/dev/null; rm -rf "$WORKTREE"' EXIT

git worktree add --orphan -b "$REF" "$WORKTREE"
cp -r dist/assay-ui/. "$WORKTREE"/
git -C "$WORKTREE" add -A
git -C "$WORKTREE" commit -m "assay-ui v${VERSION}"

git push origin main
git push origin "$REF"

echo "==> Done. Consumers install:"
echo "    \"assay-ui\": \"github:Touchstone-In/tsinconduit-design-system#${REF}\""
