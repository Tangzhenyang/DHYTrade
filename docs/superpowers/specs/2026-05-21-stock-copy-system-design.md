# 股票跟仓系统 — 设计文档

**日期:** 2026-05-21  
**状态:** Draft

---

## 1. 概述

一个供小团队使用的股票跟仓管理系统。管理员/操作员记录每日买卖操作，系统实时展示各股票仓位占比。普通用户输入自有资金，系统自动计算每只股票需购买的数量以匹配当前仓位比例。

### 核心功能
1. 仓位管理：操作员录入买卖记录，系统实时计算持仓占比
2. 跟仓计算：普通用户输入资金基准，按占比自动算出建议买入
3. 实时行情：接入免费API获取股价，计算实时市值和浮动盈亏
4. 公告栏：管理员发布每日操作公告
5. 用户权限：三角色 + 邀请注册

---

## 2. 技术选型

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | React 18 + Vite + Ant Design 5 + Zustand | 组件丰富，状态管理轻量 |
| 后端 | .NET Core 10 + ASP.NET Core Web API | RESTful API |
| 认证 | JWT（Access Token + Refresh Token） | Access Token 短期，Refresh Token 长期 |
| 数据库 | SQLite + EF Core | 完整迁移设计，未来可切 PostgreSQL/SQL Server |
| 行情 | 新浪/东方财富 API + Yahoo Finance 备用 | 后端抽象接口，A股优先国内源 |

---

## 3. 数据库设计

### 3.1 Users

| 列 | 类型 | 说明 |
|---|---|---|
| Id | GUID | PK |
| Username | string(50) | 唯一 |
| Email | string(100) | 唯一 |
| PasswordHash | string(256) | SHA256 + Salt |
| Role | enum | SuperAdmin / Operator / User |
| IsActive | bool | |
| InviteCode | string(20) | 注册时使用的邀请码 |
| CreatedAt | datetime | |

### 3.2 InviteCodes

| 列 | 类型 | 说明 |
|---|---|---|
| Id | GUID | PK |
| Code | string(20) | 唯一邀请码 |
| CreatedBy | GUID | FK → Users |
| IsUsed | bool | |
| UsedBy | GUID? | FK → Users |
| ExpiresAt | datetime | 可设置有效期 |
| CreatedAt | datetime | |

### 3.3 TradeRecords

| 列 | 类型 | 说明 |
|---|---|---|
| Id | GUID | PK |
| StockCode | string(20) | 如 sh600519 / sz300750 |
| StockName | string(50) | 如 贵州茅台 |
| Type | enum | Buy / Sell |
| Lots | int | 手数 |
| Shares | int | 股数 = Lots × 100 |
| Price | decimal(18,4) | 成交价（API获取） |
| Amount | decimal(18,2) | 成交金额 = Shares × Price |
| Commission | decimal(18,2) | 手续费 = MAX(Amount × 0.0001, 5.00) |
| TotalCost | decimal(18,2) | 买入 = Amount + Commission；卖出 = Amount - Commission |
| OperatorId | GUID | FK → Users |
| Note | string(500) | |
| TradedAt | datetime | 实际交易时间 |
| CreatedAt | datetime | 记录创建时间 |

### 3.4 Positions

| 列 | 类型 | 说明 |
|---|---|---|
| Id | GUID | PK |
| StockCode | string(20) | 唯一（每股票一条） |
| StockName | string(50) | |
| Shares | int | 当前持股数 |
| TotalCost | decimal(18,2) | 当前持仓总成本（含手续费） |
| AvgCost | decimal(18,4) | 持仓均价 = TotalCost / Shares |
| CurrentPrice | decimal(18,4) | API缓存的最新价 |
| MarketValue | decimal(18,2) | 市值 = Shares × CurrentPrice |
| UnrealizedPnl | decimal(18,2) | 浮动盈亏 = MarketValue - TotalCost |
| UnrealizedPnlPct | decimal(18,4) | 浮动盈亏百分比 |
| FirstBoughtAt | datetime | 首次建仓时间 |
| LastTradedAt | datetime | 最近交易时间 |
| HoldDays | int | 持仓天数 |
| IsActive | bool | 是否仍持仓 |
| CreatedAt | datetime | |
| UpdatedAt | datetime | |

### 3.5 Bulletins

| 列 | 类型 | 说明 |
|---|---|---|
| Id | GUID | PK |
| Title | string(200) | |
| Content | string(4000) | |
| AuthorId | GUID | FK → Users |
| IsPinned | bool | 是否置顶 |
| CreatedAt | datetime | |
| UpdatedAt | datetime | |

---

## 4. API 设计

### 4.1 认证

```
POST /api/auth/login       { username, password } → { accessToken, refreshToken, user }
POST /api/auth/register    { username, email, password, inviteCode } → { user }
POST /api/auth/refresh     { refreshToken } → { accessToken, refreshToken }
```

### 4.2 持仓

```
GET  /api/positions              → [{ 当前持仓列表（含占比、浮动盈亏） }]
GET  /api/positions/closed       → [{ 已清仓归档列表 }]
```

### 4.3 交易记录

```
GET  /api/trades?stockCode=&from=&to=&page=   → [{ 分页操作记录 }]
POST /api/trades                                → 新增买卖记录，自动更新Position
    { stockCode, type, lots, note?, tradedAt? }
DELETE /api/trades/{id}                         → [Operator+] 删除，回滚Position
```

### 4.4 跟仓计算

```
POST /api/copy/calculate
    { ownCapital: 500000 }     → [{ stockCode, stockName, targetRatio, targetAmount, price, suggestLots }]
```

计算逻辑：
- 目标金额 = 用户资金 × 该股占比
- 建议手数 = FLOOR(目标金额 / 股价 / 100)
- 实际金额 = 建议手数 × 100 × 股价

