# game-player

- Role: web client (multi-seat tabs, spectator mode)
- Stack (proposed): React + Next.js (App Router), Zustand/Redux, Zod
- Realtime: Socket.io client

## Run & Deploy

- Local dev
  - `npm install`
  - `npm run dev`
  - 可设置 `NEXT_PUBLIC_API_BASE` 指向后端 Cloud Run URL（否则在页面输入）

- Build (static export for Firebase Hosting)
  - `npm run build` → 输出到 `out/`
  - Firebase Hosting（UI）选择仓库子目录 `hill/game-player`，输出目录 `out`


