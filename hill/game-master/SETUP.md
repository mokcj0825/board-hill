# Cloud SQL 连接和数据库设置

## 前置条件

1. Cloud SQL 实例已创建：`me-in-react:asia-southeast2:hill`
2. 数据库用户和密码已设置
3. 数据库已创建（例如：`boardhill` 或 `postgres`）

## 本地开发设置步骤

### 1. 下载 Cloud SQL Proxy

```bash
# macOS (Apple Silicon)
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.2/cloud-sql-proxy.darwin.arm64

# macOS (Intel)
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.2/cloud-sql-proxy.darwin.amd64

# Linux
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.2/cloud-sql-proxy.linux.amd64

# 添加执行权限
chmod +x cloud-sql-proxy
```

### 2. 配置环境变量

创建 `hill/game-master/.env` 文件：

```env
DATABASE_URL="postgresql://你的用户名:你的密码@127.0.0.1:5432/你的数据库名?schema=public"
PORT=3001
```

**示例（根据你的实际信息修改）：**
```env
DATABASE_URL="postgresql://postgres:mySecretPass@127.0.0.1:5432/boardhill?schema=public"
PORT=3001
```

### 3. 启动 Cloud SQL Proxy

在**终端 1**运行（保持运行）：

```bash
./cloud-sql-proxy me-in-react:asia-southeast2:hill --port 5432
```

你应该看到类似输出：
```
The proxy has started successfully and is ready for new connections!
```

### 4. 安装依赖并运行 Migration

在**终端 2**运行：

```bash
cd hill/game-master

# 安装依赖
npm install

# 生成 Prisma Client
npx prisma generate

# 测试数据库连接
npx prisma db pull

# 应用 migration（创建表）
npx prisma migrate deploy
```

### 5. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3001` 启动。

### 6. 测试 API

```bash
# 健康检查
curl http://localhost:3001/health

# 创建房间
curl -X POST http://localhost:3001/createRoom

# 加入房间（替换 ROOM_ID）
curl -X POST http://localhost:3001/joinRoom \
  -H "Content-Type: application/json" \
  -d '{"roomId": "ROOM_ID"}'
```

---

## Cloud Run 部署配置

### 环境变量

在 Cloud Run 服务配置中设置：

```
DATABASE_URL=postgresql://你的用户名:你的密码@127.0.0.1:5432/你的数据库名?schema=public
PORT=3001
NODE_ENV=production
```

### 连接配置

在 Cloud Run **Connections** 标签页添加：

```
me-in-react:asia-southeast2:hill
```

### 运行 Migration（Cloud Run Job）

在 Cloud Run 中创建一个 Job 来运行 migration：

1. 使用与服务相同的容器镜像
2. 命令：`npx`
3. 参数：`prisma migrate deploy`
4. 环境变量和连接：与服务相同
5. 在每次部署新 schema 变更后运行此 Job

---

## 常见问题

### 连接超时
- 确保 Cloud SQL Proxy 正在运行
- 检查 DATABASE_URL 中的端口是否为 5432
- 确认数据库用户名和密码正确

### Prisma Client 未生成
```bash
npx prisma generate
```

### 表不存在
```bash
npx prisma migrate deploy
```

### 查看数据库状态
```bash
npx prisma studio
```
会打开一个可视化界面来查看数据库内容。

---

## 有用的 Prisma 命令

```bash
# 查看当前数据库 schema
npx prisma db pull

# 查看 migration 状态
npx prisma migrate status

# 创建新的 migration
npx prisma migrate dev --name your_migration_name

# 应用 migration（生产环境）
npx prisma migrate deploy

# 重置数据库（开发环境，会删除所有数据！）
npx prisma migrate reset

# 打开 Prisma Studio（数据库可视化工具）
npx prisma studio
```

