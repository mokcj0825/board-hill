require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { customAlphabet } = require('nanoid');
const { prisma } = require('./db');

const app = express();
app.use(cors({ origin: '*'}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Alias: start game to get a temporary player id
app.post('/startGame', (req, res) => {
  const nickname = typeof req.body?.nickname === 'string' ? req.body.nickname.trim() : '';
  const playerId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 24)();
  res.status(201).json({ playerId, nickname });
});

// Alias: createRoom -> same as POST /rooms
app.post('/createRoom', async (req, res) => {
  try {
    let roomId = '';
    for (let i = 0; i < 5; i++) {
      const candidate = generateRoomId();
      const exists = await prisma.room.findUnique({ where: { id: candidate } });
      if (!exists) { roomId = candidate; break; }
    }
    if (!roomId) return res.status(500).json({ error: 'room_id_collision' });
    const hostKey = generateSeatToken();
    await prisma.room.create({ data: { id: roomId, hostKey } });
    res.status(201).json({ roomId, hostKey });
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: String(e.message || e) });
  }
});

// Alias: joinRoom -> create seat in a room
app.post('/joinRoom', async (req, res) => {
  try {
    const roomIdRaw = typeof req.body?.roomId === 'string' ? req.body.roomId : '';
    const roomId = roomIdRaw.trim().toUpperCase();
    const nickname = typeof req.body?.nickname === 'string' ? req.body.nickname.trim() : 'Player';
    
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { seats: true } });
    if (!room) return res.status(404).json({ error: 'room_not_found' });
    
    const seatToken = generateSeatToken();
    const seatId = `seat-${room.seats.length + 1}`;
    // Generate displayName: nickname + # + first 4 chars of token
    const displayName = `${nickname}#${seatToken.substring(0, 4)}`;
    
    await prisma.seat.create({ 
      data: { 
        id: seatToken, 
        seatId, 
        nickname,
        displayName,
        roomId 
      } 
    });
    res.status(201).json({ roomId, seatId, seatToken, displayName });
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: String(e.message || e) });
  }
});

// Identifiers
const generateRoomId = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6); // 6-char code
const generateSeatToken = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 32);

app.post('/rooms', async (req, res) => {
  try {
    // Try a few times to avoid rare collisions
    let roomId = '';
    for (let i = 0; i < 5; i++) {
      const candidate = generateRoomId();
      const exists = await prisma.room.findUnique({ where: { id: candidate } });
      if (!exists) { roomId = candidate; break; }
    }
    if (!roomId) return res.status(500).json({ error: 'room_id_collision' });
    const hostKey = generateSeatToken();
    await prisma.room.create({ data: { id: roomId, hostKey } });
    res.status(201).json({ roomId, hostKey });
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: String(e.message || e) });
  }
});

app.post('/rooms/:id/seats', async (req, res) => {
  try {
    const roomId = (req.params.id || '').trim().toUpperCase();
    const nickname = typeof req.body?.nickname === 'string' ? req.body.nickname.trim() : 'Player';
    
    const room = await prisma.room.findUnique({ where: { id: roomId } , include: { seats: true }});
    if (!room) return res.status(404).json({ error: 'room_not_found' });
    
    const seatToken = generateSeatToken();
    const seatId = `seat-${room.seats.length + 1}`;
    const displayName = `${nickname}#${seatToken.substring(0, 4)}`;
    
    await prisma.seat.create({ 
      data: { 
        id: seatToken, 
        seatId, 
        nickname,
        displayName,
        roomId 
      } 
    });
    res.status(201).json({ roomId, seatId, seatToken, displayName });
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: String(e.message || e) });
  }
});

app.get('/rooms/:id', async (req, res) => {
  try {
    const roomId = (req.params.id || '').trim().toUpperCase();
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { seats: true } });
    if (!room) return res.status(404).json({ error: 'room_not_found' });
    res.json({
      roomId: room.id,
      createdAt: room.createdAt.getTime(),
      seats: room.seats.map(s => ({ 
        seatId: s.seatId, 
        nickname: s.nickname,
        displayName: s.displayName,
        joinedAt: new Date(s.joinedAt).getTime() 
      }))
    });
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: String(e.message || e) });
  }
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' }
});

