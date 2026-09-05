# OPERATION 破甲 · iOS Mobile Red Team

> NULL//ORDER · Authorized Mobile Assessment · RULE #01

一键化 iOS 客户端「破甲」红队行动框架。覆盖侦察 → 武器化 → 甲胄检测 → 突破 → 静态分析 → 报告生成全链路。

## 快速开始

```bash
# 自动执行 + 保存数据（推荐）
./auto_run.sh

# 指定目标 + 自动保存
./auto_run.sh -t "AppDisplayName" -b com.example.bundleid

# 监视模式：每 60 秒检测设备并重跑
./auto_run.sh --watch 60

# 手动执行
./armor_break.sh --dry-run
```

## 数据保存

每次行动结束后自动归档至 `data/`：

```
data/
├── index.json          # 行动索引（提交到 git）
├── latest/             # 最近一次快照（gitignored）
│   ├── manifest.json
│   ├── 01_recon.txt … 05_static_triage.txt
│   ├── report.md
│   └── test_result.log
└── archive/            # 历史压缩包（gitignored）
    └── POJIA-*.tar.gz
```

手动保存：`./save_data.sh POJIA-20260905-140111`

## 目录结构

```
pojia/
├── armor_break.sh          # 一键行动主脚本
├── hooks/
│   ├── jailbreak_bypass.js # 越狱检测绕过
│   ├── ssl_pinning_bypass.js
│   └── anti_debug_bypass.js
└── artifacts/              # 行动工件 (gitignored)
```

## 前置条件

- 越狱 iPhone (推荐 iOS 12.x + checkra1n)
- 设备端: OpenSSH, frida-server (版本匹配), AppSync Unified
- 主机端: 由 `.cursor/ios-re-install.sh` 自动安装

## 报告

行动完成后自动生成至 `null-order/reports/NØ-OPERATION-破甲-<ID>.md`
