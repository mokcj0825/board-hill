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
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { seats: true } });
    if (!room) return res.status(404).json({ error: 'room_not_found' });
    const seatToken = generateSeatToken();
    const seatId = `seat-${room.seats.length + 1}`;
    await prisma.seat.create({ data: { id: seatToken, seatId, roomId } });
    res.status(201).json({ roomId, seatId, seatToken });
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
    const room = await prisma.room.findUnique({ where: { id: roomId } , include: { seats: true }});
    if (!room) return res.status(404).json({ error: 'room_not_found' });
    const seatToken = generateSeatToken();
    const seatId = `seat-${room.seats.length + 1}`;
    await prisma.seat.create({ data: { id: seatToken, seatId, roomId } });
    res.status(201).json({ roomId, seatId, seatToken });
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
      seats: room.seats.map(s => ({ seatId: s.seatId, joinedAt: new Date(s.joinedAt).getTime() }))
    });
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: String(e.message || e) });
  }
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  // Join a room by roomId; seatToken is placeholder for later auth/permissions
  socket.on('room:join', (payload = {}, ack) => {
    const { roomId, seatToken } = payload;
    if (typeof roomId !== 'string' || roomId.trim() === '') {
      if (typeof ack === 'function') ack({ ok: false, error: 'invalid roomId' });
      return;
    }
    const normalizedRoomId = roomId.trim().toUpperCase();
    // Validate against DB
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
      socket.data = { roomId: normalizedRoomId, seatId: seat.seatId, seatToken };
      socket.join(normalizedRoomId);
      if (typeof ack === 'function') ack({ ok: true, roomId: normalizedRoomId, seatId: seat.seatId });
      socket.to(normalizedRoomId).emit('room:system', { type: 'join', by: seat.seatId, at: Date.now() });
    }).catch(e => {
      if (typeof ack === 'function') ack({ ok: false, error: 'room_not_found' });
    });
  });

  // Broadcast a message within a room
  socket.on('room:message', (payload = {}) => {
    const { roomId, message } = payload;
    if (typeof roomId !== 'string' || roomId.trim() === '' || typeof message !== 'string') return;
    const normalizedRoomId = roomId.trim().toUpperCase();
    io.to(normalizedRoomId).emit('room:message', { from: socket.data?.seatId || socket.id, message, at: Date.now() });
  });

  socket.on('disconnect', () => {
    // Placeholder for leave notifications if needed later
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[game-master] listening on port ${PORT}`);
});


