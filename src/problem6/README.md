# Real-time Scoreboard Module Specification

## Overview

This module implements a secure, real-time scoreboard system that displays the top 10 users' scores with live updates. The system ensures authorized score updates while preventing malicious manipulation.

---

## Architecture Components

### 1. Core Services

#### **Score Update Service**
- **Endpoint**: `POST /api/scores/update`
- **Purpose**: Handles authorized score updates from user actions
- **Authentication**: Required (JWT token)
- **Rate Limiting**: Applied per user

#### **Scoreboard Query Service**
- **Endpoint**: `GET /api/scores/leaderboard`
- **Purpose**: Retrieves top 10 users with highest scores
- **Caching**: Redis cache with TTL
- **Real-time**: WebSocket subscription available

#### **Real-time Broadcast Service**
- **Protocol**: WebSocket (`wss://api.domain.com/scores/live`)
- **Purpose**: Pushes scoreboard updates to connected clients
- **Channel**: `scoreboard:top10`

### 2. Data Layer

#### **Database Schema** (PostgreSQL recommended)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scores (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    score BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_score UNIQUE (user_id)
);

CREATE INDEX idx_scores_score_desc ON scores(score DESC);
CREATE INDEX idx_scores_user_id ON scores(user_id);

CREATE TABLE score_updates (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    action_id UUID NOT NULL,
    points_earned INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    CONSTRAINT unique_action UNIQUE (action_id)
);

CREATE INDEX idx_score_updates_user_timestamp ON score_updates(user_id, timestamp DESC);
```

#### **Cache Layer** (Redis)

```
Key Structure:
- scoreboard:top10 -> Sorted Set (ZSET) of {user_id: score}
- user:score:{user_id} -> Hash of user score data
- ratelimit:score:{user_id} -> String with TTL (rate limiting)
- action:processed:{action_id} -> String with TTL (idempotency)
```

---

## API Specification

### 1. Update Score Endpoint

**Request:**
```http
POST /api/scores/update
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "action_id": "550e8400-e29b-41d4-a716-446655440000",
  "action_type": "quest_completed",
  "points": 100,
  "metadata": {
    "quest_name": "First Steps",
    "difficulty": "easy"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "new_score": 1500,
    "points_earned": 100,
    "rank": 7,
    "rank_changed": true
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_ACTION",
    "message": "Action has already been processed",
    "details": "action_id must be unique"
  }
}
```

### 2. Get Leaderboard Endpoint

**Request:**
```http
GET /api/scores/leaderboard?limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user_id": "uuid-1",
        "username": "player_pro",
        "score": 15000,
        "last_updated": "2025-10-30T10:30:00Z"
      },
      {
        "rank": 2,
        "user_id": "uuid-2",
        "username": "epic_gamer",
        "score": 12500,
        "last_updated": "2025-10-30T10:25:00Z"
      }
      // ... up to rank 10
    ],
    "updated_at": "2025-10-30T10:30:15Z",
    "cache_ttl": 5
  }
}
```

### 3. WebSocket Real-time Updates

**Connection:**
```javascript
const ws = new WebSocket('wss://api.domain.com/scores/live');
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'scoreboard:top10',
  auth_token: 'jwt_token_here'
}));
```

**Message Format:**
```json
{
  "type": "scoreboard_update",
  "channel": "scoreboard:top10",
  "data": {
    "leaderboard": [...],
    "changes": [
      {
        "user_id": "uuid-3",
        "username": "rising_star",
        "old_rank": 12,
        "new_rank": 9,
        "score": 8500
      }
    ],
    "timestamp": "2025-10-30T10:30:15Z"
  }
}
```

---

## Execution Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                               │
└─────────────────────────────────────────────────────────────────────┘
         │                                              │
         │ (1) User completes action                    │ (8) WebSocket
         │     POST /api/scores/update                  │     connection
         │     + JWT Token                              │     subscribed
         │                                              │
         ▼                                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       API GATEWAY / LOAD BALANCER                    │
│                    - SSL Termination                                 │
│                    - DDoS Protection                                 │
└─────────────────────────────────────────────────────────────────────┘
         │                                              │
         │ (2)                                          │
         ▼                                              ▼
┌──────────────────────────┐              ┌─────────────────────────┐
│   AUTHENTICATION         │              │   WEBSOCKET SERVICE      │
│   MIDDLEWARE             │              │   - Connection Manager   │
│   - Verify JWT           │              │   - Channel Subscriber   │
│   - Extract user_id      │              └─────────────────────────┘
└──────────────────────────┘                          │
         │                                            │
         │ (3) Authenticated                          │ (9) Subscribe
         ▼                                            │     to Redis
┌──────────────────────────┐                          │     PubSub
│   RATE LIMITER           │                          ▼
│   - Check Redis          │              ┌─────────────────────────┐
│   - 10 req/min per user  │◄────────────►│      REDIS CACHE         │
└──────────────────────────┘              │  - Rate limit counters   │
         │                                │  - Scoreboard cache      │
         │ (4) Within limits              │  - PubSub channels       │
         ▼                                └─────────────────────────┘
┌──────────────────────────┐                          │
│   SCORE UPDATE SERVICE   │                          │
│   ┌──────────────────┐   │                          │
│   │ Validate Request │   │                          │
│   │ - action_id      │   │                          │
│   │ - points range   │   │                          │
│   │ - action_type    │   │                          │
│   └──────────────────┘   │                          │
│            │             │                          │
│            │ (5)         │                          │
│            ▼             │                          │
│   ┌──────────────────┐   │                          │
│   │ Idempotency Check│   │                          │
│   │ - Check action_id│   │                          │
│   │   in Redis/DB    │   │                          │
│   └──────────────────┘   │                          │
│            │             │                          │
│            │ (6) New action                         │
│            ▼             │                          │
│   ┌──────────────────┐   │                          │
│   │ Database TX      │◄──┼──────────────────────────┘
│   │ - Insert into    │   │           ▲
│   │   score_updates  │   │           │
│   │ - Update scores  │   │           │
│   │ - Get new rank   │   │           │
│   └──────────────────┘   │           │
└──────────────────────────┘           │
         │                             │
         │ (7) Commit successful       │
         ▼                             │
┌──────────────────────────────────────┴──────┐
│   BACKGROUND JOB / EVENT HANDLER             │
│   ┌──────────────────────────────────┐       │
│   │ On Score Update:                 │       │
│   │ 1. Update Redis scoreboard cache │       │
│   │ 2. Check if top 10 changed       │       │
│   │ 3. Publish to Redis PubSub       │       │
│   └──────────────────────────────────┘       │
└──────────────────────────────────────────────┘
         │
         │ (10) Broadcast update
         ▼
┌──────────────────────────┐
│    POSTGRESQL DB          │
│  - users table           │
│  - scores table          │
│  - score_updates table   │
└──────────────────────────┘

         │
         │ (11) WebSocket push to all clients
         ▼
┌─────────────────────────────────────────────┐
│        ALL CONNECTED CLIENTS                 │
│        - Receive scoreboard update           │
│        - Re-render top 10 list               │
└─────────────────────────────────────────────┘
```

