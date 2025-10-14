'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import type { RoomStatusResponse } from '../../../types';

type SystemMessage = {
  type: 'join' | 'leave' | 'error' | 'info';
  by?: string;
  at: number;
  message?: string;
};

type ChatMessage = {
  from: string;
  message: string;
  at: number;
};

type Player = {
  seatId: string;
  nickname: string;
  displayName: string;
  joinedAt: number;
};

export default function RoomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  
  const [apiBase, setApiBase] = useState('');
  const [roomId, setRoomId] = useState('');
  const [seatToken, setSeatToken] = useState('');
  const [seatId, setSeatId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [nickname, setNickname] = useState('');
  const [isHost, setIsHost] = useState(false);
  
  const [connected, setConnected] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<(SystemMessage | ChatMessage)[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [error, setError] = useState('');
  
  const socketRef = useRef<Socket | null>(null);

  // 从 sessionStorage 加载数据
  useEffect(() => {
    setMounted(true);
    const storedApiBase = sessionStorage.getItem('apiBase') || '';
    const storedRoomId = searchParams.get('id') || sessionStorage.getItem('roomId') || '';
    const storedSeatToken = sessionStorage.getItem('seatToken') || '';
    const storedSeatId = sessionStorage.getItem('seatId') || '';
    const storedDisplayName = sessionStorage.getItem('displayName') || '';
    const storedNickname = sessionStorage.getItem('nickname') || '';
    const storedIsHost = sessionStorage.getItem('isHost') === 'true';

    setApiBase(storedApiBase);
    setRoomId(storedRoomId);
    setSeatToken(storedSeatToken);
    setSeatId(storedSeatId);
    setDisplayName(storedDisplayName);
    setNickname(storedNickname);
    setIsHost(storedIsHost);

    // 如果没有房间信息，跳转到首页
    if (!storedRoomId || !storedSeatToken) {
      router.push('/');
    }
  }, [router, searchParams]);

  // 建立 Socket.io 连接
  useEffect(() => {
    if (!mounted || !apiBase || !roomId || !seatToken) return;

    const socket = io(apiBase, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected');
      setConnected(true);
      
      // 加入房间
      socket.emit('room:join', { roomId, seatToken }, (response: any) => {
        if (response?.ok) {
          console.log('[Socket] Joined room:', response);
          setMessages((prev) => [
            ...prev,
            {
              type: 'info',
              at: Date.now(),
              message: `已加入房间 ${roomId}`,
            } as SystemMessage,
          ]);
        } else {
          console.error('[Socket] Join failed:', response);
          setError(response?.error || '加入房间失败');
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setConnected(false);
    });

    socket.on('room:system', (data: SystemMessage) => {
      console.log('[Socket] System:', data);
      setMessages((prev) => [...prev, data]);
    });

    socket.on('room:message', (data: ChatMessage) => {
      console.log('[Socket] Message:', data);
      setMessages((prev) => [...prev, data]);
    });

    socket.on('room:players', (data: { players: Player[] }) => {
      console.log('[Socket] Players updated:', data.players);
      setPlayers(data.players);
    });

    socket.on('room:closed', (data: { message: string; at: number }) => {
      console.log('[Socket] Room closed:', data);
      alert(data.message);
      // Clear session storage
      sessionStorage.clear();
      // Redirect to home
      router.push('/');
    });

    return () => {
      socket.disconnect();
    };
  }, [mounted, apiBase, roomId, seatToken, router]);

  const sendMessage = () => {
    if (!inputMessage.trim() || !socketRef.current || !connected) return;
    
    socketRef.current.emit('room:message', {
      roomId,
      message: inputMessage,
    });
    
    setInputMessage('');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    alert(`房间码 ${roomId} 已复制到剪贴板`);
  };

  const leaveRoom = () => {
    // 房主离开需要特殊提示
    if (isHost) {
      const confirmed = window.confirm(
        '⚠️ 你是房主！\n\n离开房间将会：\n• 关闭整个房间\n• 踢出所有玩家\n• 删除所有数据\n\n确定要离开吗？'
      );
      if (!confirmed) return;
    } else {
      const confirmed = window.confirm('确定要离开房间吗？');
      if (!confirmed) return;
    }
    
    // 手动断开 Socket 连接（触发后端的 disconnect 事件）
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    // 清理 sessionStorage
    sessionStorage.removeItem('roomId');
    sessionStorage.removeItem('seatToken');
    sessionStorage.removeItem('seatId');
    sessionStorage.removeItem('displayName');
    sessionStorage.removeItem('isHost');
    
    // 返回首页
    router.push('/');
  };

  if (!mounted) {
    return <div style={{ padding: 24 }}>加载中...</div>;
  }

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
        <button
          onClick={leaveRoom}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          🚪 离开房间
        </button>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          ← 返回首页
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: 24,
        }}
      >
        {/* 左侧信息面板 */}
        <div>
          <div
            style={{
              padding: 16,
              backgroundColor: '#f9fafb',
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: 20, marginBottom: 16 }}>
              房间信息
            </h2>
            
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                房间码
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: '#0070f3',
                  }}
                >
                  {roomId}
                </div>
                <button
                  onClick={copyRoomCode}
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    backgroundColor: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  复制
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                你的身份
              </div>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#0070f3' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                ({seatId})
              </div>
            </div>

            {isHost && (
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    padding: 8,
                    backgroundColor: '#fef3c7',
                    borderRadius: 4,
                    fontSize: 14,
                  }}
                >
                  🎯 你是房间主持人
                </div>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                连接状态
              </div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  backgroundColor: connected ? '#d1fae5' : '#fee',
                  color: connected ? '#065f46' : '#c33',
                  borderRadius: 4,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {connected ? '🟢 已连接' : '🔴 未连接'}
              </div>
            </div>
          </div>

            {error && (
            <div
              style={{
                padding: 12,
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: 4,
                fontSize: 14,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          {/* 玩家列表 */}
          <div
            style={{
              padding: 16,
              backgroundColor: '#f9fafb',
              borderRadius: 8,
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: 16, marginBottom: 12 }}>
              玩家列表 ({players.length})
            </h3>
            {players.length === 0 ? (
              <div style={{ fontSize: 14, color: '#999', textAlign: 'center', padding: '12px 0' }}>
                暂无玩家
              </div>
            ) : (
              <div>
                {players.map((player) => (
                  <div
                    key={player.seatId}
                    style={{
                      padding: '8px 12px',
                      marginBottom: 8,
                      backgroundColor: player.displayName === displayName ? '#e0f2fe' : 'white',
                      border: player.displayName === displayName ? '2px solid #0070f3' : '1px solid #e5e7eb',
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {player.displayName}
                      {player.displayName === displayName && (
                        <span style={{ marginLeft: 8, fontSize: 12, color: '#0070f3' }}>
                          (你)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                      {player.seatId}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧聊天面板 */}
        <div>
          <div
            style={{
              height: '70vh',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: 16,
                borderBottom: '1px solid #d1d5db',
                backgroundColor: '#f9fafb',
                borderRadius: '8px 8px 0 0',
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18 }}>房间聊天</h2>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 16,
              }}
            >
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#999', marginTop: 32 }}>
                  暂无消息
                </div>
              )}
              
              {messages.map((msg, idx) => {
                if ('type' in msg) {
                  // 系统消息
                  const sysMsg = msg as SystemMessage;
                  return (
                    <div
                      key={`sys-${idx}-${sysMsg.at}`}
                      style={{
                        marginBottom: 12,
                        padding: 8,
                        backgroundColor: '#f3f4f6',
                        borderRadius: 4,
                        fontSize: 14,
                        color: '#666',
                        textAlign: 'center',
                      }}
                    >
                      {sysMsg.message ||
                        (sysMsg.type === 'join' && `${sysMsg.by} 加入了房间`) ||
                        (sysMsg.type === 'leave' && `${sysMsg.by} 离开了房间`)}
                    </div>
                  );
                } else {
                  // 聊天消息
                  const chatMsg = msg as ChatMessage;
                  const isMe = chatMsg.from === displayName;
                  return (
                    <div
                      key={`chat-${idx}-${chatMsg.at}`}
                      style={{
                        marginBottom: 12,
                        display: 'flex',
                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '70%',
                          padding: 12,
                          backgroundColor: isMe ? '#0070f3' : '#f3f4f6',
                          color: isMe ? 'white' : '#111',
                          borderRadius: 8,
                        }}
                      >
                        <div style={{ fontSize: 12, marginBottom: 4, opacity: 0.8 }}>
                          {chatMsg.from}
                        </div>
                        <div style={{ fontSize: 14 }}>{chatMsg.message}</div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>

            <div
              style={{
                padding: 16,
                borderTop: '1px solid #d1d5db',
                display: 'flex',
                gap: 8,
              }}
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendMessage();
                }}
                placeholder="输入消息..."
                disabled={!connected}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: 14,
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!connected || !inputMessage.trim()}
                style={{
                  padding: '8px 24px',
                  fontSize: 14,
                  fontWeight: 500,
                  backgroundColor: connected && inputMessage.trim() ? '#0070f3' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: connected && inputMessage.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                发送
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


