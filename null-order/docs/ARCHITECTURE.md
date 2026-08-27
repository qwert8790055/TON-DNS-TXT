# NULL//ORDER — Community Architecture

> TON Ecosystem · Security Research · Authorized Testnet Lab

See also: [TON_ECOSYSTEM.md](./TON_ECOSYSTEM.md)

## Positioning

NULL//ORDER is a **TON-native** authorized security research community:

- **TON security research** — TVM, FunC/Tact contracts, Jetton, DNS
- **On-chain identity** — `.ton` + `dns_text` community profiles
- **Testnet lab & CTF** — controlled environments only
- **Builder ecosystem** — Mini Apps, TON Connect, open tooling

Not a generic pentest group. Not an attack org.

---

## ① NØ//CORE — Main Group

| Activity | TON Focus |
|---|---|
| 生态资讯 | TEPs, upgrades, launches |
| 合约 / TVM | FunC, Tact, opcode analysis |
| dns_text | On-chain profiles, DNS auth |
| Mini Apps | TON Connect, Telegram integration |
| Testnet Lab | Authorized contract labs |
| 研究发布 | NØ//RESEARCH series |

**群简介**:

```
NULL//ORDER — CORE · TON Ecosystem

TON Security Research · TVM · Smart Contracts
dns_text · Mini Apps · Jetton · Authorized Testnet Lab

Bind identity: .ton domain + dns_text
Authorized Research Only. VERIFY ON-CHAIN.
```

---

## ② NØ//BULLETIN — Announcement Channel

| Tag | Content |
|---|---|
| `[TON]` | TON 生态资讯 |
| `[CVE]` | 合约 / 基础设施漏洞 |
| `[RESEARCH]` | 原创 TON 安全研究 |
| `[LAB]` | Testnet 实验室 |
| `[CTF]` | TON 靶场 |
| `[BUILD]` | 工具 / Mini App |
| `[RECRUIT]` | 招募 |

---

## ③ Role Hierarchy

| Role | TON Focus |
|---|---|
| ARCHITECT | Core admin, lab scope |
| MODERATOR | Moderation, dns_text verification |
| OPERATOR | Testnet lab, TON CTF |
| RESEARCHER | TVM / contract analysis |
| ENGINEER | Bots, infra, tooling |
| BUILDER | Mini Apps, TON Connect dApps |
| ANALYST | TEP / ecosystem intel |
| INITIATE | Probation + TON tasks |
| GUEST | Read-only |

Promotion: `INITIATE → RESEARCHER / ENGINEER / BUILDER / OPERATOR / ANALYST` after TON tasks + optional dns_text verification.

---

## ④ Operations Rhythm

### Daily
- 上午: TON 资讯 + 合约/CVE 知识点
- 下午: TON 技术讨论 + testnet CTF
- 晚上: 研究总结 + 自由讨论

### Weekly
- 周一 **NØ//WEEKLY** — TON 研究计划
- 周三 **NØ//LAB** — testnet 靶场
- 周五 **NØ//RESEARCH** — 完整 TON 分析
- 周日 **NØ//REPORT** — 生态周报

---

## ⑤ Recruitment

```
NØ//RECRUITMENT · TON Ecosystem

TON SMART CONTRACTS · TVM RE · MINI APPS
dns_text · TON DNS · THREAT INTEL

Skill > Reputation
```

---

## ⑥ Content Standard

Research structure (TON):

```
案例 → TVM/合约原理 → 风险 → testnet 复现 → 修复 → 防御
```

Example:

```
NØ//RESEARCH-001

TON DNS Authorization Boundary Analysis

Target: Controlled Lab · testnet
Category: Access Control
Severity: High
```

---

## ⑦ RULE #01

```
所有攻击性测试必须拥有明确授权。
禁止对主网合约、用户钱包、生产基础设施进行未经授权的测试。
Testnet & authorized scope only.
```

---

## Topics (NØ//CORE)

| Topic | Focus |
|---|---|
| TON / NEWS | Ecosystem updates |
| CONTRACTS / TVM | Smart contracts |
| DNS / IDENTITY | dns_text, .ton profiles |
| BUILD / MINI APPS | TON Connect apps |
| RESEARCH / PHANTOM | Security analysis |
| LAB / DEEP CORE | Testnet CTF |

---

## Architecture Diagram

```
                 NØ
            NULL//ORDER
             (TON Native)
                  │
        ┌─────────┴─────────┐
        │                   │
 NØ//BULLETIN          NØ//CORE
   公告频道              核心群
        │                   │
        │            ┌──────┼──────┬──────┐
        │            │      │      │      │
      [TON]      CONTRACT DNS   BUILD  LAB
      [CVE]        /TVM  /ID   /APP  /CTF
```