### Flow Description

1. **User Action**: User completes an action on the frontend, triggering a POST request to `/api/scores/update` with JWT authentication
2. **API Gateway**: Request passes through load balancer with SSL termination and DDoS protection
3. **Authentication**: Middleware validates JWT token and extracts user_id
4. **Rate Limiting**: Redis-based rate limiter checks if user is within allowed request frequency (e.g., 10 requests/minute)
5. **Request Validation**: Service validates the action_id, points range, and action_type
6. **Idempotency Check**: System verifies action_id hasn't been processed before (prevents replay attacks)
7. **Database Transaction**:
   - Insert record into score_updates table
   - Update user's total score in scores table
   - Calculate new rank
8. **Cache Update**: Background job updates Redis scoreboard cache
9. **PubSub Publish**: If top 10 changed, publish update to Redis PubSub channel
10. **WebSocket Broadcast**: WebSocket service receives PubSub message and broadcasts to all subscribed clients
11. **Client Update**: Connected clients receive real-time update and re-render leaderboard

---

## Security Measures

### 1. Authentication & Authorization
- **JWT Token Validation**: Every score update request must include a valid JWT token
- **Token Claims**: Include user_id, issued_at, expires_at, and optional action permissions
- **Short-lived Tokens**: Access tokens expire in 15 minutes; refresh tokens in 7 days

### 2. Idempotency Protection
- **Unique Action IDs**: Each action must have a unique UUID (action_id)
- **Deduplication**: Store processed action_ids in Redis (24-hour TTL) and database
- **Prevents Replay Attacks**: Same action cannot increase score multiple times

### 3. Rate Limiting
- **User-level Limits**: 10 score updates per minute per user
- **IP-level Limits**: 100 requests per minute per IP (prevents distributed attacks)
- **Adaptive Rate Limiting**: Automatically reduce limits for suspicious patterns

### 4. Input Validation
- **Points Range**: Validate points earned are within expected range for action_type
- **Action Type Whitelist**: Only allow predefined action types
- **Schema Validation**: Use JSON schema validation for all request payloads

