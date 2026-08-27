# BC 杀猪盘 · 威胁情报与关键词库

> NULL//ORDER · Threat Intel · 防御 / 举报 / 溯源 · **非攻击性**

See also: [PENTEST_SKILLS.md](./PENTEST_SKILLS.md) · RULE #01 — 未授权不对第三方基础设施做攻击性测试

---

## ① 模式代号（搜索 / 归类用）

| 代号 | 含义 |
|---|---|
| **Pig Butchering / 杀猪盘** | 养熟后再收割 |
| **BC Scam / 假博彩** | 无牌照或套壳博彩，核心是不出款 |
| **Withdrawal Block / 卡款** | 提现被拒或无限审核 |
| **Double Dip / 二次收割** | 以保证金、税费、流水为由再骗充 |
| **Trust Deposit / 信任充值** | 前期小额度顺利提现建立信任 |
| **Runner / 跑分** | 个人银行卡/USDT 代收代付 |
| **Agent Tree / 代理树** | 多级代理拉人头 |

---

## ② 卡款话术关键词（客服 / 群聊 OCR 匹配）

### 2.1 流水与投注

```
流水不足
流水未达标
有效投注
打满流水
倍流水
洗码
码量
未完成打码
投注量不够
需继续下注
解除限制请先游戏
```

### 2.2 审核与风控

```
风控审核
系统审核
人工审核中
账户异常
风险账户
异常登录
安全验证
身份核验
银行卡验证
USDT地址验证
IP异常
多设备登录
```

### 2.3 二次收费（高危）

```
保证金
押金
解冻金
验证金
手续费
提现手续费
通道费
VIP通道
专属通道
加急到账
大额提现
税费
个人所得税
代扣税
认证费
会员升级
```

### 2.4 拖延与恐吓

```
24小时内到账
48小时处理
排队中
银行维护
通道维护
节假日延迟
再充值一笔
邀请好友解锁
拉新激活
涉赌违法
报警也没用
冻结账户
永久封禁
```

### 2.5 英文变种（跨境站）

```
 wagering requirement
 rollover
 KYC pending
 security deposit
 verification fee
 withdrawal processing
 account flagged
 risk review
 unlock balance
 tax withholding
 VIP withdrawal lane
 manual review
```

---

## ③ 引流与话术关键词（社交 / 广告）

### 3.1 渠道

```
Telegram
TG群
WhatsApp
Line
陌陌
探探
Soul
婚恋
交友
兼职
刷单
日赚
稳赚
带单
计划员
导师
老师
工作室
```

### 3.2 诱导充值

```
内幕消息
必赢策略
稳赢计划
回血
翻本
包赢
跟单
倍投
马丁
漏洞盘
放水
官方合作
内部渠道
```

### 3.3 信任建立

```
先提试试
小额秒到
今天已提现
晒单
盈利截图
带新人福利
首充送
彩金
返水
```

---

## ④ 平台伪装关键词（假正规）

```
国际牌照
PAGCOR
马耳他
Curacao
库拉索
官方直营
十年品牌
上市公司
体育电竞
真人视讯
棋牌
电子游艺
哈希
区块链公平
Provably Fair
```

> **IOC 提示**：真牌照可官网核验；假站常盗图、假证书 PDF、无法验证 licensee ID。

---

## ⑤ 技术面 IOC 关键词（被动收集）

### 5.1 域名 / URL 特征

```
bc
bet
casino
game
slot
vip
888
365
win
play
hash
crypto
usdt
app下载
mobile
h5
api.
admin.
agent.
pay.
cashier.
```

### 5.2 页面 / JS 特征

```
客服链接
在线客服
LiveChat
美洽
智齿
Crisp
Intercom
第三方客服
websocket
轮询充值
TRC20
ERC20
Omni
钱包地址复制
```

### 5.3 APP 特征

```
企业签名
超级签名
TF TestFlight
MDM
重签名
包名随机
com.xxx.random
 gambling
 赌博
 棋牌
```

