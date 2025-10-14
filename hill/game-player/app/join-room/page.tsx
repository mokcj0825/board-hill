'use client';
import { useState } from 'react';
import type { JoinRoomResponse } from '../../../types';
import { useRouter } from 'next/navigation';

export default function JoinRoomPage() {
  const router = useRouter();
  const [apiBase, setApiBase] = useState(
    typeof window !== 'undefined'
      ? sessionStorage.getItem('apiBase') || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'
      : 'http://localhost:3001'
  );
  const [roomId, setRoomId] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinRoom = async () => {
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }

    if (!roomId.trim()) {
      setError('请输入房间码');
      return;
    }

    if (!apiBase.trim()) {
      setError('请输入 API Base URL');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const normalizedRoomId = roomId.trim().toUpperCase();

      // 加入房间
      const joinRes = await fetch(`${apiBase}/joinRoom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: normalizedRoomId }),
      });

      if (!joinRes.ok) {
        const data = await joinRes.json();
        throw new Error(data?.error === 'room_not_found' ? '房间不存在' : '加入房间失败');
      }

      const joinData = (await joinRes.json()) as JoinRoomResponse;
      const { seatToken, seatId, displayName } = joinData;

      // 保存到 sessionStorage（每个标签页独立）
      sessionStorage.setItem('apiBase', apiBase);
      sessionStorage.setItem('roomId', normalizedRoomId);
      sessionStorage.setItem('seatToken', seatToken);
      sessionStorage.setItem('seatId', seatId);
      sessionStorage.setItem('displayName', displayName);
      sessionStorage.setItem('nickname', nickname);
      sessionStorage.setItem('isHost', 'false');

      // 跳转到游戏房间
      router.push(`/room?id=${normalizedRoomId}`);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 32, marginBottom: 24 }}>加入游戏</h1>

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

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="roomId" style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          房间码:
        </label>
        <input
          id="roomId"
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
          placeholder="例如: ABC123"
          maxLength={6}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: 2,
            textAlign: 'center',
            border: '2px solid #ddd',
            borderRadius: 4,
            textTransform: 'uppercase',
          }}
        />
        <small style={{ color: '#666', fontSize: 12 }}>
          输入 6 位房间码
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
            if (e.key === 'Enter') handleJoinRoom();
          }}
        />
      </div>

      <button
        onClick={handleJoinRoom}
        disabled={loading || !nickname.trim() || !roomId.trim() || !apiBase.trim()}
        style={{
          width: '100%',
          padding: '12px 24px',
          fontSize: 16,
          fontWeight: 600,
          color: 'white',
          backgroundColor: loading ? '#999' : '#10b981',
          border: 'none',
          borderRadius: 4,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '加入中...' : '加入房间'}
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
          href="/start-game"
          style={{ color: '#0070f3', textDecoration: 'none' }}
        >
          创建房间 →
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
          <li>向房间主持人获取 6 位房间码</li>
          <li>输入房间码和昵称即可加入游戏</li>
          <li>可以在不同标签页中加入不同房间，方便多人测试</li>
        </ul>
      </div>
    </main>
  );
}

