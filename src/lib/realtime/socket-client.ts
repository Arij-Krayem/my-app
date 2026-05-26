// ─── Client-side Socket.io singleton
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path:          "/api/socket-io",
      transports:    ["websocket", "polling"],
      reconnection:  true,
      reconnectionAttempts: 5,
      reconnectionDelay:    1000,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}