# game-player

- Role: web client (multi-seat tabs, spectator mode)
- Stack: React + Next.js 14 (App Router), Socket.io client
- Realtime: WebSocket connections for real-time gameplay

## 🚀 快速开始

### 1. 安装依赖

```bash
cd hill/game-player
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

前端将在 `http://localhost:3000` 启动

### 3. 配置后端地址（可选）

默认情况下，前端会连接到 `http://localhost:3001`

如需修改，可以：
- 在页面上直接输入 API 地址
- 或设置环境变量 `NEXT_PUBLIC_API_BASE`

```bash
# .env.local
NEXT_PUBLIC_API_BASE=http://localhost:3001
```

## 🎮 使用方法

### 创建游戏（房主）

1. 打开浏览器访问 `http://localhost:3000`
2. 点击"创建游戏"
3. 输入昵称
4. 自动创建房间并成为房主
5. 分享 6 位房间码给朋友

### 加入游戏（玩家）

1. 打开新的浏览器标签页
2. 点击"加入房间"
3. 输入房间码和昵称
4. 加入游戏

### 多人测试

🎯 **每个浏览器标签页都是独立的玩家！**

可以在同一浏览器开多个标签页，模拟多人游戏：
- 标签页 1：创建游戏（房主 - Alice#a1b2）
- 标签页 2：加入房间（玩家 - Bob#c3d4）
- 标签页 3：加入房间（玩家 - Charlie#e5f6）

每个标签页使用独立的 `sessionStorage`，互不干扰。

## 🛑 关闭服务

```bash
# 关闭前端开发服务器
pkill -f "next dev"
```

## 🏗️ 构建与部署

### 开发环境

```bash
npm run dev
```

### 生产构建

```bash
npm run build
npm run start
```

### 静态导出（Firebase Hosting）

```bash
npm run build
# 输出到 out/ 目录
```

在 Firebase Hosting 配置中：
- 源目录：`hill/game-player`
- 输出目录：`out`

## 📱 功能特性

### 实时功能
- ✅ 实时聊天
- ✅ 玩家列表自动更新（WebSocket 推送，无需轮询）
- ✅ 房主离开自动关闭房间
- ✅ 断线重连支持

### 房间管理
- ✅ 6 位房间码（易于分享）
- ✅ 昵称 + hash 显示（避免重名，如 `Alice#a1b2`）
- ✅ 房主特殊标识
- ✅ 离开房间确认提示

### 会话管理
- ✅ 每个标签页独立会话（`sessionStorage`）
- ✅ 支持同时测试多个玩家
- ✅ 自动清理会话数据

## 🔧 技术栈

- **框架**: Next.js 14 (App Router)
- **UI**: React 18 + TypeScript
- **实时通信**: Socket.io Client
- **状态管理**: React Hooks (useState, useEffect)
- **路由**: Next.js App Router
- **类型安全**: TypeScript + 共享类型定义（`../types`）

## 📂 项目结构

```
hill/game-player/
├── app/
│   ├── page.tsx              # 首页（创建/加入选择）
│   ├── start-game/
│   │   └── page.tsx          # 创建游戏页面
│   ├── join-room/
│   │   └── page.tsx          # 加入房间页面
│   ├── room/
│   │   └── page.tsx          # 游戏房间（聊天+玩家列表）
│   └── layout.tsx            # 根布局
├── public/
└── package.json
```

## ⚠️ 注意事项

1. **多标签页测试**
   - 每个标签页是独立玩家
   - 使用 sessionStorage 而非 localStorage
   - 关闭标签页 = 玩家离开

2. **房主权限**
   - 第一个加入的玩家自动成为房主
   - 房主关闭标签页 = 房间关闭
   - 所有玩家会被自动踢出

3. **网络要求**
   - 需要 WebSocket 支持
   - 确保后端服务已启动
   - 检查防火墙设置


