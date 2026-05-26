// server.ts  (project root — replaces `next start` / `next dev`)
// ─── Custom Next.js server with Socket.io ────────────────────────────────────
//
// Usage:
//   Development:  node server.ts   (or: npx ts-node server.ts)
//   Production:   node server.js   (after tsc)
//
// package.json scripts to update:
//   "dev":   "ts-node --project tsconfig.server.json server.ts"
//   "start": "node server.js"
//   "build": "next build && tsc --project tsconfig.server.json"

import { createServer }       from "http";
import { parse }              from "url";
import next                   from "next";
import { Server as SocketIO } from "socket.io";
import { setSocketServer }    from "./src/lib/realtime/socket-server";

const dev  = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);
const app  = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "/", true);
    handle(req, res, parsedUrl);
  });

  // ── Attach Socket.io to the same HTTP server 
  const io = new SocketIO(httpServer, {
    cors: {
      origin:  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    path: "/api/socket-io",   // custom path to avoid conflicts
  });

  // Register the singleton so API routes can emit events
  setSocketServer(io);

  io.on("connection", (socket) => {
    console.log(`[socket.io] Client connected: ${socket.id}`);

    // Client joins its brand rooms so it only receives relevant events
    socket.on("join:brand", (brandId: string) => {
      socket.join(`brand:${brandId}`);
      console.log(`[socket.io] ${socket.id} joined brand:${brandId}`);
    });

    socket.on("leave:brand", (brandId: string) => {
      socket.leave(`brand:${brandId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[socket.io] Client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port} (Socket.io attached)`);
  });
});