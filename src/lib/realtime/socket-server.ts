// src/lib/socket-server.ts
// ─── Socket.io server singleton — safe to call from any API route ────────────

import { Server as SocketIOServer } from "socket.io";

// Attach to global so it survives Next.js hot-reload
const globalForSocket = global as typeof globalThis & {
  _socketIO?: SocketIOServer;
};

export function setSocketServer(io: SocketIOServer): void {
  globalForSocket._socketIO = io;
}

export function getSocketServer(): SocketIOServer | null {
  return globalForSocket._socketIO ?? null;
}