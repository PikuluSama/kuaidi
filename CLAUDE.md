# CLAUDE.md

快递物流查询微信小程序的技术约定。每次会话必读。

> **文档分层**：CLAUDE.md = 怎么写代码（技术约定）| spec.md = 做什么功能（产品规格）| CHANGELOG.md = 什么改了（变更记录）

---

## 项目概述

快递查询微信小程序。用户输入快递单号 → 自动识别快递公司 → 查看物流轨迹。无需注册，无需选公司。

- 首页（`pages/index`）：查询单号 + 剪贴板检测 + 历史记录
- 结果页（`pages/result`）：物流时间轴 + Canvas 分享卡 + 复制单号
- 8 个公司专题页（`pages/company/{name}`）：SEO 落地页
- 后端全走云函数（`cloudfunctions/query`, `cloudfunctions/reward`），数据源快递100

---

## 技术约束

这些是不可变的架构决策，不要尝试更改：

- **Skyline 渲染器 + glass-easel** 组件框架（`app.json` 中配置）
- **客户端无 npm**，纯 JS，不引入第三方包（`lodash`、`dayjs` 等）
- **状态管理**：`Page({ data })` + `this.setData()`，不引入 store 库
- **所有后端逻辑走云函数**，客户端不直接调外部 API
- **云数据库权限**：仅管理员读写（`rate_limit`, `query_cache`, `reward_nonces`）
- **快递100 凭证仅存于云函数**，不暴露给客户端
- **CommonJS 模块**：`require()` / `module.exports`，不用 ES module

---

## 文件结构与模块职责

```
kuaidi/
├── app.js / app.json / app.wxss    — 入口 + 全局样式 token + Skyline 配置
├── pages/
│   ├── index/          — 查询首页（输入 + 历史记录 + 剪贴板检测）
│   ├── result/         — 物流结果（时间轴 + 分享 + Canvas 生成分享图）
│   └── company/{name}/ — 8 个 SEO 专题页（模板复制，仅 data 不同）
├── components/
│   └── navigation-bar/ — 自定义导航栏（每页 JSON 中注册）
├── utils/
│   ├── api.js          — 云函数封装（queryExpress, claimReward, generateNonce）
│   ├── storage.js      — 查询历史 CRUD（getHistory, addHistory, removeHistory, clearHistory）
│   └── constants.js    — COMPANIES 映射, getCompanyName, getStateInfo, detectCompany
├── cloudfunctions/
│   ├── query/          — 快递100代理 + 频率限制 + 30分钟缓存
│   └── reward/         — 广告奖励（nonce 防重放）
├── spec.md             — 产品规格（数据模型、接口、页面结构）
└── CHANGELOG.md        — 变更记录
```

### 模块重用规则

必须通过以下模块间接调用，不要绕过它们直接使用底层 API：

| 需求 | 使用模块 | 不要直接用 |
|---|---|---|
| 调云函数 | `require('../../utils/api.js')` | `wx.cloud.callFunction` |
| 读写查询历史 | `require('../../utils/storage.js')` | `wx.getStorageSync('query_history')` |
| 公司名/状态/检测 | `require('../../utils/constants.js')` | 硬编码公司名称或状态映射 |
| 导航栏 | `"navigation-bar": "/components/navigation-bar/navigation-bar"` | 原生导航栏 |

---

## 编码约定

### 页面结构

每个页面是 4 文件元组：`pagename.js` / `.json` / `.wxml` / `.wxss`

公司页面在子目录中：`pages/company/shunfeng/shunfeng.js`（`app.json` 路径 `pages/company/shunfeng`）

每页 JSON 注册导航栏：
```json
{ "usingComponents": { "navigation-bar": "/components/navigation-bar/navigation-bar" } }
```

### 命名

- JS 方法：`onQuery`, `onNumInput`, `onHistoryTap`（事件处理），`_doQuery`, `_loadHistory`（内部方法，`_` 前缀）
- CSS 类名：`history-item`, `timeline-dot`, `clipboard-tip`（hyphen-separated，不用 BEM `__`）
- 文件名：kebab-case 组件（`navigation-bar`），页面与目录同名

### 样式（WXSS）

- **全部用 `rpx` 单位**（不用 `px`，除非平台要求如胶囊按钮对齐）
- **颜色/间距通过 CSS custom properties**（定义在 `app.wxss` 的 `page` 选择器），不硬编码色值：
  - `--color-brand: #1F6B45`（绿色品牌，**不是** spec.md 中的红色）
  - `--color-primary: #111815`（文字）, `--color-card: #FFFFFF`（卡片）
  - `--radius-sm: 12rpx`, `--radius-md: 20rpx`, `--radius-lg: 28rpx`
  - `--space-1` 到 `--space-6`（8-48rpx）
