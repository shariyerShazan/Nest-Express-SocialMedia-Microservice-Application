# chat-service

Express.js microservice for real-time messaging using Socket.IO.

## Tech Stack
- **Runtime**: Node.js 18 + TypeScript
- **Framework**: Express.js + Socket.IO
- **Database**: MongoDB via Mongoose
- **Cache**: Redis (inbox cache 60s TTL + Socket.IO backplane adapter)
- **Auth**: JWT (HTTP-only cookie or bearer token)
- **Logging**: Pino (structured JSON)

## Environment Variables

| Variable    | Required | Description                          |
|-------------|----------|--------------------------------------|
| `MONGO_URI` | ✅       | MongoDB connection string            |
| `JWT_SECRET`| ✅       | Shared JWT signing secret            |
| `REDIS_URL` | ✅       | Redis URL (cache + Socket.IO adapter)|
| `PORT`      | ❌       | HTTP port (default: 3003)            |

## API Endpoints (HTTP)

```
POST  /api/v1/chat/start           Start or resume a chat room
GET   /api/v1/chat/active          Get inbox (cached 60s per user)
GET   /api/v1/chat/:roomId/history Paginated message history
```

## WebSocket Events (Socket.IO)

```
Client → Server:
  send_message   { roomId, content }

Server → Client:
  receive_message  { message, sender, roomId, createdAt }
```

## Scaling Strategy

This service is **horizontally scalable**:
- All Socket.IO instances share a Redis Pub/Sub backplane
- When User A connects to Pod 1 and User B connects to Pod 2, messages are routed via Redis
- Inbox state is stored in MongoDB, not in-memory

## Development
```bash
npm run dev       # Hot reload with ts-node-dev
npm run build     # Compile TypeScript
npm start         # Run compiled dist/
```
