# game-master

- Role: authoritative game backend (room, state, events)
- Stack: Node.js, Express, Socket.io, Postgres (Prisma), WebSocket
- Deploy: Docker + Cloud Run (WebSocket)

## 🚀 Quick Start (本地开发)

### 1. 安装依赖

```bash
cd hill/game-master
npm install
```

### 2. 配置环境变量

复制 `.env.example` 创建 `.env` 文件：

```bash
cp env.example .env
```

编辑 `.env`，配置数据库连接：

```env
DATABASE_URL="postgresql://username:password@127.0.0.1:5432/dbname?schema=public"
PORT=3001
```

### 3. 设置数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev
```

### 4. 启动服务

#### 方式一：使用 Cloud SQL（推荐用于生产环境）

**终端 1 - 启动 Cloud SQL Proxy:**
```bash
# 在项目根目录
./cloud-sql-proxy YOUR_PROJECT:YOUR_REGION:YOUR_INSTANCE --port 5432
```

**终端 2 - 启动后端服务:**
```bash
cd hill/game-master
npm run dev
```

服务将在 `http://localhost:3001` 启动

#### 方式二：使用本地数据库

如果使用本地 PostgreSQL，直接启动后端即可：

```bash
cd hill/game-master
npm run dev
```

### 5. 验证服务

```bash
# 健康检查
curl http://localhost:3001/health

# 创建测试房间
curl -X POST http://localhost:3001/createRoom
```

## 🛑 关闭服务

**完整关闭所有服务（推荐睡觉前执行）：**

```bash
# 关闭后端服务
pkill -f "node server.js"

# 关闭 Cloud SQL Proxy（重要！避免产生费用）
pkill -f "cloud-sql-proxy"

# 如果前端也在运行
pkill -f "next dev"
```

**验证所有服务已关闭：**

```bash
# 确认 Cloud SQL Proxy 已关闭
ps aux | grep cloud-sql-proxy | grep -v grep

# 确认后端已关闭
curl http://localhost:3001/health
# 应该返回连接失败
```

## 📋 常用命令

```bash
# 查看数据库内容（可视化工具）
npx prisma studio

# 查看 Prisma 迁移状态
npx prisma migrate status

# 重置数据库（开发环境，会删除所有数据）
npx prisma migrate reset

# 查看数据库当前 schema
npx prisma db pull
```

## 📚 API 端点

### HTTP REST API

- `GET /health` - 健康检查
- `POST /createRoom` - 创建新房间，返回 `{ roomId, hostKey }`
- `POST /joinRoom` - 加入房间，需要 `{ roomId, nickname }`，返回 `{ seatToken, displayName }`
- `GET /rooms/:id` - 获取房间信息和玩家列表

### WebSocket Events

**客户端发送：**
- `room:join` - 加入房间，需要 `{ roomId, seatToken }`
- `room:message` - 发送聊天消息，需要 `{ roomId, message }`

**服务器广播：**
- `room:system` - 系统消息（玩家加入/离开）
- `room:message` - 聊天消息
- `room:players` - 玩家列表更新
- `room:closed` - 房间关闭通知

## 💾 DATABASE_URL 配置格式

### 本地开发（通过 Cloud SQL Proxy）

```env
DATABASE_URL="postgresql://username:password@127.0.0.1:5432/dbname?schema=public"
```

启动 Cloud SQL Proxy：
```bash
./cloud-sql-proxy YOUR_PROJECT:YOUR_REGION:YOUR_INSTANCE --port 5432
```

### 本地 PostgreSQL

```env
DATABASE_URL="postgresql://username:password@localhost:5432/dbname?schema=public"
```

### Cloud Run 部署

```env
DATABASE_URL="postgresql://username:password@127.0.0.1:5432/dbname?schema=public"
```

在 Cloud Run 配置中添加 Cloud SQL 连接：`YOUR_PROJECT:YOUR_REGION:YOUR_INSTANCE`

> 💡 **性能优化提示：** 对于高并发场景，建议使用连接池（PgBouncer 或 Prisma Accelerate）

## 🚢 部署到 Cloud Run

### 服务配置

**基本设置：**
- 源代码：GitHub monorepo
- 子目录：`hill/game-master`
- 构建方式：Google Cloud Buildpacks
- 容器端口：`3001`

**环境变量：**
```env
PORT=3001
DATABASE_URL=postgresql://DB_USER:DB_PASSWORD@127.0.0.1:5432/DB_NAME?schema=public
NODE_ENV=production
```

**Cloud SQL 连接：**
- 在 "Connections" 标签添加：`YOUR_PROJECT:YOUR_REGION:YOUR_INSTANCE`

**自动扩缩容：**
- 最小实例：0 或 1（推荐 0 节省成本）
- 最大实例：1-2
- 并发请求数：60-80
- 超时：300秒（支持 WebSocket 长连接）

**认证：**
- 演示环境：允许未经身份验证的调用
- 生产环境：建议启用身份验证

### 数据库迁移（Cloud Run Job）

使用 Cloud Run Job 执行数据库迁移：

**Job 配置：**
- 容器镜像：与服务相同
- 命令：`npx`
- 参数：`prisma migrate deploy`
- 环境变量：与服务相同
- Cloud SQL 连接：与服务相同

**执行迁移：**
```bash
# 每次 schema 变更后手动触发
gcloud run jobs execute migrate-job --region YOUR_REGION
```

## ⚠️ 重要提示

### 成本控制

1. **开发完成后务必关闭 Cloud SQL Proxy**
   - 避免产生不必要的数据库连接费用
   - 使用 `pkill -f "cloud-sql-proxy"` 关闭

2. **优化数据库查询**
   - 使用 WebSocket 推送而非轮询
   - 避免频繁的 SQL 查询
   - 当前实现：玩家列表通过 Socket.io 实时推送（无需重复查询）

3. **Cloud Run 自动扩缩容**
   - 设置最小实例为 0，无流量时自动关闭
   - 使用请求超时自动清理长连接

### 房间管理

- **房主离开 = 房间关闭**
  - 房主断开连接时，房间及所有数据自动删除
  - 所有玩家会收到通知并被踢出
  - 第一个加入的玩家（seat-1）自动成为房主

### WebSocket 连接

- 使用 Socket.io（支持自动重连）
- 玩家加入/离开时自动广播更新
- 房间关闭时自动断开所有连接


