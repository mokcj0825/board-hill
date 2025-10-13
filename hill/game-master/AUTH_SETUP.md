# Google Cloud 认证设置

Cloud SQL Proxy 需要 Google Cloud 认证才能连接到你的数据库。

## 方法 1：安装 Google Cloud SDK（推荐）

### 1. 安装 Google Cloud SDK

访问：https://cloud.google.com/sdk/docs/install

或者使用 Homebrew（macOS）：

```bash
brew install --cask google-cloud-sdk
```

### 2. 初始化并登录

```bash
# 初始化 gcloud
gcloud init

# 设置默认项目
gcloud config set project me-in-react

# 应用默认认证（最重要）
gcloud auth application-default login
```

这会打开浏览器让你登录 Google 账号。

### 3. 启动 Cloud SQL Proxy

```bash
cd /Users/cjmok/WebstormProjects/board-hill
./cloud-sql-proxy me-in-react:asia-southeast2:hill --port 5432
```

你应该看到：
```
The proxy has started successfully and is ready for new connections!
```

### 4. 运行 Migration

在另一个终端：

```bash
cd /Users/cjmok/WebstormProjects/board-hill/hill/game-master
npx prisma migrate deploy
```

---

## 方法 2：使用服务账号密钥（替代方案）

如果不想安装 gcloud SDK，可以使用服务账号：

### 1. 在 Google Cloud Console 创建服务账号

1. 进入 **IAM & Admin** → **Service Accounts**
2. 点击 **Create Service Account**
3. 名称：`game-master-dev`
4. 角色：**Cloud SQL Client**
5. 创建并下载 JSON 密钥文件

### 2. 使用密钥文件启动 Proxy

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
./cloud-sql-proxy me-in-react:asia-southeast2:hill --port 5432
```

或者直接在启动命令中指定：

```bash
./cloud-sql-proxy me-in-react:asia-southeast2:hill \
  --port 5432 \
  --credentials-file /path/to/your/service-account-key.json
```

---

## 验证认证

运行以下命令检查认证状态：

```bash
# 如果安装了 gcloud
gcloud auth list

# 查看默认凭据
ls ~/.config/gcloud/application_default_credentials.json

# 或者检查环境变量
echo $GOOGLE_APPLICATION_CREDENTIALS
```

---

## 完整设置流程（从这里开始）

### 第 1 步：安装 Google Cloud SDK

```bash
brew install --cask google-cloud-sdk
```

### 第 2 步：认证

```bash
gcloud init
gcloud config set project me-in-react
gcloud auth application-default login
```

### 第 3 步：启动 Cloud SQL Proxy

在终端 1（保持运行）：

```bash
cd /Users/cjmok/WebstormProjects/board-hill
./cloud-sql-proxy me-in-react:asia-southeast2:hill --port 5432
```

### 第 4 步：运行 Migration

在终端 2：

```bash
cd /Users/cjmok/WebstormProjects/board-hill/hill/game-master
npx prisma migrate deploy
```

### 第 5 步：启动开发服务器

```bash
npm run dev
```

### 第 6 步：测试 API

```bash
curl http://localhost:3001/health
curl -X POST http://localhost:3001/createRoom
```

---

## 常见错误

### 错误：could not find default credentials

**解决方案：**
```bash
gcloud auth application-default login
```

### 错误：Permission denied

**解决方案：**
确保你的 Google 账号有访问项目 `me-in-react` 的权限。

### 错误：connection refused

**解决方案：**
确保 Cloud SQL Proxy 正在运行并且没有错误。检查：
```bash
ps aux | grep cloud-sql-proxy
cat /tmp/cloud-sql-proxy.log
```