### 4.5 行情

```
GET  /api/quotes/{stockCode}         → { price, change, changePct, time }
POST /api/quotes/batch               → [{ stockCode, price, ... }]
    { stockCodes: ["sh600519", "sz300750"] }
```

### 4.6 公告

```
GET    /api/bulletins          → [{ 公告列表 }]
POST   /api/bulletins          → [Operator+] 发布
PUT    /api/bulletins/{id}     → [Operator+] 编辑
DELETE /api/bulletins/{id}     → [Operator+] 删除
```

### 4.7 用户管理

```
GET    /api/users              → [SuperAdmin] 用户列表
PUT    /api/users/{id}/role    → [SuperAdmin] 更新角色
PUT    /api/users/{id}/active  → [SuperAdmin] 启用/禁用

POST   /api/invites            → [SuperAdmin] 生成邀请码
GET    /api/invites            → [SuperAdmin] 邀请码列表
```

---

## 5. 业务逻辑

### 5.1 持仓计算（每次 TradeRecords 变更时）

**买入：**
- Shares += 买入股数
- TotalCost += 买入 TotalCost（含手续费）
- AvgCost = TotalCost / Shares

**卖出：**
- Shares -= 卖出股数
- TotalCost -= 卖出股数 × AvgCost
- 如果 Shares = 0：IsActive = false

**占比：**
- 基准仓位 = 所有活跃持仓 TotalCost 之和
- 个股占比 = 该股 TotalCost / 基准仓位 × 100%

### 5.2 历史盈亏查询

从 TradeRecords 按股票分组，用 FIFO 算法匹配每笔卖出对应的买入成本，计算每笔卖出的实现盈亏。前端展示汇总。

### 5.3 行情刷新

- 定时后台任务（如每 30 秒）批量刷新所有活跃持仓股票的行情
- 行情接口抽象为 `IQuoteProvider`，可切换数据源
- 主要数据源：新浪财经 HTTP API（免费、实时、覆盖沪深A股）

---

## 6. 前端结构

### 6.1 路由

```
/login              — 登录
/register           — 注册（需邀请码）

/dashboard          — 主面板：仓位占比饼图/柱状图 + 各股票浮动盈亏卡片
/trades             — 操作记录列表，Operator+ 可点击添加
/calculator         — 跟仓计算器
/bulletins          — 公告栏

/history            — 历史盈亏查询入口
/history/:stockCode — 单个股票历史交易明细 + 盈亏汇总

/admin/users        — [SuperAdmin] 用户管理
/admin/invites      — [SuperAdmin] 邀请码管理
```

### 6.2 组件树（关键）

```
App
├── Layout (Header + Sider + Content)
│   ├── DashboardPage
│   │   ├── PositionSummaryCards
│   │   ├── PositionPieChart (echarts)
│   │   └── PositionTable
│   ├── TradesPage
│   │   ├── TradeList
│   │   └── AddTradeModal (选择股票、手数、买卖方向)
│   ├── CalculatorPage
│   │   ├── CapitalInput
│   │   └── CopyResultTable
│   ├── HistoryPage
│   │   └── StockPnlTable
│   ├── StockHistoryPage
│   │   ├── TradeRecordList
│   │   └── PnlSummary
│   └── BulletinsPage
│       ├── BulletinList
│       └── BulletinForm (Operator+)
```

### 6.3 状态管理（Zustand）

```
authStore       — user, tokens, login/logout
positionStore   — positions, loading, refreshPositions
tradeStore      — tradeRecords, addTrade, deleteTrade
quoteStore      — currentPrices, lastUpdated
bulletinStore   — bulletins, addBulletin
```

---

## 7. 权限矩阵

| 功能 | SuperAdmin | Operator | User |
|---|---|---|---|
| 查看持仓/占比 | ✅ | ✅ | ✅ |
| 跟仓计算器 | ✅ | ✅ | ✅ |
| 查看公告 | ✅ | ✅ | ✅ |
| 查看历史盈亏 | ✅ | ✅ | ✅ |
| 添加/删除交易 | ❌ | ✅ | ❌ |
| 发布/管理公告 | ❌ | ✅ | ❌ |
| 用户管理 | ✅ | ❌ | ❌ |
| 邀请码管理 | ✅ | ❌ | ❌ |

---

## 8. 行情API适配层

```csharp
public interface IQuoteProvider
{
    Task<QuoteResult> GetQuoteAsync(string stockCode);
    Task<List<QuoteResult>> GetQuotesAsync(List<string> stockCodes);
}

// 实现：SinaQuoteProvider（新浪财经）
// 备用：EastMoneyQuoteProvider（东方财富）
// 扩展：YahooFinanceQuoteProvider（美股）
```

通过 DI 注入，配置文件切换。默认使用新浪财经。

---

## 9. 项目结构

```
DHYTrade/
├── DHYTrade.sln
├── backend/
│   └── DHYTrade.Api/
│       ├── Controllers/
│       ├── Models/（Entities, DTOs, Requests）
│       ├── Services/
│       ├── Data/（DbContext, Migrations）
│       ├── Middleware/
│       └── Program.cs
├── frontend/
│   └── dhy-trade-web/
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── stores/
│       │   ├── api/
│       │   ├── hooks/
│       │   └── App.tsx
│       └── vite.config.ts
└── docs/
```

---

## 10. 后续扩展预留

- 数据层使用 EF Core，切换数据库只需修改连接字符串和 Provider（PostgreSQL/SQL Server）
- 行情接口通过 `IQuoteProvider` 抽象，新增数据源只需新增实现类
- 前端 API 层集中在 `api/` 目录，切换后端地址只需修改 base URL