### 5. Server-side Verification
- **Action Validation**: Backend verifies action completion (don't trust client)
- **Cross-reference**: Check game state/session data to confirm action legitimacy
- **Cryptographic Signatures**: For critical actions, require signed payloads from game engine

### 6. Monitoring & Anomaly Detection
- **Fraud Detection**: Flag users with abnormal scoring patterns
- **Audit Logging**: Log all score updates with IP, user-agent, and timestamp
- **Alert System**: Notify admins of suspicious activity (e.g., sudden score spikes)

---

## Performance Optimization

### 1. Caching Strategy
- **Redis Cache**: Store top 10 scoreboard with 5-second TTL
- **Cache Invalidation**: Update cache only when top 10 changes
- **Read-through Cache**: Serve from cache, rebuild from DB on miss

### 2. Database Optimization
- **Indexed Queries**: B-tree index on scores(score DESC) for fast leaderboard queries
- **Materialized Views**: Pre-compute top 100 rankings, refresh every 10 seconds
- **Partitioning**: Partition score_updates table by timestamp for efficient archival

### 3. WebSocket Optimization
- **Connection Pooling**: Reuse WebSocket connections
- **Message Batching**: Batch multiple updates within 500ms window
- **Selective Broadcasting**: Only send updates when top 10 actually changes

### 4. Horizontal Scaling
- **Stateless API Servers**: Run multiple instances behind load balancer
- **Redis Cluster**: Shard cache across multiple Redis nodes
- **Database Read Replicas**: Offload scoreboard queries to read replicas

---

## Implementation Guidelines

### Technology Stack Recommendations

**Backend Framework:**
- Node.js (Express/Fastify) + TypeScript
- Go (Gin/Fiber) for high performance
- Python (FastAPI) with async support

**Database:**
- PostgreSQL (primary choice for ACID compliance)
- TimescaleDB extension for time-series score_updates data

**Cache & PubSub:**
- Redis (version 6+) with Redis Streams or PubSub

**WebSocket:**
- Socket.io (Node.js)
- Gorilla WebSocket (Go)
- FastAPI WebSockets (Python)

**Message Queue (Optional for high load):**
- RabbitMQ or Apache Kafka for decoupling score processing

### Code Structure

```
src/
├── controllers/
│   ├── scoreController.ts
│   └── leaderboardController.ts
├── services/
│   ├── scoreUpdateService.ts
│   ├── leaderboardService.ts
│   └── websocketService.ts
├── middleware/
│   ├── authMiddleware.ts
│   ├── rateLimitMiddleware.ts
│   └── validationMiddleware.ts
├── models/
│   ├── Score.ts
│   ├── User.ts
│   └── ScoreUpdate.ts
├── repositories/
│   ├── scoreRepository.ts
│   └── userRepository.ts
├── cache/
│   └── redisClient.ts
├── validators/
│   └── scoreUpdateSchema.ts
├── utils/
│   ├── idempotency.ts
│   ├── encryption.ts
│   └── anomalyDetection.ts
└── websocket/
    ├── connectionManager.ts
    └── channelHandlers.ts
```

### Key Implementation Details

#### Score Update Service (Pseudocode)

```typescript
async function updateScore(userId: string, actionId: string, points: number) {
  // 1. Idempotency check
  if (await isActionProcessed(actionId)) {
    throw new Error('ACTION_ALREADY_PROCESSED');
  }

  // 2. Validate points for action type
  if (!isValidPointsForAction(actionType, points)) {
    throw new Error('INVALID_POINTS');
  }

  // 3. Database transaction
  const result = await db.transaction(async (tx) => {
    // Insert audit record
    await tx.scoreUpdates.insert({
      userId,
      actionId,
      pointsEarned: points,
      timestamp: new Date(),
      ipAddress: request.ip,
      userAgent: request.headers['user-agent']
    });

    // Update user score
    const newScore = await tx.scores.update({
      where: { userId },
      data: {
        score: { increment: points },
        updatedAt: new Date()
      }
    });

    return newScore;
  });

  // 4. Mark action as processed (Redis with 24h TTL)
  await markActionAsProcessed(actionId);

  // 5. Update cache and check if top 10 changed
  const top10Changed = await updateLeaderboardCache(userId, result.score);

  // 6. Broadcast if needed
  if (top10Changed) {
    await publishLeaderboardUpdate();
  }

  return result;
}
```

#### Leaderboard Cache Update

```typescript
async function updateLeaderboardCache(userId: string, newScore: number) {
  // Update sorted set
  await redis.zadd('scoreboard:top10', newScore, userId);

  // Keep only top 10
  await redis.zremrangebyrank('scoreboard:top10', 0, -11);

  // Check if user is in top 10
  const rank = await redis.zrevrank('scoreboard:top10', userId);

  // Set cache TTL
  await redis.expire('scoreboard:top10', 5);

  return rank !== null && rank < 10;
}
```

---

## Testing Strategy

### 1. Unit Tests
- Service layer logic (score calculation, validation)
- Idempotency checks
- Rate limiting logic

### 2. Integration Tests
- Database transactions
- Redis cache operations
- WebSocket message broadcasting

### 3. Load Tests
- Simulate 10,000 concurrent users
- Test rate limiting under high load
- Verify cache hit rates > 95%

### 4. Security Tests
- Attempt replay attacks with duplicate action_ids
- Test JWT token validation and expiration
- Verify rate limiting prevents abuse
- Penetration testing for injection vulnerabilities

---

## Deployment Considerations

### Environment Variables
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://user:pass@host:6379
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=15m
RATE_LIMIT_WINDOW=60s
RATE_LIMIT_MAX_REQUESTS=10
WEBSOCKET_PORT=8080
API_PORT=3000
NODE_ENV=production
```

### Monitoring & Observability
- **Metrics**: Prometheus + Grafana for tracking request rates, latency, cache hit rates
- **Logging**: Structured logging (JSON) with correlation IDs
- **Tracing**: Distributed tracing with OpenTelemetry or Jaeger
- **Alerts**: PagerDuty/Opsgenie for critical failures

---

## Improvement Suggestions

### 1. **Enhanced Security**
- **Challenge-Response System**: For high-value actions, implement a server-generated challenge that client must solve before score update is accepted
- **Behavioral Analysis**: Use machine learning to detect bot-like scoring patterns
- **Threshold-based Manual Review**: Flag users who gain more than X points in Y timeframe for manual review
- **Hardware-based Attestation**: Use WebAuthn or similar for proving client integrity

### 2. **Scalability Enhancements**
- **Event Sourcing**: Instead of direct score updates, emit events and use event sourcing for better audit trails and replay capability
- **CQRS Pattern**: Separate read model (leaderboard queries) from write model (score updates)
- **GraphQL Subscriptions**: Alternative to WebSocket for real-time updates with better client flexibility
- **Edge Caching**: Use CDN edge locations to cache leaderboard for global users

### 3. **Feature Additions**
- **Historical Leaderboards**: Daily/weekly/monthly leaderboards with reset schedules
- **Regional Leaderboards**: Partition by geography for localized competition
- **Friend Leaderboards**: Show rankings among user's friends
- **Achievement System**: Integrate badges/achievements with score milestones
- **Score Decay**: Implement time-based score decay to encourage ongoing engagement

### 4. **User Experience**
- **Optimistic Updates**: Show score change immediately on client, rollback if server rejects
- **Delta Indicators**: Show "+100" animation when user's score increases
- **Rank Change Notifications**: Notify users when they enter/leave top 10
- **Percentile Rankings**: Show users their percentile rank (e.g., "Top 5% of players")

### 5. **Operational Improvements**
- **Admin Dashboard**: Real-time monitoring of score updates, fraud detection alerts
- **Score Rollback API**: Allow admins to manually rollback fraudulent score increases
- **A/B Testing Framework**: Test different point values for actions
- **Analytics Pipeline**: Stream score_updates to data warehouse for business intelligence

### 6. **Performance Tuning**
- **Database Connection Pooling**: Use pgBouncer for PostgreSQL connection pooling
- **Prepared Statements**: Pre-compile frequently used queries
- **Lazy Leaderboard Updates**: Only update top 10 cache when a score enters the threshold
- **WebSocket Message Compression**: Use permessage-deflate for bandwidth optimization

### 7. **Disaster Recovery**
- **Multi-region Deployment**: Active-active or active-passive setup across regions
- **Database Replication**: Streaming replication with automatic failover
- **Backup Strategy**: Automated daily backups with point-in-time recovery
- **Chaos Engineering**: Regularly test failure scenarios (database down, Redis unavailable)

---

## Known Limitations & Trade-offs

1. **5-second Cache TTL**: Balances real-time updates with database load; may show slightly stale data
2. **Top 10 Only**: Fetching larger leaderboards requires additional caching strategy
3. **WebSocket Scalability**: May need dedicated WebSocket server cluster for >100k concurrent connections
4. **Action Validation**: Requires game engine integration; adds complexity to maintain action registry
5. **Global Leaderboard**: Large user base may require sharding strategy for top 10 calculation

---

## Glossary

- **JWT (JSON Web Token)**: Compact, URL-safe token for authentication
- **Idempotency**: Property ensuring same operation produces same result even if called multiple times
- **WebSocket**: Protocol providing full-duplex communication over single TCP connection
- **PubSub**: Publish-subscribe messaging pattern for decoupled communication
- **ZSET (Sorted Set)**: Redis data structure storing unique elements with associated scores
- **TTL (Time To Live)**: Expiration time for cached data
- **ACID**: Atomicity, Consistency, Isolation, Durability - database transaction properties

---

## References & Further Reading

- [WebSocket Protocol RFC 6455](https://tools.ietf.org/html/rfc6455)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Redis Sorted Sets](https://redis.io/topics/data-types#sorted-sets)
- [Rate Limiting Strategies](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-30
**Author**: System Architect
**Target Audience**: Backend Engineering Team
