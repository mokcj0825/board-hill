# 🐳 本地 Docker 开发环境设置

本指南用于在本地开发时使用 Docker PostgreSQL，避免 Cloud SQL 费用。

## 🚀 快速开始

### 第一次运行

```bash
# 1. 启动数据库容器
docker-compose up -d

# 2. 配置环境变量
cd hill/game-master
cp convert-to-env.txt .env

# 3. 安装依赖（如果还没有）
npm install

# 4. 初始化数据库
npx prisma generate
npm run prisma:deploy

# 5. 启动应用
npm run dev
```

### 日常开发

```bash
# 启动数据库（如果已停止）
docker-compose up -d

# 启动应用
cd hill/game-master
npm run dev
```

## 🛑 停止服务

```bash
# 停止应用（Ctrl+C 或）
pkill -f "node server.js"

# 停止数据库（保留数据）
docker-compose stop

# 完全删除（清空所有数据，谨慎！）
docker-compose down -v
```

## 🔧 常用命令

```bash
# 查看数据库状态
docker-compose ps

# 查看数据库日志
docker-compose logs postgres

# 连接到数据库（调试用）
docker exec -it hill-postgres psql -U gamemaster -d gamemaster_db

# 重置数据库（开发时）
cd hill/game-master
npx prisma migrate reset
```

## 📊 数据管理

```bash
# 可视化数据库工具
cd hill/game-master
npx prisma studio
# 访问 http://localhost:5555

# 备份数据
docker exec hill-postgres pg_dump -U gamemaster gamemaster_db > backup.sql

# 恢复数据
docker exec -i hill-postgres psql -U gamemaster -d gamemaster_db < backup.sql
```

## 🔄 切换到 Cloud SQL

如果需要测试生产环境配置：

1. **修改 `.env` 文件：**
   ```env
   DATABASE_URL="postgresql://USER:PASS@127.0.0.1:5432/DB_NAME?schema=public"
   ```

2. **启动 Cloud SQL Proxy：**
   ```bash
   ./cloud-sql-proxy PROJECT:REGION:INSTANCE --port 5432
   ```

3. **停止本地 Docker 数据库：**
   ```bash
   docker-compose stop
   ```

## ⚠️ 故障排查

### 端口已被占用

```bash
# 检查 5432 端口占用
lsof -i :5432  # macOS/Linux
netstat -ano | findstr :5432  # Windows

# 停止其他 PostgreSQL 实例
docker-compose down
```

### 数据库连接失败

```bash
# 确认容器运行
docker-compose ps

# 查看容器日志
docker-compose logs postgres

# 重启容器
docker-compose restart postgres
```

### 迁移失败

```bash
# 重置数据库（会删除所有数据）
cd hill/game-master
npx prisma migrate reset

# 手动部署迁移
npm run prisma:deploy
```

## 💡 优点

- ✅ **零云成本** - 完全在本地运行
- ✅ **数据持久化** - 使用 Docker volume 保存数据
- ✅ **快速启动** - 无需连接云服务
- ✅ **离线开发** - 不需要网络连接
- ✅ **环境隔离** - 不影响生产数据

## 📋 技术栈

- **数据库镜像**: `postgres:16-alpine`
- **数据卷**: Docker named volume
- **端口映射**: `5432:5432`
- **健康检查**: 自动检测数据库就绪状态

