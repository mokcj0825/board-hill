'use client';
import { useEffect, useMemo, useState } from 'react';

export default function RoomPage() {
  const [apiBase, setApiBase] = useState('');
  const [roomId, setRoomId] = useState('');
  const [seatToken, setSeatToken] = useState('');
  const [seatId, setSeatId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('apiBase') || 'http://localhost:3001';
    setApiBase(stored);
  }, []);

  const createRoom = async () => {
    setError('');
    try {
      const res = await fetch(`${apiBase}/createRoom`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'createRoom failed');
      setRoomId(data.roomId);
    } catch (e: any) { setError(e.message || String(e)); }
  };

  const joinRoom = async () => {
    setError('');
    try {
      const res = await fetch(`${apiBase}/joinRoom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'joinRoom failed');
      setSeatToken(data.seatToken);
      setSeatId(data.seatId);
      sessionStorage.setItem('seatToken', data.seatToken);
      sessionStorage.setItem('roomId', data.roomId);
    } catch (e: any) { setError(e.message || String(e)); }
  };

  return (
    <main>
      <h1>Room</h1>
      <div style={{ marginTop: 12 }}>
        <label>API Base: <input value={apiBase} onChange={(e) => setApiBase(e.target.value)} style={{ width: 320 }} /></label>
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={createRoom}>Create Room</button>
      </div>
      <div style={{ marginTop: 12 }}>
        <label>Room ID: <input value={roomId} onChange={(e) => setRoomId(e.target.value.toUpperCase())} placeholder="ABC123" /></label>
        <button onClick={joinRoom} disabled={!roomId.trim()}>Join Room</button>
      </div>
      {seatId && <p>Joined as {seatId}</p>}
      {seatToken && <p>Seat token stored in session</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </main>
  );
}


