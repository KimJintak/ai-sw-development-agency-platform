#!/usr/bin/env bash
# Stop hook — 세션 종료 시 .claude/progress.md 에 타임스탬프 + 최근 커밋 기록
# 자동 commit/push 는 하지 않음 (충돌 방지). 사용자가 원할 때 커밋.

set -u
DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
PROGRESS="$DIR/.claude/progress.md"

# 초기 파일이 없으면 헤더 생성
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
  # 현재 변경사항 요약
  CHANGED="$(git -C "$DIR" diff --shortstat HEAD 2>/dev/null | head -1)"
  if [ -n "$CHANGED" ]; then
    echo ""
    echo "Uncommitted: $CHANGED"
  fi
} >> "$PROGRESS"

# progress.md 만 스테이지 (commit 은 사용자 판단)
git -C "$DIR" add .claude/progress.md 2>/dev/null || true

# 출력은 숨김 — 성공/실패와 무관하게 세션 흐름 방해하지 않음
exit 0