### 5.4 基础设施（举报 abuse 用）

```
 Cloudflare
 AWS
 Aliyun
 Tencent Cloud
 DigitalOcean
 Namecheap
 GoDaddy
 CDN
 未备案
 跳转链
 炮灰域名
```

---

## ⑥ 支付链 IOC 关键词

### 6.1 法币

```
个人银行卡
对私转账
分批小额
非商户名
跑分
四方支付
代付
```

### 6.2 加密货币

```
USDT
TRC20
ERC20
交易所提币
火币
欧易
币安
混币
换链
```

**记录字段**：`tx hash` · `from/to address` · `amount` · `timestamp` · `exchange tag`

---

## ⑦ OSINT 深挖检索式（合法被动）

> 仅用于威胁情报归档、受害者协助、举报材料，**非未授权扫描**。

### 7.1 搜索引擎

```
"域名" + 不出款
"域名" + 提现
"域名" + 诈骗
"平台名" + 杀猪盘
"USDT地址" + scam
"银行卡号" + 博彩
site:telegram.me "平台名"
site:t.me "导师" OR "带单"
```

### 7.2 社媒 / 投诉平台

```
黑猫投诉
聚投诉
知乎 "XXX 不出款"
贴吧 "XXX 提现"
Twitter "XXX scam"
Reddit "XXX withdrawal"
```

### 7.3 链上（公开数据）

```
区块链浏览器 + 地址
同一收款地址 + 多受害人
热钱包归集模式
```

### 7.4 域名情报

```
WHOIS 历史
DNS 记录变更
证书透明度 crt.sh
同一 IP 多域名
同一 analytics ID
```

---

## ⑧ 举报关键词（表单 / 报案描述）

复制到反诈中心、12321、银行、Cloudflare Abuse：

```
网络诈骗
虚假网络博彩平台
杀猪盘
诱导充值
拒绝提现
二次诈骗
保证金诈骗
涉诈收款账户
USDT 涉诈地址
Telegram 引流
```

**英文 abuse 模板关键词**：

```
phishing
fraudulent gambling
investment scam
pig butchering
payment fraud
malicious site
```

---

## ⑨ 高危信号评分（快速判站）

| 信号 | 分 |
|---|---|
| 充值走个人银行卡/USDT 私人地址 | +3 |
| 小赢可提、大额永审 | +3 |
| 要求再充/保证金才提现 | +5 |
| 仅 TG/WhatsApp 客服 | +2 |
| 域名 30 天内注册 | +2 |
| 无 verifiable 牌照 | +2 |
| 下载企业签/不明 APK | +3 |
| 「导师带单」引流 | +3 |

**≥8 分**：按杀猪盘处理，止损 + 报案，不追加充值。

---

## ⑩ 关联威胁类型（扩展关键词）

```
 romance scam          婚恋引流
 job scam              兼职刷单转入 BC
 crypto investment     假投资转博彩
 clone site            套壳知名站 UI
 mirror domain         主域被封换 mirror
 agent commission      代理分润拉人头
```

---

## ⑪ NULL//ORDER 公告标签建议

```
[THREAT] BC Withdrawal Scam · 卡款话术更新
[THREAT] IOC Drop · USDT / 域名 / APK
[THREAT] Double Dip Pattern · 保证金类二次收割
```

**IOC 块格式**：

```yaml
campaign: BC-PIG-2025-XXX
domains: []
urls: []
apk_hashes: []
usdt_addresses: []
bank_accounts: []
telegram: []
keywords_matched: []
first_seen:
last_seen:
```

---

## ⑫ 合规边界

| 允许 | 禁止 |
|---|---|
| 被动 OSINT、公开链上查询 | 未授权渗透、DDoS、删库 |
| 汇总 IOC、写举报信 | 攻击支付/服务器「逼退网」 |
| 协助受害者固定证据 | 冒充执法或平台客服 |

---

**Skill > Reputation · 打诈靠情报与举报链，不靠未授权攻击。**

— NULL//ORDER · NØ//CORE
