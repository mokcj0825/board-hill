# Git 提交指南

## 快速提交（一步完成）

```bash
cd /Users/cjmok/WebstormProjects/board-hill

git add .
git commit -m "feat: setup Cloud SQL connection and add dotenv support

- Add dotenv to load environment variables
- Update env.example with Cloud SQL connection options
- Add Cloud SQL Proxy to .gitignore
- Add setup documentation (SETUP.md, AUTH_SETUP.md)
- join-room API now connected to Cloud SQL database"
git push origin main
```

---

## 分步提交（推荐，更安全）

### 第 1 步：查看要提交的文件

```bash
git status
```

应该看到：
- ✅ `.gitignore` (modified)
- ✅ `hill/game-master/server.js` (modified)
- ✅ `hill/game-master/package.json` (modified)
- ✅ `hill/game-master/package-lock.json` (modified)
- ✅ `hill/game-master/env.example` (modified)
- ✅ `hill/game-master/AUTH_SETUP.md` (untracked)
- ✅ `hill/game-master/SETUP.md` (untracked)

❌ 不应该看到：
- `.env` 
- `cloud-sql-proxy`
- `node_modules/`

### 第 2 步：添加文件到暂存区

```bash
git add .
```

### 第 3 步：确认暂存的内容（重要！）

```bash
git diff --staged
```

检查是否有敏感信息（密码、密钥等）。

### 第 4 步：查看哪些文件被添加

```bash
git status
```

### 第 5 步：提交

```bash
git commit -m "feat: setup Cloud SQL connection and add dotenv support

- Add dotenv to load environment variables
- Update env.example with Cloud SQL connection options  
- Add Cloud SQL Proxy to .gitignore
- Add setup documentation (SETUP.md, AUTH_SETUP.md)
- join-room API now connected to Cloud SQL database"
```

### 第 6 步：推送到远程仓库

```bash
git push origin main
```

---

## 验证提交后

```bash
# 查看提交历史
git log --oneline -1

# 查看提交的文件
git show --name-only HEAD
```

---

## 如果发现问题怎么办？

### 如果还没有 push

撤销最近的提交（保留修改）：
```bash
git reset --soft HEAD~1
```

### 如果已经 push 了

需要非常小心！如果提交了敏感信息，应该：
1. 立即修改密码
2. 联系管理员清理 git 历史

---

## 注意事项

### ✅ 确认 .env 被忽略

```bash
git check-ignore .env hill/game-master/.env
```

应该输出：
```
.env
hill/game-master/.env
```

### ✅ 确认 cloud-sql-proxy 被忽略

```bash
git check-ignore cloud-sql-proxy
```

应该输出：
```
cloud-sql-proxy
```

---

## 提交后的下一步

1. **验证 Cloud Run 环境变量** - 确保生产环境配置正确
2. **部署到 Cloud Run** - 从 GitHub 触发新的部署
3. **运行 Migration** - 在 Cloud Run 上运行 `npx prisma migrate deploy`
4. **测试生产 API** - 验证生产环境的 join-room API

---

## 本次提交的文件说明

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `.gitignore` | Modified | 添加 cloud-sql-proxy 和临时文件规则 |
| `hill/game-master/server.js` | Modified | 添加 `require('dotenv').config()` 在第一行 |
| `hill/game-master/package.json` | Modified | 添加 `dotenv` 依赖 |
| `hill/game-master/package-lock.json` | Modified | npm install dotenv 后自动生成 |
| `hill/game-master/env.example` | Modified | 更新了 DATABASE_URL 配置说明 |
| `hill/game-master/SETUP.md` | New | 完整的本地开发设置指南 |
| `hill/game-master/AUTH_SETUP.md` | New | Google Cloud 认证详细文档 |

