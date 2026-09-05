#!/usr/bin/env bash
# 一键自动执行破甲行动（仓库根目录入口）
exec "$(cd "$(dirname "$0")" && pwd)/null-order/mobile/pojia/auto_run.sh" "$@"
