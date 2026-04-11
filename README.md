# Facebook-Like Backend — Microservices Architecture

A production-grade, event-driven social media backend built with Express, NestJS, PostgreSQL, MongoDB, RabbitMQ, Redis, and Docker.

---

## Quick Start

```bash
# 1. Clone and enter the project
cd social-media-app

# 2. Create your root environment file
cp .env.example .env
# Edit .env and fill in your JWT_SECRET, SMTP credentials, etc.

# 3. Spin up the entire stack
docker compose up --build

# 4. Run database migrations (first time only)
docker compose exec auth-service npx prisma migrate deploy
docker compose exec notification-service npx prisma migrate deploy
```

The **NGINX Gateway** is now live at `http://localhost:80`.

---

## Service Architecture

| Service                  | Tech                     | Port  | Description                          |
|--------------------------|--------------------------|-------|--------------------------------------|
| `auth-service`           | Express + PostgreSQL     | 3001  | Auth, JWT, Registration, User CRUD   |
| `post-service`           | NestJS + MongoDB         | 3002  | Posts, Interaction, Cursor-based Feed |
| `chat-service`           | Express + MongoDB        | 3003  | Real-time chat (Socket.IO)           |
| `notification-service`   | NestJS + PostgreSQL      | 3004  | Notifications (RabbitMQ consumer)    |
| `admin-service`          | Express + Hybrid DB      | 4001  | Consolidated Admin & Moderation      |

## Infrastructure

| Container            | Image                             | Purpose                          |
|----------------------|-----------------------------------|----------------------------------|
| `nginx`              | nginx:1.25-alpine                 | API Gateway + static asset server|
| `postgres-auth`      | postgres:15-alpine                | Auth & admin user data           |
| `postgres-notif`     | postgres:15-alpine                | Notification history             |
| `mongodb`            | mongo:7-jammy                     | Posts, comments, chats           |
| `redis`              | redis:7-alpine                    | Caching + Socket.IO adapter      |
| `rabbitmq`           | rabbitmq:3.12-management-alpine   | Async event bus                  |

---

## API Endpoints (via Gateway `localhost:80`)

### Auth Service
```
POST   /api/v1/auth/register          Register new user
POST   /api/v1/auth/login             Login (sets HTTP-only cookies)
POST   /api/v1/auth/refresh           Rotate tokens
POST   /api/v1/auth/logout            Logout
POST   /api/v1/auth/forgot-password   Request password reset

GET    /api/v1/users/:id              Get profile (cached 5min)
PUT    /api/v1/users/me               Update profile
POST   /api/v1/users/upload-avatar    Upload profile picture (Multer)
DELETE /api/v1/users/me               Soft-delete account
```

### Post/Feed Service
```
POST   /api/v1/posts                  Create post (supports image upload)
GET    /api/v1/posts/:id              Get post by ID
PUT    /api/v1/posts/:id              Update post
DELETE /api/v1/posts/:id              Soft-delete post

POST   /api/v1/posts/:id/like         Like a post
POST   /api/v1/posts/:id/comments     Add comment

GET    /api/v1/feed?cursor=&limit=    GLOBAL FEED (Cursor-based, cached 2min)
```

### Chat Service
```
POST   /api/v1/chat/start             Start or resume a chat
GET    /api/v1/chat/active            Get inbox (cached 60s)
GET    /api/v1/chat/:roomId/history   Chat history (paginated)

WS     socket.io connect              Real-time events: send_message / receive_message
```

### Notification Service
```
GET    /api/v1/notifications          Get notifications (paginated)
GET    /api/v1/notifications/unread-count (Redis cached)
POST   /api/v1/notifications/mark-read Mark all as read
```

### Admin Service (Consolidated)
```
POST   /api/v1/admin/auth/login           Admin login
POST   /api/v1/admin/auth/register-staff  Staff creation (SUPER_ADMIN)

GET    /api/v1/admin/users                List all users (cached 30s)
PUT    /api/v1/admin/users/:id/suspend    Suspend user
DELETE /api/v1/admin/users/:id/hard      Hard-delete user (SUPER_ADMIN)

GET    /api/v1/admin/posts                List all posts (cached 30s)
PUT    /api/v1/admin/posts/:id/hide       Hide post
DELETE /api/v1/admin/posts/:id/hard      Hard-delete post (SUPER_ADMIN)
```

---

## Swagger Documentation

All NestJS services expose Swagger UI at:
- Post Service: `http://localhost:80/api/v1/posts/docs` (proxied) or `http://localhost:3002/api/v1/docs`
- Notification Service: `http://localhost:80/api/v1/notifications/docs` or `http://localhost:3004/api/v1/docs`

---

## Static Assets

Images are served by **NGINX** for maximum performance:
- Profile photos: `/uploads/profiles/filename.jpg`
- Post images: `/uploads/posts/filename.jpg`
