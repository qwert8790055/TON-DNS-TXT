# NULL//ORDER — Community Architecture

> Security Research Community · Authorized Red Team Lab

## Positioning

NULL//ORDER is **not** a penetration chat group. It is:

- A **security research community** for methodology, analysis, and engineering
- An **authorized red team lab** for CTF,靶场, and controlled testing
- A **publication channel** for CVE analysis, threat intel, and original research

Long-term stability comes from research output and skill-based membership — not exploit bragging.

---

## ① NØ//CORE — Main Group

**定位**: 核心技术社区

| Activity | Description |
|---|---|
| 安全技术交流 | Methodology, tooling, architecture |
| 漏洞分析讨论 | Root-cause analysis, not raw exploits |
| CTF / 靶场 | Practice in controlled environments |
| 红队方法论 | Authorized engagement frameworks |
| 研究成果分享 | Structured research posts |
| 行业资讯 | Curated security news |

**群简介**:

```
NULL//ORDER — CORE

Security Research · Red Team · Reverse Engineering
CTF · Threat Intelligence · Security Engineering

Authorized Research Only.
VERIFY EVERYTHING.
```

---

## ② NØ//BULLETIN — Announcement Channel

Admin-only posting. Drives brand exposure; core group drives engagement.

| Tag | Content |
|---|---|
| `[NEWS]` | 安全资讯 |
| `[CVE]` | 漏洞情报 |
| `[RESEARCH]` | 原创研究 |
| `[LAB]` | 实验室更新 |
| `[CTF]` | 赛事 / 靶场 |
| `[RECRUIT]` | 招募 |

---

## ③ Role Hierarchy

| Role | Level | Permissions |
|---|---|---|
| ARCHITECT | 100 | Full admin, config, promotions |
| MODERATOR | 90 | Community moderation, topic management |
| OPERATOR | 70 | Red team lab sessions, CTF hosting |
| RESEARCHER | 60 | Publish research, lead analysis threads |
| ENGINEER | 60 | Tooling, automation, infra |
| ANALYST | 50 | Threat intel, CVE triage |
| INITIATE | 20 | New member — probation, assigned tasks |
| GUEST | 10 | Read-only / limited participation |

**Key rule**: New members enter as **INITIATE**. No management permissions on join.

Promotion path: `INITIATE → RESEARCHER / ENGINEER / OPERATOR` after completing technical tasks.

---

## ④ Operations Rhythm

### Daily

| Time | Content |
|---|---|
| 上午 | 1× security news · 1× CVE / vuln knowledge point |
| 下午 | Technical discussion · CTF / lab challenge |
| 晚上 | Daily research summary · free discussion |

### Weekly

| Day | Series | Content |
|---|---|---|
| 周一 | **NØ//WEEKLY** | This week's research plan |
| 周三 | **NØ//LAB** | Authorized lab / CTF session |
| 周五 | **NØ//RESEARCH** | Full technical analysis post |
| 周日 | **NØ//REPORT** | Weekly summary: members, research, CVEs, CTF, next week |

---

## ⑤ Recruitment

**Do not write**: "招黑客 / 招渗透"

**Use instead**:

```
NØ//RECRUITMENT

We are looking for:

WEB SECURITY
REVERSE ENGINEERING
RED TEAM
THREAT INTELLIGENCE
SECURITY ENGINEERING

Skill > Reputation
```

Priority: demonstrated research output over reputation.

---

## ⑥ Content Standard

**Avoid**: "今天又打了一个网站" — positions community as low-tier.

**Use research structure**:

```
案例 → 原理 → 风险 → 复现环境 → 修复 → 防御
```

**Example**:

```
NØ//RESEARCH-026

API Authorization Boundary Analysis

Target: Controlled Lab
Category: Access Control
Severity: High

分析权限边界为什么失效，以及如何通过服务端授权模型修复。
```

---

## ⑦ RULE #01 (Pinned)

```
NULL//ORDER RULE #01

所有攻击性测试必须拥有明确授权。

禁止在真实目标上进行未经授权的入侵、盗取数据、持久化控制或破坏性操作。

本社区以安全研究、CTF、靶场和授权测试为主要活动。
```

This rule strengthens the brand as a legitimate security team.

---

## Sub-Topics (NØ//CORE internal)

Optional Telegram topics or tags for segmentation:

| Topic | Focus |
|---|---|
| REDTEAM / VANGUARD | Red team methodology, authorized ops |
| RESEARCH / PHANTOM | Vulnerability analysis, original research |
| LAB / DEEP CORE | CTF,靶场, lab environments |
