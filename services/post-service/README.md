# post-service

NestJS microservice for posts, interactions, and feed.

## Tech Stack
- **Runtime**: Node.js 18 + TypeScript
- **Framework**: NestJS
- **Database**: MongoDB via Mongoose
- **Cache**: Redis (cursor-based feed caching, 2-min TTL)
- **Auth**: JWT guard (offline verification, no cross-service calls)
- **Validation**: class-validator + class-transformer DTOs

## Environment Variables

| Variable    | Required | Description                          |
|-------------|----------|--------------------------------------|
| `MONGO_URI` | ✅       | MongoDB connection string            |
| `JWT_SECRET`| ✅       | Shared JWT signing secret            |
| `REDIS_URL` | ✅       | Redis connection URL                 |
| `PORT`      | ❌       | HTTP port (default: 3002)            |

## API Endpoints

```
POST   /api/v1/posts                    Create post
GET    /api/v1/posts/:id                Get by ID
PUT    /api/v1/posts/:id                Update (author only)
DELETE /api/v1/posts/:id                Soft-delete (author only)

POST   /api/v1/posts/:id/like           Like (idempotent via unique index)
DELETE /api/v1/posts/:id/like           Unlike
POST   /api/v1/posts/:id/comments       Add comment
GET    /api/v1/posts/:id/comments       Get comments (paginated)

GET    /api/v1/feed?cursor=&limit=      Cursor-based global feed (cached 2min)
```

## Performance Highlights

### Cursor-Based Feed Pagination
Uses MongoDB `_id` as cursor instead of `skip()`:
```
GET /api/v1/feed?limit=20
GET /api/v1/feed?cursor=<nextCursor>&limit=20
```
Response: `{ data, meta: { nextCursor, hasMore, limit } }`

**Why cursor vs offset?** `skip(N)` scans N documents. At 1M records, offset pagination is O(N). Cursor-based is O(log N) via compound index.

### DB Indexes (MongoDB)
```typescript
{ isDeleted: 1, createdAt: -1 }          // Feed queries
{ _id: 1, createdAt: -1 }                // Cursor pagination
{ authorId: 1, isDeleted: 1, createdAt: -1 } // Per-user feed
```

## Development
```bash
npm run start:dev   # Hot reload
npm run build       # Compile
npm start           # Run compiled
```
