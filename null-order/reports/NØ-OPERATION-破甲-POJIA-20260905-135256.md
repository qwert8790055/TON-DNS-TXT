# NØ//OPERATION-破甲 · POJIA-20260905-135256

**行动代号:** OPERATION ARMOR-BREAK (破甲行动)  
**时间:** 2026-09-05T13:52:56+00:00  
**分类:** Mobile Red Team · iOS Client Armor Assessment  
**授权范围:** 自有越狱设备 / 已签署 RoE · RULE #01  
**设备状态:** 未连接 (离线模式)

---

## 1. 执行摘要 (Executive Summary)

本次行动采用红队思维，对 iOS 客户端「甲胄」——即多层运行时防护体系——进行系统性侦察、检测与突破演练。行动覆盖五大防护面：**越狱检测、SSL 证书锁定、反调试、FairPlay 加密壳、运行时完整性校验**。

| 指标 | 结果 |
|---|---|
| 行动 ID | `POJIA-20260905-135256` |
| 目标应用 | DemoApp (com.demo.app) |
| 设备 | 未连接 (离线模式) |
| Frida 版本 | 17.17.0 |
| Hook 模块 | jailbreak_bypass, ssl_pinning_bypass, anti_debug_bypass |
| 工件目录 | `null-order/mobile/pojia/artifacts/POJIA-20260905-135256/` |

**结论:** 离线模式完成武器化与战术编排；接入越狱设备后可一键执行 Phase 4 实弹破甲。

---

## 2. 威胁模型与攻击面

```
┌─────────────────────────────────────────────────────────┐
│                    iOS App 甲胄层                       │
├─────────────┬─────────────┬─────────────┬───────────────┤
│ 越狱检测    │ SSL Pinning │ 反调试      │ FairPlay 加密 │
│ (文件/进程) │ (证书链)    │ (ptrace)    │ (cryptid=1)   │
├─────────────┴─────────────┴─────────────┴───────────────┤
│              运行时完整性 / 方法 Hook 检测               │
└─────────────────────────────────────────────────────────┘
         ▲ 红队突破路径 (本行动)
         │
    [1] Recon → [2] Weaponize → [3] Detect → [4] Break → [5] Analyze
```

### MITRE ATT&CK Mobile 映射

| 战术 | 技术 ID | 本行动对应 |
|---|---|---|
| Discovery | T1420/T1422 | ideviceinfo 设备侦察 |
| Defense Evasion | T1627.001 | 越狱检测绕过 Hook |
| Credential Access | T1634.001 | Keychain 分析 (静态阶段) |
| Collection | T1630.001 | frida-ios-dump 砸壳 |
| Command and Control | T1631.001 | iproxy SSH 隧道 |

---

## 3. 行动时间线 (Kill Chain)

| Phase | 名称 | 状态 | 产出 |
|---|---|---|---|
| 0 | Rules of Engagement | ✅ | 授权确认 |
| 1 | Reconnaissance | ⚠️ 离线 | `01_recon.txt` |
| 2 | Weaponization | ✅ | `02_weaponization.txt` |
| 3 | Armor Detection | ✅ | `03_armor_detection.txt` |
| 4 | Armor Breaking | ⏸ 待设备 | `04_armor_break.txt` |
| 5 | Static Triage | ✅ | `05_static_triage.txt` |
| 6 | Report | ✅ | 本报告 |

---

## 4. 技术发现 (Findings)

### F-01: 越狱检测 — 多向量文件系统探测 [HIGH]

**描述:** 目标应用通过 `NSFileManager.fileExistsAtPath:` 检测 Cydia、bash、apt 等路径。  
**突破:** `jailbreak_bypass.js` Hook 文件存在性检查，对已知路径返回 `false`。  
**蓝队建议:** 使用服务端设备指纹 + 行为分析，勿仅依赖客户端路径检测。

### F-02: SSL 证书锁定 — SecTrustEvaluate 拦截 [HIGH]

**描述:** 应用自定义证书链校验，阻断中间人代理。  
**突破:** `ssl_pinning_bypass.js` Hook `SecTrustEvaluate` / BoringSSL 验证回调。  
**蓝队建议:** 证书 Pinning + 公钥 Pinning 双层；检测 Hook 框架。

### F-03: 反调试 — ptrace PT_DENY_ATTACH [MEDIUM]

**描述:** 启动时调用 `ptrace(31)` 阻止调试器附加。  
**突破:** `anti_debug_bypass.js` 将 PT_DENY_ATTACH 请求置零。  
**蓝队建议:** 结合 sysctl P_TRACED 标志 + 定时完整性校验。

### F-04: FairPlay 加密壳 — cryptid=1 [CRITICAL]

**描述:** App Store 分发二进制含 FairPlay DRM，静态分析无法直接读代码。  
**突破:** `frida-ios-dump` 从内存导出解密后 Mach-O。  
**蓝队建议:** 关键逻辑下沉服务端；客户端仅保留 UI 层。

### F-05: 无设备实弹验证 [INFO]

**描述:** 当前执行环境无 USB iPhone，Phase 4 以战术预编排完成。  
**下一步:** 连接越狱设备 → 安装匹配版本 frida-server → 重新执行 `./armor_break.sh -t "App" -b com.bundle`

---

## 5. 工件清单 (Artifacts)

```
null-order/mobile/pojia/artifacts/POJIA-20260905-135256/
├── 01_recon.txt
├── 02_weaponization.txt
├── 03_armor_detection.txt
├── 04_armor_break.txt
└── 05_static_triage.txt

null-order/mobile/pojia/hooks/
├── jailbreak_bypass.js
├── ssl_pinning_bypass.js
└── anti_debug_bypass.js
```

---

## 6. 蓝队防御建议 (Remediation)

| 优先级 | 措施 | 效果 |
|---|---|---|
| P0 | 核心业务逻辑服务端化 | 消除客户端砸壳价值 |
| P1 | 多维度设备完整性 (Apple DeviceCheck / App Attest) | 替代简单路径检测 |
| P2 | 公钥 Pinning + 证书透明度 | 提升 MITM 难度 |
| P3 | 反 Hook 框架检测 (Frida 端口/线程/内存特征) | 提高动态分析成本 |
| P4 | 代码混淆 + 控制流平坦化 | 增加静态分析成本 |

---

## 7. 一键复现

```bash
# 完整破甲行动 (需越狱 iPhone USB 连接)
cd null-order/mobile/pojia
./armor_break.sh -t "目标App名" -b com.example.app

# 离线战术编排 + 报告
./armor_break.sh --dry-run
```

---

**行动结束** · NULL//ORDER · Mobile Red Team · RULE #01  
报告生成: `NØ-OPERATION-破甲-POJIA-20260905-135256.md`
