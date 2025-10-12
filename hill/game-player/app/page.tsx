'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const [apiBase, setApiBase] = useState('http://localhost:3001');
  const [nickname, setNickname] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [error, setError] = useState('');

  const startGame = async () => {
    setError('');
    try {
      const res = await fetch(`${apiBase}/startGame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'startGame failed');
      setPlayerId(data.playerId);
      sessionStorage.setItem('playerId', data.playerId);
      sessionStorage.setItem('apiBase', apiBase);
      router.push('/room');
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  return (
    <main>
      <h1>Start Game</h1>
      <div style={{ marginTop: 12 }}>
        <label>API Base: <input value={apiBase} onChange={(e) => setApiBase(e.target.value)} style={{ width: 320 }} /></label>
      </div>
      <div style={{ marginTop: 12 }}>
        <label>Nickname: <input value={nickname} onChange={(e) => setNickname(e.target.value)} /></label>
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={startGame} disabled={!nickname.trim()}>Start Game</button>
      </div>
      {playerId && <p style={{ marginTop: 12 }}>Temp playerId: {playerId}</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </main>
  );
}


