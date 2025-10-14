export type StartGameRequest = { nickname: string };
export type StartGameResponse = { playerId: string; nickname: string };

export type CreateRoomResponse = { roomId: string; hostKey: string };

export type JoinRoomRequest = { roomId: string; nickname: string };
export type JoinRoomResponse = { roomId: string; seatId: string; seatToken: string; displayName: string };

export type RoomStatusResponse = {
  roomId: string;
  createdAt: number;
  seats: { seatId: string; nickname: string; displayName: string; joinedAt: number }[];
};

export type SocketJoinPayload = { roomId: string; seatToken: string };
export type SocketMessagePayload = { roomId: string; message: string };

