#!/usr/bin/env bash
# Builds projects/assay-ui and publishes it to the orphan `dist` branch, tagged
# assay-ui-vX.Y.Z, so consuming services can install a specific version as a git-tag
# dependency (see README.md). Run from the repo root.
set -euo pipefail

VERSION="${1:?Usage: scripts/release.sh <version, e.g. 0.1.0>}"
TAG="assay-ui-v${VERSION}"
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

echo "==> Publishing dist/assay-ui to the dist branch, tagged ${TAG}"
git fetch origin dist 2>/dev/null || true
WORKTREE="$(mktemp -d)"
rmdir "$WORKTREE"
trap 'git worktree remove "$WORKTREE" --force 2>/dev/null; rm -rf "$WORKTREE"' EXIT

if git show-ref --verify --quiet refs/remotes/origin/dist; then
  git worktree add -B dist "$WORKTREE" origin/dist
else
  git worktree add --orphan -b dist "$WORKTREE"
fi

rm -rf "${WORKTREE:?}"/*
cp -r dist/assay-ui/. "$WORKTREE"/
git -C "$WORKTREE" add -A
git -C "$WORKTREE" commit -m "assay-ui v${VERSION}"
git -C "$WORKTREE" tag "$TAG"

git push origin main
git push origin dist
git push origin "$TAG"

echo "==> Done. Consumers install:"
echo "    \"assay-ui\": \"github:Touchstone-In/tsinconduit-design-system#${TAG}\""