// Helper function to broadcast player list to room
async function broadcastPlayerList(roomId) {
  try {
    const room = await prisma.room.findUnique({ 
      where: { id: roomId }, 
      include: { seats: true } 
    });
    if (room) {
      const players = room.seats.map(s => ({
        seatId: s.seatId,
        nickname: s.nickname,
        displayName: s.displayName,
        joinedAt: s.joinedAt.getTime()
      }));
      io.to(roomId).emit('room:players', { players });
    }
  } catch (e) {
    console.error('[broadcastPlayerList] error:', e);
  }
}

io.on('connection', (socket) => {
  // Join a room by roomId; seatToken is placeholder for later auth/permissions
  socket.on('room:join', (payload = {}, ack) => {
    const { roomId, seatToken } = payload;
    if (typeof roomId !== 'string' || roomId.trim() === '') {
      if (typeof ack === 'function') ack({ ok: false, error: 'invalid roomId' });
      return;
    }
    const normalizedRoomId = roomId.trim().toUpperCase();
    // Validate against DB (only once on join)
    prisma.room.findUnique({ where: { id: normalizedRoomId }, include: { seats: true } }).then(room => {
      if (!room) {
        if (typeof ack === 'function') ack({ ok: false, error: 'room_not_found' });
        return;
      }
      if (typeof seatToken !== 'string' || !room.seats.find(s => s.id === seatToken)) {
        if (typeof ack === 'function') ack({ ok: false, error: 'invalid_seat' });
        return;
      }
      const seat = room.seats.find(s => s.id === seatToken);
      // First seat (seat-1) is the host
      const isHost = seat.seatId === 'seat-1';
      
      socket.data = { 
        roomId: normalizedRoomId, 
        seatId: seat.seatId, 
        displayName: seat.displayName, 
        seatToken,
        isHost 
      };
      socket.join(normalizedRoomId);
      
      if (typeof ack === 'function') {
        ack({ 
          ok: true, 
          roomId: normalizedRoomId, 
          seatId: seat.seatId, 
          displayName: seat.displayName,
          isHost 
        });
      }
      
      // Notify others
      socket.to(normalizedRoomId).emit('room:system', { 
        type: 'join', 
        by: seat.displayName, 
        at: Date.now() 
      });
      
      // Broadcast updated player list to all (including self)
      broadcastPlayerList(normalizedRoomId);
    }).catch(e => {
      if (typeof ack === 'function') ack({ ok: false, error: 'room_not_found' });
    });
  });

  // Broadcast a message within a room
  socket.on('room:message', (payload = {}) => {
    const { roomId, message } = payload;
    if (typeof roomId !== 'string' || roomId.trim() === '' || typeof message !== 'string') return;
    const normalizedRoomId = roomId.trim().toUpperCase();
    io.to(normalizedRoomId).emit('room:message', { 
      from: socket.data?.displayName || socket.data?.seatId || socket.id, 
      message, 
      at: Date.now() 
    });
  });

  socket.on('disconnect', async () => {
    const { roomId, displayName, isHost } = socket.data || {};
    if (!roomId) return;

    try {
      if (isHost) {
        // Host disconnected - delete room and kick everyone
        console.log(`[disconnect] Host ${displayName} left, deleting room ${roomId}`);
        
        // Notify all players that room is closing
        io.to(roomId).emit('room:closed', { 
          message: '房主已离开，房间已关闭',
          at: Date.now() 
        });
        
        // Delete room from database (cascade will delete seats)
        await prisma.room.delete({ where: { id: roomId } });
        
        // Force disconnect all sockets in this room
        const socketsInRoom = await io.in(roomId).fetchSockets();
        for (const s of socketsInRoom) {
          s.leave(roomId);
        }
      } else {
        // Regular player disconnected
        console.log(`[disconnect] Player ${displayName} left room ${roomId}`);
        
        // Notify others
        socket.to(roomId).emit('room:system', { 
          type: 'leave', 
          by: displayName, 
          at: Date.now() 
        });
        
        // Broadcast updated player list
        // Note: player is still in DB, just disconnected
        // If you want to remove them, delete the seat here
      }
    } catch (e) {
      console.error('[disconnect] error:', e);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[game-master] listening on port ${PORT}`);
});


