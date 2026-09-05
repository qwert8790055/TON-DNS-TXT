# OPERATION 破甲 · iOS Mobile Red Team

> NULL//ORDER · Authorized Mobile Assessment · RULE #01

一键化 iOS 客户端「破甲」红队行动框架。覆盖侦察 → 武器化 → 甲胄检测 → 突破 → 静态分析 → 报告生成全链路。

## 快速开始

```bash
# 离线模式（生成战术报告，无需设备）
./armor_break.sh --dry-run

# 实弹模式（需越狱 iPhone USB 连接 + frida-server）
./armor_break.sh -t "AppDisplayName" -b com.example.bundleid
```

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
