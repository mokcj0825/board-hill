'use client';

export default function HomePage() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 48, marginBottom: 16, color: '#111' }}>
          🎲 Board Hill
        </h1>
        <p style={{ fontSize: 18, color: '#666' }}>
          多人桌游平台 - 在线游戏体验
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 32,
        }}
      >
        <a
          href="/start-game"
          style={{
            display: 'block',
            padding: 32,
            backgroundColor: '#0070f3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 8,
            textAlign: 'center',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.transform = 'translateY(0)';
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>创建游戏</h2>
          <p style={{ fontSize: 14, opacity: 0.9 }}>
            创建一个新房间，邀请朋友一起玩
          </p>
        </a>

        <a
          href="/join-room"
          style={{
            display: 'block',
            padding: 32,
            backgroundColor: '#10b981',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 8,
            textAlign: 'center',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.transform = 'translateY(0)';
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚪</div>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>加入房间</h2>
          <p style={{ fontSize: 14, opacity: 0.9 }}>
            使用房间码加入现有游戏
          </p>
        </a>
      </div>

      <div
        style={{
          padding: 24,
          backgroundColor: '#f9fafb',
          borderRadius: 8,
          marginBottom: 24,
        }}
      >
        <h3 style={{ marginTop: 0, fontSize: 20, marginBottom: 16 }}>
          🎯 如何开始
        </h3>
        <ol style={{ paddingLeft: 24, marginBottom: 0 }}>
          <li style={{ marginBottom: 12 }}>
            <strong>创建游戏：</strong>点击"创建游戏"按钮，输入昵称后创建房间
          </li>
          <li style={{ marginBottom: 12 }}>
            <strong>分享房间码：</strong>将 6 位房间码分享给你的朋友
          </li>
          <li style={{ marginBottom: 12 }}>
            <strong>加入游戏：</strong>朋友点击"加入房间"，输入房间码即可加入
          </li>
          <li>
            <strong>开始游玩：</strong>等待所有玩家加入后，开始游戏
          </li>
        </ol>
      </div>

      <div
        style={{
          padding: 24,
          backgroundColor: '#fef3c7',
          borderRadius: 8,
          border: '1px solid #fbbf24',
        }}
      >
        <h3 style={{ marginTop: 0, fontSize: 18, marginBottom: 12 }}>
          💡 测试提示
        </h3>
        <p style={{ marginBottom: 8, fontSize: 14 }}>
          <strong>多人测试：</strong>{' '}
          可以在同一浏览器的不同标签页中打开多个玩家会话。
        </p>
        <p style={{ marginBottom: 0, fontSize: 14 }}>
          每个标签页都是独立的玩家，可以方便地测试多人游戏功能。
        </p>
      </div>
    </main>
  );
}


