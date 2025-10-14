# Board Hill 🎲

多人在线桌游平台 - 基于 WebSocket 的实时游戏体验

## 📁 项目结构

```
board-hill/
├── hill/
│   ├── game-master/     # 后端服务 (Node.js + Express + Socket.io + Prisma)
│   ├── game-player/     # 前端应用 (Next.js 14 + React + Socket.io Client)
│   └── types/           # 共享类型定义 (TypeScript)
└── README.md
```

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- PostgreSQL（本地或 Cloud SQL）
- npm 或 yarn

### 完整启动流程

#### 1. 启动数据库连接（Cloud SQL）

**终端 1:**
```bash
# 在项目根目录
./cloud-sql-proxy YOUR_PROJECT:YOUR_REGION:YOUR_INSTANCE --port 5432
```

> 💡 如使用本地 PostgreSQL，跳过此步骤

#### 2. 启动后端服务

**终端 2:**
```bash
cd hill/game-master
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

后端将在 `http://localhost:3001` 启动

#### 3. 启动前端应用

**终端 3:**
```bash
cd hill/game-player
npm install
npm run dev
```

前端将在 `http://localhost:3000` 启动

#### 4. 开始游戏

1. 打开浏览器访问 `http://localhost:3000`
2. 点击"创建游戏"开始
3. 在新标签页中"加入房间"测试多人功能

## 🛑 关闭所有服务

```bash
# 关闭后端
pkill -f "node server.js"

# 关闭 Cloud SQL Proxy（重要！）
pkill -f "cloud-sql-proxy"

# 关闭前端
pkill -f "next dev"
```

验证关闭：
```bash
ps aux | grep -E "(node server.js|cloud-sql-proxy|next dev)" | grep -v grep
# 应该没有输出
```

## 🎮 功能特性

### ✅ 已实现

- **多人实时游戏**
  - WebSocket 实时通信
  - 玩家列表自动更新（无需轮询）
  - 实时聊天功能

- **房间管理**
  - 6 位房间码分享
  - 房主权限控制
  - 自动清理机制（房主离开 = 房间关闭）

- **玩家系统**
  - 昵称 + hash 显示（如 `Alice#a1b2`）
  - 多标签页独立会话（`sessionStorage`）
  - 支持同时测试多个玩家

- **成本优化**
  - WebSocket 推送替代轮询（节省 99% SQL 查询）
  - 房主离开自动删除房间和数据
  - Cloud Run 自动扩缩容

### 🚧 待开发

详见 `todo/list.md`

## 📚 文档

- [game-master README](hill/game-master/README.md) - 后端 API 文档
- [game-player README](hill/game-player/README.md) - 前端使用说明
- [类型定义](hill/types/index.ts) - 共享类型

## 🏗️ 技术栈

### 后端 (game-master)
- Node.js + Express
- Socket.io（WebSocket）
- Prisma ORM
- PostgreSQL

### 前端 (game-player)
- Next.js 14 (App Router)
- React 18 + TypeScript
- Socket.io Client

### 部署
- Cloud Run（后端）
- Firebase Hosting（前端）
- Cloud SQL（数据库）

## 💰 成本优化

1. **开发完成后务必关闭服务**
   ```bash
   pkill -f "cloud-sql-proxy"  # 最重要！
   pkill -f "node server.js"
   pkill -f "next dev"
   ```

2. **实时更新使用 WebSocket 推送**
   - ❌ 不使用定时轮询
   - ✅ 事件驱动的数据同步

3. **自动清理机制**
   - 房主离开自动删除房间
   - 减少数据库存储

## 🔧 开发工具

```bash
# 查看数据库（可视化）
cd hill/game-master
npx prisma studio

# 查看迁移状态
npx prisma migrate status

# 重置数据库（开发环境）
npx prisma migrate reset
```

## ⚠️ 重要提示

### 多人测试

每个浏览器标签页都是独立的玩家会话：
- 标签页 1: 创建游戏（房主）
- 标签页 2: 加入房间（玩家 1）
- 标签页 3: 加入房间（玩家 2）

### 房主权限

- 第一个加入的玩家（seat-1）自动成为房主
- 房主关闭标签页 → 房间删除 → 所有玩家被踢出

### 数据库连接

- 使用 Cloud SQL Proxy 时，确保启动并运行
- 睡觉前务必关闭 Cloud SQL Proxy 避免费用

## 📝 License

Private - Board Hill Project

