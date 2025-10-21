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

### 2. 启动本地数据库（推荐用于开发）

**使用 Docker Compose (最简单):**

```bash
# 在项目根目录启动 PostgreSQL
docker-compose up -d

# 查看数据库状态
docker-compose ps
```

这会启动一个 PostgreSQL 容器，数据持久化在 Docker volume 中。

### 3. 配置环境变量

将 `convert-to-env.txt` 重命名为 `.env`：

```bash
# 在 hill/game-master 目录下
cp convert-to-env.txt .env
```

默认配置已指向 Docker 数据库：

```env
DATABASE_URL="postgresql://gamemaster:dev_password@localhost:5432/gamemaster_db?schema=public"
PORT=3001
```

### 4. 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npm run prisma:deploy
```

### 5. 启动服务

```bash
npm run dev
```

服务将在 `http://localhost:3001` 启动。

---

## 🔄 其他运行方式

### 方式一：Docker 本地开发（推荐）

适合日常开发，零云成本。

```bash
# 启动数据库
docker-compose up -d

# 启动应用
cd hill/game-master
npm run dev

# 停止数据库
docker-compose down
```

### 方式二：使用 Cloud SQL（生产环境）

适合测试生产环境配置。

**终端 1 - 启动 Cloud SQL Proxy:**
```bash
# 在项目根目录
./cloud-sql-proxy YOUR_PROJECT:YOUR_REGION:YOUR_INSTANCE --port 5432
```

**终端 2 - 修改 .env 并启动:**
```bash
# 修改 DATABASE_URL 为 Cloud SQL 配置
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

**使用 Docker 时：**

```bash
# 关闭后端服务 (Ctrl+C 或)
pkill -f "node server.js"

# 停止 Docker 数据库（保留数据）
docker-compose stop

# 完全删除容器和数据卷（谨慎使用）
docker-compose down -v
```

**使用 Cloud SQL 时（重要！避免产生费用）：**

```bash
# 关闭后端服务
pkill -f "node server.js"

# 关闭 Cloud SQL Proxy
pkill -f "cloud-sql-proxy"

# 验证 Proxy 已关闭
ps aux | grep cloud-sql-proxy | grep -v grep
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

### 本地 Docker（开发推荐）

```env
DATABASE_URL="postgresql://gamemaster:dev_password@localhost:5432/gamemaster_db?schema=public"
```

配合 `docker-compose.yml` 使用，无需额外配置。

### 本地 Cloud SQL Proxy（测试生产环境）

```env
DATABASE_URL="postgresql://username:password@127.0.0.1:5432/dbname?schema=public"
```

启动 Cloud SQL Proxy：
```bash
./cloud-sql-proxy YOUR_PROJECT:YOUR_REGION:YOUR_INSTANCE --port 5432
```

### Cloud Run 生产部署

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

1. **本地开发使用 Docker**
   - 零云成本，数据持久化在本地
   - 长时间不用可以 `docker-compose down` 释放资源

2. **测试生产环境时才使用 Cloud SQL**
   - 开发完成后务必关闭 Cloud SQL Proxy
   - 使用 `pkill -f "cloud-sql-proxy"` 关闭
   - 避免产生不必要的连接费用

3. **优化数据库查询**
   - 使用 WebSocket 推送而非轮询
   - 避免频繁的 SQL 查询
   - 当前实现：玩家列表通过 Socket.io 实时推送（无需重复查询）

4. **Cloud Run 自动扩缩容**
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


