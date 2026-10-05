# Go Gin + MongoDB Boilerplate — Walkthrough

## What Was Built

A production-grade, fully scaffolded REST API in Go using **Gin** + **MongoDB**, following **Hexagonal Architecture** with a layered handler → service → repository pattern.

---

## Complete File Tree

```
solartech.server/
├── cmd/
│   └── api/
│       └── main.go                    # Entrypoint, DI wiring, graceful shutdown
├── config/
│   └── config.go                      # Type-safe env config loader
├── internal/
│   ├── domain/
│   │   └── models.go                  # Pure domain entities (User, Role, RefreshToken)
│   ├── ports/
│   │   └── ports.go                   # Hexagonal interfaces (repositories + services)
│   ├── adapters/
│   │   ├── handlers/
│   │   │   ├── auth_handler.go        # Auth HTTP handlers (register/login/refresh/logout/me)
│   │   │   ├── user_handler.go        # User HTTP handlers (CRUD + role change)
│   │   │   └── router.go             # Gin router, CORS, health, Swagger, RBAC wiring
│   │   └── repositories/
│   │       ├── user_repository.go     # MongoDB user repository
│   │       ├── token_repository.go    # MongoDB refresh token repository
│   │       └── role_repository.go     # MongoDB role repository
│   ├── services/
│   │   ├── auth_service.go            # Auth business logic (JWT, rotation, hashing)
│   │   └── user_service.go           # User business logic (profile, role change)
│   └── middleware/
│       ├── auth.go                    # JWT Bearer auth + OptionalAuth + SelfOrRole
│       ├── rbac.go                    # RequirePermission (DB) + RequireRole (JWT claim)
│       ├── rate_limiter.go            # Per-IP token-bucket rate limiter
│       └── logger.go                  # RequestID, structured Logger, Recovery
├── pkg/
│   ├── database/
│   │   └── mongo.go                   # Connection pool, index setup, graceful disconnect
│   ├── jwt/
│   │   └── jwt.go                     # Dual-secret JWT (access + refresh)
│   ├── crypto/
│   │   └── password.go               # bcrypt hash + verify
│   ├── logger/
│   │   └── logger.go                  # Zap singleton with JSON/console modes
│   ├── apperror/
│   │   └── errors.go                  # Typed errors with HTTP status mapping
│   └── response/
│       └── response.go               # Unified JSON envelope helpers
├── docs/
│   └── swagger.go                     # Swaggo annotations entry file
├── scripts/
│   ├── seed/
│   │   └── main.go                    # Idempotent DB seed (roles + admin user)
│   └── mongo-init.js                  # MongoDB schema validation + app user creation
├── .github/
│   └── workflows/
│       └── ci-cd.yml                  # GitHub Actions: lint → test → build → deploy
├── .air.toml                          # Air hot-reload config
├── .env.example                       # All env vars documented
├── .gitignore
├── .golangci.yml                      # golangci-lint config (15+ linters)
├── Dockerfile                         # Multi-stage scratch image
├── docker-compose.yml                 # API + MongoDB + optional Mongo Express
└── Makefile                           # build/run/dev/test/lint/swagger/seed/docker
```

---

## Architecture Decisions

### Hexagonal (Ports & Adapters)
- **Ports** ([internal/ports/ports.go](file:///C:/Users/leado/Desktop/Projects/Client/solartech.server/internal/ports/ports.go)) define interfaces that both services and repositories implement. Business logic never imports Gin or MongoDB packages.
- **Adapters** live in `internal/adapters/` — repositories talk to MongoDB, handlers talk to Gin. They can be swapped independently.

### Two RBAC Strategies
| Strategy | Middleware | Latency | Flexibility |
|---|---|---|---|
| Claim-based | `RequireRole("admin")` | Zero DB calls | Coarse-grained |
| Permission-based | `RequirePermission(roleRepo, "users:export")` | One DB read | Fine-grained |

### JWT Token Rotation
Old refresh token is **deleted before** issuing a new one. If the same token is presented twice, the second caller gets 401. This detects token theft with single-use semantics.

### MongoDB TTL Index
`refresh_tokens.expires_at` has a `SetExpireAfterSeconds(0)` index — MongoDB's background job automatically purges expired tokens with no application code needed.

### Error Strategy
All errors flow through `pkg/apperror`. Each error carries:
- `Kind` → HTTP status code mapping
- `Code` → machine-readable string (e.g. `USER_NOT_FOUND`)
- `Message` → safe human-readable client string
- `Err` → internal root cause (never serialised to client)

---

## How to Run Locally

```bash
# 1. Copy and fill environment variables
cp .env.example .env

# 2. Start MongoDB
docker compose up -d mongo

# 3. Install Go dependencies
make tidy

# 4. Seed roles and admin user
make seed

# 5a. Hot-reload (install air first: go install github.com/air-verse/air@latest)
make dev

# 5b. OR build and run
make run
```

**Swagger UI** → http://localhost:8080/swagger/index.html  
**Health check** → http://localhost:8080/health

```bash
# Generate / regenerate Swagger docs
make swagger

# Run with full Docker stack (API + Mongo)
make docker-up
```

---

## Key Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | Public | Register new user |
| POST | `/api/v1/auth/login` | Public | Login, get token pair |
| POST | `/api/v1/auth/refresh` | Public | Rotate tokens |
| POST | `/api/v1/auth/logout` | Bearer | Revoke refresh token |
| GET  | `/api/v1/auth/me` | Bearer | Current user info |
| GET  | `/api/v1/users` | Bearer + Admin | Paginated user list |
| GET  | `/api/v1/users/:id` | Bearer + Self/Admin | Get user |
| PATCH| `/api/v1/users/:id` | Bearer + Self/Admin | Update profile |
| PUT  | `/api/v1/users/:id/role` | Bearer + Admin | Change role |
| DELETE | `/api/v1/users/:id` | Bearer + Admin | Delete user |
| GET  | `/health` | Public | Health check |
| GET  | `/swagger/*` | Public | Swagger UI |

---

## Scalability Notes

1. **Connection Pooling**: `MaxPoolSize=100, MinPoolSize=10` in MongoDB opts — tune based on `mongotop` metrics.
2. **Stateless Services**: No in-process state — horizontal scaling is `docker service scale api=N`.
3. **Rate Limiting at Scale**: Replace the in-process `sync.Map` store with a Redis sliding window for cluster-wide limits.
4. **RBAC Caching**: `RequirePermission` makes one DB read per request — add a short TTL cache (e.g. `sync.Map + TTL` or Redis) for roles in hot paths.
5. **Config over Code**: All tunable parameters (pool sizes, TTLs, rate limits) come from env vars — zero binary changes needed for environment-specific tuning.
