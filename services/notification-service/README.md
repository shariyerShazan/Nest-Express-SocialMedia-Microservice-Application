# notification-service

NestJS microservice for real-time notifications using RabbitMQ + Socket.IO.

## Tech Stack
- **Runtime**: Node.js 18 + TypeScript
- **Framework**: NestJS (HTTP + RabbitMQ microservice hybrid)
- **Database**: PostgreSQL via Prisma ORM
- **Message Broker**: RabbitMQ (event consumer)
- **Cache**: Redis (unread count caching)
- **Real-time**: Socket.IO (push to connected clients)

## Environment Variables

| Variable        | Required | Description                      |
|-----------------|----------|----------------------------------|
| `DATABASE_URL`  | ✅       | PostgreSQL connection string     |
| `JWT_SECRET`    | ✅       | Shared JWT signing secret        |
| `REDIS_URL`     | ✅       | Redis connection URL             |
| `RABBITMQ_URL`  | ✅       | RabbitMQ AMQP connection URL     |
| `PORT`          | ❌       | HTTP port (default: 3004)        |

## API Endpoints

```
GET   /api/v1/notifications              Get notifications (paginated)
GET   /api/v1/notifications/unread-count Unread count (Redis cached)
POST  /api/v1/notifications/mark-read    Mark all as read (cache invalidated)
```

## RabbitMQ Events Consumed

| Event Pattern     | Exchange    | Trigger                        |
|-------------------|-------------|--------------------------------|
| `post.liked`      | `posts`     | Someone liked a user's post    |
| `comment.created` | `posts`     | Someone commented on a post    |
| `user.followed`   | `users`     | A user was followed            |

## Real-Time WebSocket

```
Client connects with JWT → socket authenticated
Server emits: new_notification { id, type, message, actorId, createdAt }
```

## Development
```bash
npm run start:dev    # Hot reload
npm run build        # Compile
npm start            # Run compiled
```
