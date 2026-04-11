# auth-service

Express.js microservice for authentication and user management.

## Tech Stack
- **Runtime**: Node.js 18 + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL via Prisma ORM
- **Cache**: Redis (user profile caching)
- **Auth**: JWT (15-min access token + 7-day refresh token rotation)
- **Validation**: Zod schemas
- **Logging**: Pino (structured JSON)

## Environment Variables

| Variable          | Required | Description                        |
|-------------------|----------|------------------------------------|
| `DATABASE_URL`    | ✅       | PostgreSQL connection string        |
| `JWT_SECRET`      | ✅       | Shared JWT signing secret          |
| `REDIS_URL`       | ✅       | Redis connection URL               |
| `SMTP_HOST`       | ✅       | SMTP server hostname               |
| `SMTP_PORT`       | ✅       | SMTP port (usually 587)            |
| `SMTP_USER`       | ✅       | SMTP login email                   |
| `SMTP_PASS`       | ✅       | SMTP app password                  |
| `PORT`            | ❌       | HTTP port (default: 3001)          |
| `LOG_LEVEL`       | ❌       | Pino log level (default: info)     |
| `ALLOWED_ORIGINS` | ❌       | Comma-separated allowed CORS URLs  |
| `APP_URL`         | ❌       | Base URL for email verification links |

## API Endpoints

```
POST   /api/v1/auth/register           Register new user (rate-limited)
POST   /api/v1/auth/login              Login → sets httpOnly cookies (rate-limited)
POST   /api/v1/auth/refresh            Rotate access + refresh tokens
POST   /api/v1/auth/verify-email       Verify email via token
POST   /api/v1/auth/forgot-password    Send password reset email (rate-limited)
POST   /api/v1/auth/reset-password     Set new password (rate-limited)
POST   /api/v1/auth/logout             Clear cookies
GET    /api/v1/auth/me                 Get current user (requires JWT)

GET    /api/v1/users/me                Get own profile (cached 5min)
PUT    /api/v1/users/me                Update profile (cache invalidated)
DELETE /api/v1/users/me                Soft-delete account
POST   /api/v1/users/:id/block         Block user (cache invalidated)
POST   /api/v1/users/:id/unblock       Unblock user
PUT    /api/v1/users/:id/role          Assign role (ADMIN/SUPER_ADMIN only)

GET    /health                         Health check
```

## Security Features
- **Rate Limiting**: Global 200 req/15min; Auth endpoints 10 req/15min
- **Helmet**: Secure HTTP headers on all responses
- **CORS**: Explicit allowed origins in production
- **JWT Rotation**: Short-lived 15min access tokens + rotating 7-day refresh tokens
- **Cookie Scoping**: Refresh token cookie scoped to `/api/v1/auth/refresh` path only
- **Timing-Safe Auth**: Dummy bcrypt comparison prevents user enumeration timing attacks
- **Input Validation**: All endpoints validated with Zod schemas
- **Payload Limit**: Request body capped at 10kb

## Development

```bash
npm run dev         # Start with ts-node-dev, hot reload
npm run build       # Compile TypeScript to dist/
npm start           # Run compiled output
npx prisma migrate dev --name migration_name   # Create a migration
npx prisma studio   # Open Prisma Studio GUI
```
