#!/usr/bin/env bash
# SessionStart hook — 세션 시작 시 다른 디바이스의 최근 진행 상황을 컨텍스트로 주입.
# Claude Code는 이 훅의 stdout을 사용자에게 보여주므로, 타 디바이스 변경분을
# 한눈에 파악 가능.

set -u
DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
PROGRESS="$DIR/.claude/progress.md"

if [ ! -f "$PROGRESS" ]; then
  exit 0
fi

HOST="$(hostname -s 2>/dev/null || hostname || echo '?')"

echo "## 🔁 Cross-device progress (.claude/progress.md 마지막 40줄)"
echo ""
tail -40 "$PROGRESS"
echo ""
echo "---"
echo "현재 디바이스: $HOST"

# 원격과 다른 커밋이 있으면 알림
if git -C "$DIR" rev-parse --verify --quiet HEAD >/dev/null 2>&1; then
  BEHIND="$(git -C "$DIR" rev-list --count HEAD..@{u} 2>/dev/null || echo 0)"
  AHEAD="$(git -C "$DIR" rev-list --count @{u}..HEAD 2>/dev/null || echo 0)"
  if [ "$BEHIND" -gt 0 ] || [ "$AHEAD" -gt 0 ]; then
    echo "⚠ 원격과 동기화 필요: ahead $AHEAD / behind $BEHIND — \`git pull\` 또는 \`git push\` 검토."
  fi
fi

exit 0
