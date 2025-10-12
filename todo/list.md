## 项目待办清单（基于 Betrayal 风格 MVP）

### 架构与部署
- [ ] 选择部署形态：Cloud Run（配置最小副本，支持 WebSocket）
- [ ] 容器化后端（Express/Socket.io 或独立实时服务），Next.js 视具体需求是否分离
- [ ] 数据库选型与连接：Cloud SQL for Postgres 或 Neon（含连接池/代理）
- [ ] 跨副本广播：Redis（MemoryStore）或 Pub/Sub（为 `socket.io` 适配）

### 实时与一致性
- [ ] 明确实时栈：WebSocket（`socket.io`/`ws`），GCP 上跑在 Cloud Run
- [ ] 设计房间广播与跨副本消息路由（Redis 适配器或 Pub/Sub）
- [ ] 幂等键与事件序号（idempotency key + sequence）避免重复与乱序
- [ ] 同房间写操作串行化，保障强一致（服务器序列化）

### 状态模型与随机性
- [ ] 采用服务器权威 + 事件溯源（event-sourcing）+ 周期性快照（snapshot）
- [ ] 服务端统一随机源：可播种 RNG，持久化 seed 以保证可重放
- [ ] 断线重连：基于最近快照 + 后续事件快速恢复

### 回合/阶段与规则引擎
- [ ] 定义有限状态机（回合/阶段/步骤），覆盖 Haunt 触发与叛徒揭示
- [ ] 明确胜负条件与异常流转（提前结束、平局等）
- [ ] 事件协议与校验：动作输入输出用 Zod/Valibot 做严格验证

### 房间与身份（无登录）
- [ ] 房间码生成与生命周期：长度、冲突率、过期策略、清理任务
- [ ] 主持人密钥（host/admin token）与房间控制（锁房/解锁/踢人/换座）
- [ ] 座位令牌（seat token）：一次性绑定标签页，可重连恢复
- [ ] 观战只读视图与权限隔离

### 数据与持久化
- [ ] ORM 与迁移：Prisma/Drizzle，定义模型与迁移流程
- [ ] 表设计：`rooms`、`seats`、`events`、`snapshots`、`assets/cards`、`scenarios`
- [ ] 索引与存储策略：事件表分区/TTL/归档，快照频率与大小控制
- [ ] 事件压缩与归档策略（冷数据迁移到廉价存储）

### 安全与治理
- [ ] 基础安全：速率限制、签名/令牌校验、CORS 白名单
- [ ] 最小化泄露：只向授权座位下发对应可见信息
- [ ] 审计日志：重要操作与房间状态变更可追踪

### 客户端体验
- [ ] 多标签页=多座位：每标签持有独立 seat token，冲突与切换规则
- [ ] 断线重连体验：重连后自动拉取快照+增量事件
- [ ] 观战模式 UI，玩家与主持人分级界面
- [ ] 资源懒加载与移动端适配（触控与小屏布局）

### 内容/剧本系统
- [ ] 将卡牌/房砖/事件/Haunt 剧本数据层抽离为 JSON/TS 模块
- [ ] 版本化与热更新能力（数据变更不必重发服务）
- [ ] 先实现 3–5 个最小剧本，验证管线与可玩性

### 测试与质量
- [ ] 规则引擎单元测试与性质测试（property-based）
- [ ] 事件回放测试：从种子与事件流还原一致结果
- [ ] 前后端 e2e（Playwright/Cypress）覆盖最小回合

### 可观测性与运维
- [ ] 结构化日志与房间级指标（事件延迟、活跃连接、重试率）
- [ ] 错误上报（Sentry）与追踪（OpenTelemetry）
- [ ] 资源与成本监控：Cloud Run 实例、数据库连接、Redis/消息量

### 快速选型确认（落地建议）
- [ ] 前端：React + Next.js（App Router），状态管理（Zustand/Redux），Zod 校验
- [ ] 实时：`socket.io`（房间/namespace + Redis 适配器）
- [ ] 后端：独立 Express/Socket.io 服务跑在 Cloud Run（Next.js 可独立部署）
- [ ] 数据：Postgres + Prisma（Data Proxy/连接池；Cloud SQL 或 Neon）
- [ ] 基建：Docker，Redis/MemoryStore 或 Pub/Sub，Sentry + OTel

> 说明：以上清单覆盖最小可行上线范围。若需要，我可以继续补充数据库字段级设计与事件协议草案，并生成最小骨架代码（前端页面 + 后端房间与 WebSocket 服务）。
