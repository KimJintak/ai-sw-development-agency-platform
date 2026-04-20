#!/usr/bin/env bash
# Stop hook — 세션 종료 시 .claude/progress.md 에 타임스탬프 + 최근 커밋 기록 →
# progress.md 만 자동 commit → pull --rebase → push. 실패는 조용히 로그만.
#
# 비활성화: export CLAUDE_AUTO_PUSH=0

set -u
DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
PROGRESS="$DIR/.claude/progress.md"
LOG="$DIR/.claude/hooks/.last-sync.log"

# ── 1) progress.md 엔트리 추가 ──
if [ ! -f "$PROGRESS" ]; then
  {
    echo "# Progress Log"
    echo ""
    echo "Claude Code 세션 종료 시 자동 추가되는 디바이스 간 공유 로그."
    echo ""
  } > "$PROGRESS"
fi

HOST="$(hostname -s 2>/dev/null || hostname || echo '?')"
BRANCH="$(git -C "$DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

{
  echo ""
  echo "## $TS · $HOST · $BRANCH"
  echo ""
  echo "Recent commits:"
  git -C "$DIR" log --oneline -5 2>/dev/null | sed 's/^/- /'
  CHANGED="$(git -C "$DIR" diff --shortstat HEAD 2>/dev/null | head -1)"
  if [ -n "$CHANGED" ]; then
    echo ""
    echo "Uncommitted: $CHANGED"
  fi
} >> "$PROGRESS"

# ── 2) 자동 커밋 + push (opt-out: CLAUDE_AUTO_PUSH=0) ──
if [ "${CLAUDE_AUTO_PUSH:-1}" = "0" ]; then
  git -C "$DIR" add .claude/progress.md 2>/dev/null || true
  exit 0
fi

{
  echo "=== $TS · $HOST ==="

  # progress.md 만 정확히 스테이지/커밋 (다른 변경사항 절대 포함 금지)
  git -C "$DIR" add .claude/progress.md

  # 실제 staged diff 가 있는지 확인 (없으면 skip)
  if git -C "$DIR" diff --cached --quiet; then
    echo "no progress changes to commit"
    exit 0
  fi

  # progress.md 만 커밋 (git commit -- <path>: 그 경로만 커밋, 다른 staged는 제외)
  if ! git -C "$DIR" commit -q -m "chore(progress): auto log from $HOST" -- .claude/progress.md; then
    echo "commit failed — staged state kept intact"
    exit 0
  fi

  # upstream 이 없으면 push 건너뜀
  if ! git -C "$DIR" rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
    echo "no upstream — skip push"
    exit 0
  fi

  # rebase-based pull: 충돌 시 abort 하고 skip
  if ! git -C "$DIR" pull --rebase --autostash -q 2>&1; then
    echo "pull --rebase failed; aborting and skipping push"
    git -C "$DIR" rebase --abort 2>/dev/null || true
    exit 0
  fi

  # push
  if ! git -C "$DIR" push -q 2>&1; then
    echo "push failed"
    exit 0
  fi

  echo "synced ✓"
} >> "$LOG" 2>&1

exit 0
