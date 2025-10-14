'use client';
import { useState } from 'react';
import type { CreateRoomResponse, JoinRoomResponse } from '../../../types';
import { useRouter } from 'next/navigation';

export default function StartGamePage() {
  const router = useRouter();
  const [apiBase, setApiBase] = useState(
    typeof window !== 'undefined' 
      ? sessionStorage.getItem('apiBase') || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'
      : 'http://localhost:3001'
  );
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartGame = async () => {
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }

    if (!apiBase.trim()) {
      setError('请输入 API Base URL');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. 创建房间
      const createRes = await fetch(`${apiBase}/createRoom`, {
        method: 'POST',
      });
      
      if (!createRes.ok) {
        throw new Error('创建房间失败');
      }

      const createData = (await createRes.json()) as CreateRoomResponse;
      const { roomId, hostKey } = createData;

      // 2. 作为主持人加入房间
      const joinRes = await fetch(`${apiBase}/joinRoom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, nickname }),
      });

      if (!joinRes.ok) {
        throw new Error('加入房间失败');
      }

      const joinData = (await joinRes.json()) as JoinRoomResponse;
      const { seatToken, seatId, displayName } = joinData;

      // 3. 保存到 sessionStorage（每个标签页独立）
      sessionStorage.setItem('apiBase', apiBase);
      sessionStorage.setItem('roomId', roomId);
      sessionStorage.setItem('hostKey', hostKey);
      sessionStorage.setItem('seatToken', seatToken);
      sessionStorage.setItem('seatId', seatId);
      sessionStorage.setItem('displayName', displayName);
      sessionStorage.setItem('nickname', nickname);
      sessionStorage.setItem('isHost', 'true');

      // 4. 跳转到游戏房间
      router.push(`/room?id=${roomId}`);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 32, marginBottom: 24 }}>创建游戏</h1>
      
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="apiBase" style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          API Base URL:
        </label>
        <input
          id="apiBase"
          type="text"
          value={apiBase}
          onChange={(e) => setApiBase(e.target.value)}
          placeholder="http://localhost:3001"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 14,
            border: '1px solid #ddd',
            borderRadius: 4,
          }}
        />
        <small style={{ color: '#666', fontSize: 12 }}>
          后端服务器地址，例如: http://localhost:3001
        </small>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label htmlFor="nickname" style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          你的昵称:
        </label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="输入你的昵称"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 14,
            border: '1px solid #ddd',
            borderRadius: 4,
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleStartGame();
          }}
        />
      </div>

      <button
        onClick={handleStartGame}
        disabled={loading || !nickname.trim() || !apiBase.trim()}
        style={{
          width: '100%',
          padding: '12px 24px',
          fontSize: 16,
          fontWeight: 600,
          color: 'white',
          backgroundColor: loading ? '#999' : '#0070f3',
          border: 'none',
          borderRadius: 4,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '创建中...' : '创建游戏房间'}
      </button>

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: 4,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <a
          href="/"
          style={{ color: '#0070f3', textDecoration: 'none' }}
        >
          ← 返回首页
        </a>
        <span style={{ margin: '0 12px', color: '#ccc' }}>|</span>
        <a
          href="/join-room"
          style={{ color: '#0070f3', textDecoration: 'none' }}
        >
          加入房间 →
        </a>
      </div>

      <div
        style={{
          marginTop: 32,
          padding: 16,
          backgroundColor: '#f5f5f5',
          borderRadius: 4,
          fontSize: 14,
        }}
      >
        <h3 style={{ marginTop: 0, fontSize: 16 }}>💡 提示</h3>
        <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
          <li>创建房间后，你将成为房间主持人</li>
          <li>你可以分享房间码给其他玩家</li>
          <li>每个浏览器标签页可以独立加入不同房间，方便测试</li>
        </ul>
      </div>
    </main>
  );
}

