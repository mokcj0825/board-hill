# Cloud Run 部署清单

提交代码后，你需要在 Google Cloud Console 中手动配置以下内容：

---

## 🔑 必须手动配置的内容

### 1️⃣ **环境变量（Environment Variables）**

在 Cloud Run 服务配置中添加：

```
DATABASE_URL = postgresql://postgre-office:UL0N_%3E%5E%25%7CvxF%7C%7DZv@127.0.0.1:5432/hill?schema=public
PORT = 3001
NODE_ENV = production
```

⚠️ **注意**：
- `DATABASE_URL` 中的密码必须是 URL 编码的版本：`UL0N_%3E%5E%25%7CvxF%7C%7DZv`
- 不是原始密码：`UL0N_>^%|vxF|}Zv`
- 使用 `127.0.0.1:5432`（不是公网 IP）

📍 **在哪里配置**：
```
Google Cloud Console 
→ Cloud Run 
→ 选择你的服务 
→ "编辑和部署新修订版本" 
→ "变量和密钥" 标签页
→ 添加环境变量
```

---

### 2️⃣ **Cloud SQL 连接（Connections）**

添加你的 Cloud SQL 实例连接：

```
me-in-react:asia-southeast2:hill
```

📍 **在哪里配置**：
```
Google Cloud Console 
→ Cloud Run 
→ 选择你的服务 
→ "编辑和部署新修订版本" 
→ "连接" 标签页
→ "Cloud SQL 连接"
→ 选择或输入：me-in-react:asia-southeast2:hill
```

---

### 3️⃣ **运行数据库 Migration（一次性操作）**

部署后第一次需要创建数据库表。

**选项 A：使用 Cloud Run Jobs（推荐）**

1. 创建一个 Cloud Run Job：
   ```
   名称：game-master-migrate
   区域：asia-southeast2
   容器镜像：使用与服务相同的镜像
   ```

2. 配置：
   - **命令**：`npx`
   - **参数**：`prisma,migrate,deploy`（逗号分隔）
   - **环境变量**：与服务相同（DATABASE_URL, NODE_ENV）
   - **连接**：添加 Cloud SQL 实例

3. 手动执行一次这个 Job

**选项 B：使用 Cloud Shell（简单快速）**

在 Cloud Console 的 Cloud Shell 中运行：

```bash
# 获取服务的容器镜像 URL
gcloud run services describe game-master --region=asia-southeast2 --format='value(image)'

# 使用该镜像运行 migration
gcloud run jobs create game-master-migrate \
  --image=[你的镜像URL] \
  --region=asia-southeast2 \
  --set-env-vars="DATABASE_URL=postgresql://postgre-office:UL0N_%3E%5E%25%7CvxF%7C%7DZv@127.0.0.1:5432/hill?schema=public" \
  --add-cloudsql-instances=me-in-react:asia-southeast2:hill \
  --command=npx \
  --args=prisma,migrate,deploy

# 执行 Job
gcloud run jobs execute game-master-migrate --region=asia-southeast2
```

---

## 📝 可选配置（建议但非必需）

### 4️⃣ **服务账号权限**

确保 Cloud Run 的服务账号有访问 Cloud SQL 的权限：

```
角色：Cloud SQL Client
服务账号：[PROJECT_NUMBER]-compute@developer.gserviceaccount.com
```

📍 **检查方式**：
```
Google Cloud Console 
→ IAM & Admin 
→ IAM 
→ 找到 Compute Engine default service account
→ 确认有 "Cloud SQL Client" 角色
```

---

### 5️⃣ **容器配置**

- **容器端口**：`3001`（应该已在 Dockerfile 中配置）
- **内存**：512 MB - 1 GB（根据需求调整）
- **CPU**：1（足够了）
- **并发**：80（WebSocket 应用建议值）
- **最小实例数**：0 或 1（0 节省成本，1 避免冷启动）
- **最大实例数**：1-3（演示用）

---

### 6️⃣ **认证和访问**

- **允许未经身份验证的调用**：是（演示用）
- 生产环境建议配置 Identity Platform 或其他认证

---

## 🧪 部署后验证清单