- **优先复用全局工具类**：`.card`, `.btn-primary`, `.btn-secondary`, `.input`, `.tag`, `.tag-signed`, `.tag-transit`, `.tag-error`, `.divider`, `.text-secondary`
- 字体阶梯：22rpx（标签）, 24rpx（辅助）, 26rpx（正文）, 28rpx（标准）, 30rpx（副标题）, 34-38rpx（标题）

### JS 模式

- 输入验证正则（前后端一致）：单号 `/^[A-Za-z0-9\-]{6,30}$/`，手机后4位 `/^\d{4}$/`
- 错误码分支处理，不按文案匹配：
  - `OK`, `LIMIT_EXCEEDED`, `INVALID_PARAM`, `PHONE_REQUIRED`, `QUERY_ERROR`, `NETWORK_ERROR`, `REWARD_LIMIT`, `DUPLICATE_NONCE`
- 异步用 `async/await` 配合云函数 Promise

### WXML 模式

- `scroll-view` + `scroll-y` 作为页面内容根容器
- 条件渲染用 `wx:if` / `wx:elif` / `wx:else`
- 列表渲染用 `wx:for` + `wx:key`
- 事件传参用 `data-*` 属性 + `e.currentTarget.dataset`
- 固定元素用 `root-portal` 脱离 scroll-view

### 云函数模式

- 初始化：`cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })`
- 用户身份：`const { OPENID } = cloud.getWXContext()`
- 并行查询：`Promise.all` 做独立 DB 读取（参考 `query/index.js`）
- 返回格式统一：`{ code: string, message?: string, ...data }`
- 缓存：30 分钟 TTL，单号大写作为文档 ID

---

## 公司专题页模板

8 个页面共享相同的 WXML 模板和 WXSS，仅 `data` 字段不同（`companyCode`, `companyName`, `companyIntro`, `numFormat`, `phone`）。

新增公司页面 checklist：
1. 创建 `pages/company/{name}/{name}.*` 四文件元组，从现有公司页复制
2. 更新 `data` 字段（公司名、代码、简介、格式说明、客服电话）
3. 其他 8 个公司页的链接网格中加入新入口
4. `app.json` 的 `pages` 数组注册路径
5. `utils/constants.js` 的 `COMPANIES` 中加条目
6. 确保所有公司页的 WXSS 保持一致

---

## 反模式（不要做）

- 不要直接调 `wx.cloud.callFunction` — 用 `api.js`
- 不要直接调 `wx.setStorageSync('query_history')` — 用 `storage.js`
- 不要硬编码公司名称 — 用 `constants.js` 的 `getCompanyName()`
- 不要在客户端装 npm 包
- 不要引入状态管理库
- 不要在 UI 中暴露内部错误码（如 `QUERY_ERROR`），转为用户友好的提示
- 不要用 `px` 做尺寸单位 — 用 `rpx`
- 不要硬编码颜色值 — 用 CSS custom properties

---

## 工作流

### 判断复杂度

- **简单**（改文案/颜色/小修复/加字段）→ 直接编码
- **复杂**（新页面/新云函数/架构改动/跨多文件）→ 先简述方案，确认后再编码

### 做功能时

1. 先读 `spec.md` 对应章节，了解数据模型和接口定义
2. 找最接近的现有页面/函数作为参考，复用模式
3. 确认要用哪些 `utils/` 模块，而不是写新函数

### 完成后

- 涉及产品逻辑变更 → 同步更新 `spec.md`
- 每次功能迭代 → 追加 `CHANGELOG.md`
- 只改自己改动的部分，不顺便"优化"周边代码

### 编码原则

- 不确定就问，不假设
- 最少代码解决问题，不加未请求的功能
- 只改必须改的，匹配现有风格
- 改动产生的孤儿代码（不再使用的 import/变量）要清理

---

## 关键参考文件

| 场景 | 参考文件 |
|---|---|
| 产品需求、数据模型、接口定义 | `spec.md` |
| CSS 设计 token、全局工具类 | `app.wxss` |
| 云函数 API 接口 | `utils/api.js` |
| 公司映射、状态映射、公司检测 | `utils/constants.js` |
| 查询历史存储 | `utils/storage.js` |
| 页面事件处理、数据流参考 | `pages/index/index.js` |
| 异步查询、错误分支、分享、Canvas | `pages/result/result.js` |
| 公司页模板参考 | `pages/company/shunfeng/` |
| 云函数参考（限流、缓存、API 代理） | `cloudfunctions/query/index.js` |
| Nonce 防重放模式 | `cloudfunctions/reward/index.js` |
