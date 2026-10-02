#!/usr/bin/env bash
# P24: merge one deployment stage (a commit of p24-couverture) into master, docs conflicts kept from master (master
# already holds the newest report and plan), then check that master's code equals the tested commit. No push here.
# Usage: bash scripts/p24/merge-stage.sh <sha> "<message>"
set -e
sha="$1"; msg="$2"
git checkout -q master
git merge --no-ff "$sha" -m "$msg

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" >/dev/null 2>&1 || true
for f in $(git diff --name-only --diff-filter=U); do
  case "$f" in docs/*|claude/*) git checkout --ours -- "$f"; git add -- "$f";; *) echo "CODE CONFLICT: $f"; exit 1;; esac
done
if git rev-parse -q --verify MERGE_HEAD >/dev/null; then git -c core.editor=true commit -q --no-edit; fi
if [ -n "$(git diff --stat "$sha" HEAD -- . ':(exclude)docs/**' ':(exclude)claude/**')" ]; then echo "CODE DIFFERS FROM $sha"; exit 1; fi
echo "merged $(git rev-parse --short HEAD) = code of $sha"