部署完成后，测试以下端点：

### 1. 健康检查

```bash
curl https://your-service-url.run.app/health
```

期望输出：
```json
{"ok":true}
```

### 2. 创建房间

```bash
curl -X POST https://your-service-url.run.app/createRoom
```

期望输出：
```json
{"roomId":"XXXXXX","hostKey":"..."}
```

### 3. 加入房间

```bash
curl -X POST https://your-service-url.run.app/joinRoom \
  -H "Content-Type: application/json" \
  -d '{"roomId":"XXXXXX"}'
```

期望输出：
```json
{"roomId":"XXXXXX","seatId":"seat-1","seatToken":"..."}
```

---

## 🚨 常见问题排查

### 错误：Can't reach database server

**原因**：Cloud SQL 连接未配置

**解决**：
1. 检查 "连接" 标签页是否添加了 `me-in-react:asia-southeast2:hill`
2. 检查 DATABASE_URL 使用的是 `127.0.0.1:5432`（不是公网 IP）

---

### 错误：Environment variable not found: DATABASE_URL

**原因**：环境变量未配置

**解决**：
1. 在 "变量和密钥" 标签页添加 DATABASE_URL
2. 确保密码是 URL 编码的：`UL0N_%3E%5E%25%7CvxF%7C%7DZv`

---

### 错误：Table 'Room' does not exist

**原因**：Migration 未运行

**解决**：
1. 使用 Cloud Run Jobs 运行 migration（见上面第3步）
2. 或者通过 Cloud Shell 连接到数据库手动运行

---

### 错误：Permission denied for database

**原因**：服务账号权限不足

**解决**：
1. 确保服务账号有 "Cloud SQL Client" 角色
2. 检查 DATABASE_URL 中的用户名和密码是否正确

---

## 📊 配置摘要表

| 配置项 | 值 | 在哪里配置 |
|-------|-----|----------|
| 环境变量: DATABASE_URL | `postgresql://postgre-office:UL0N_%3E%5E%25%7CvxF%7C%7DZv@127.0.0.1:5432/hill?schema=public` | Cloud Run → 变量和密钥 |
| 环境变量: PORT | `3001` | Cloud Run → 变量和密钥 |
| 环境变量: NODE_ENV | `production` | Cloud Run → 变量和密钥 |
| Cloud SQL 连接 | `me-in-react:asia-southeast2:hill` | Cloud Run → 连接 |
| 容器端口 | `3001` | 自动（Dockerfile） |
| Migration | 运行 `npx prisma migrate deploy` | Cloud Run Jobs 或 Cloud Shell |
| 服务账号角色 | Cloud SQL Client | IAM & Admin |

---

## 🎯 部署步骤总结

1. ✅ **提交代码**：`git push origin main`
2. ⏳ **等待 Cloud Build**：GitHub 自动触发构建
3. 🔧 **配置环境变量**：DATABASE_URL, PORT, NODE_ENV
4. 🔗 **添加 Cloud SQL 连接**：`me-in-react:asia-southeast2:hill`
5. 🗄️ **运行 Migration**：创建数据库表
6. ✅ **测试 API**：验证所有端点

---

## 💡 推荐：使用 Secret Manager

为了更安全，建议将 DATABASE_URL 存储在 Secret Manager 中：

1. 在 Secret Manager 中创建 secret：
   ```
   名称：DATABASE_URL
   值：postgresql://postgre-office:UL0N_%3E%5E%25%7CvxF%7C%7DZv@127.0.0.1:5432/hill?schema=public
   ```

2. 在 Cloud Run 中引用 secret：
   ```
   类型：引用机密
   机密：DATABASE_URL
   版本：latest
   暴露为：环境变量
   名称：DATABASE_URL
   ```

这样密码不会明文显示在 Cloud Run 配置中。

---

## 📞 需要帮助？

如果遇到问题：
1. 检查 Cloud Run 日志：Cloud Console → Cloud Run → 你的服务 → 日志
2. 检查 Cloud Build 日志：构建历史中查看错误
3. 使用 Cloud Shell 测试数据库连接

祝部署顺利！🚀

