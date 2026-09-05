# Real-Time Analytics & Event Pipeline

A real-time event analytics pipeline built with **NestJS, Apache Kafka, MongoDB, Redis, WebSockets, Socket.IO, and Docker**.

The system accepts application events through a REST API, publishes them to Kafka, processes them asynchronously through a Kafka consumer, persists events in MongoDB, maintains real-time analytics aggregates in Redis, and broadcasts updated metrics to connected dashboard clients through WebSockets.

---

## Architecture

```text
                         ┌─────────────────────┐
                         │   Client / Producer  │
                         │   REST API Request   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      NestJS API     │
                         │     POST /events    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │        Kafka        │
                         │  analytics-events   │
                         │     3 partitions    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Analytics Consumer   │
                         │  Kafka Consumer      │
                         └──────────┬──────────┘
                                    │
                       ┌────────────┼────────────┐
                       │            │            │
                       ▼            ▼            ▼
                ┌────────────┐ ┌──────────┐ ┌──────────┐
                │  MongoDB   │ │  Redis   │ │   Redis  │
                │ Raw Events │ │ Metrics  │ │ Dedup    │
                └────────────┘ └────┬─────┘ └──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Analytics WebSocket │
                         │      Gateway        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Live Dashboard    │
                         │     Socket.IO       │
                         └─────────────────────┘
```

---

## How It Works

### 1. Event ingestion

Clients send events through the REST API:

```http
POST /events
Content-Type: application/json
```

Example:

```json
{
  "eventId": "event-001",
  "type": "page_view",
  "userId": "user-123",
  "timestamp": "2026-09-06T00:00:00.000Z"
}
```

The API publishes the event to the Kafka topic:

```text
analytics-events
```

---

### 2. Kafka event streaming

Kafka acts as the event streaming layer between the API and analytics processing.

The project uses a Kafka topic with multiple partitions so event processing can be distributed as the system scales.

The API does not directly perform the analytics work.

Instead:

```text
HTTP Request
     ↓
Kafka
     ↓
Consumer
```

This keeps event ingestion separate from downstream processing.

---

### 3. Analytics consumer

The Kafka consumer receives events asynchronously.

For every event, the consumer:

1. Checks whether the event was already processed.
2. Ignores duplicate events.
3. Persists the event in MongoDB.
4. Updates Redis analytics counters.
5. Calculates the latest metrics.
6. Broadcasts the updated metrics through WebSockets.

---

### 4. MongoDB persistence

MongoDB stores the raw event data.

Stored fields include:

```text
eventId
type
userId
timestamp
metadata
createdAt
updatedAt
```

The `eventId` is unique and indexed to support reliable event identification and prevent duplicate records.

Events also use a TTL index based on `createdAt` so old event records can automatically expire after the configured retention period.

Current retention:

```text
24 hours
```

This keeps the raw event collection from growing indefinitely.

---

### 5. Redis analytics

Redis maintains hot analytics aggregates for fast reads.

The pipeline tracks:

```text
Total Events
Page Views
Purchases
Signups
Unique Users
```

Example analytics response:

```json
{
  "totalEvents": 5000,
  "pageViews": 1667,
  "purchases": 1667,
  "signups": 1666,
  "uniqueUsers": 1000
}
```

Redis is used for these frequently changing metrics instead of repeatedly calculating aggregates from the MongoDB event collection.

---

### 6. Idempotent event processing

The pipeline uses Redis to maintain short-lived event-processing keys:

```text
event:processed:<eventId>
```

When an event arrives:

```text
Event
  ↓
Already processed?
  ├── Yes → Ignore
  └── No
       ↓
 Mark processed
       ↓
 MongoDB
       ↓
 Redis metrics
       ↓
 WebSocket
```

The processing marker uses:

```text
NX
```

so only the first processing attempt successfully creates the key.

The deduplication key has a TTL of 24 hours.

This prevents the same event from incrementing analytics multiple times when duplicate delivery occurs within the retention window.

---

## Real-Time Dashboard

The project includes a lightweight browser dashboard.

It displays:

* Total Events
* Page Views
* Purchases
* Signups
* Unique Users
* WebSocket connection status

When a new event is processed, the backend broadcasts:

```text
analytics:update
```

The dashboard updates automatically without requiring a page refresh.

---

## API

### Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "service": "real-time-analytics-pipeline"
}
```

---

### Publish Event

```http
POST /events
```

Example:

```json
{
  "eventId": "event-001",
  "type": "page_view",
  "userId": "user-123",
  "timestamp": "2026-09-06T00:00:00.000Z"
}
```

Response:

```json
{
  "status": "published"
}
```

---

### Analytics Metrics

```http
GET /analytics
```

Returns the current Redis-backed analytics aggregates.

---

## Event Types

The current analytics pipeline tracks:

```text
page_view
purchase
signup
```

The event model also supports optional metadata for extending the event schema.

Example:

```json
{
  "eventId": "event-002",
  "type": "purchase",
  "userId": "user-456",
  "timestamp": "2026-09-06T00:00:00.000Z",
  "metadata": {
    "productId": "product-123",
    "amount": 499
  }
}
```

---

## Technology Stack

| Technology     | Purpose                                 |
| -------------- | --------------------------------------- |
| NestJS         | Backend application and REST APIs       |
| TypeScript     | Application development                 |
| Apache Kafka   | Event streaming                         |
| KafkaJS        | Kafka client                            |
| MongoDB        | Raw event persistence                   |
| Mongoose       | MongoDB integration                     |
| Redis          | Real-time aggregation and deduplication |
| ioredis        | Redis client                            |
| Socket.IO      | Real-time communication                 |
| WebSockets     | Live dashboard updates                  |
| Docker Compose | Local infrastructure                    |
| Node.js        | Runtime                                 |

---

## Project Structure

```text
real-time-analytics-pipeline/
│
├── src/
│   ├── analytics/
│   │   ├── analytics.controller.ts
│   │   ├── analytics.module.ts
│   │   └── analytics.service.ts
│   │
│   ├── events/
│   │   ├── schemas/
│   │   │   └── event.schema.ts
│   │   ├── events.controller.ts
│   │   ├── events.module.ts
│   │   └── events.service.ts
│   │
│   ├── kafka/
│   │   ├── kafka.module.ts
│   │   └── kafka.service.ts
│   │
│   ├── redis/
│   │   ├── redis.module.ts
│   │   └── redis.service.ts
│   │
│   ├── websocket/
│   │   ├── analytics.gateway.ts
│   │   └── websocket.module.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── scripts/
│   └── load-generator.ts
│
├── docker-compose.yml
├── websocket-test.html
├── .env.example
├── package.json
└── README.md
```

---

## Running the Project

### Prerequisites

Install:

* Node.js
* npm
* Docker Desktop
* Git

---

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
cd real-time-analytics-pipeline
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Configure environment variables

Create a `.env` file from `.env.example`.

Example:

```env
PORT=3000

KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC=analytics-events
KAFKA_GROUP_ID=analytics-consumer-group

MONGODB_URI=mongodb://localhost:27017/analytics

REDIS_URL=redis://localhost:6379
```

---

### 4. Start infrastructure

```bash
docker compose up -d
```

Check the containers:

```bash
docker compose ps
```

The project requires:

```text
Kafka
MongoDB
Redis
```

---

### 5. Start the NestJS application

```bash
npm run start:dev
```

The API runs on:

```text
http://localhost:3000
```

---

## Testing the Pipeline

### Health check

```bash
curl http://localhost:3000/health
```

---

### Send an event

```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d "{\"eventId\":\"test-001\",\"type\":\"page_view\",\"userId\":\"user-001\",\"timestamp\":\"2026-09-06T00:00:00.000Z\"}"
```

---

### Check analytics

```bash
curl http://localhost:3000/analytics
```

---

## Real-Time Dashboard

Open:

```text
websocket-test.html
```

in a browser while the NestJS application is running.

Send events through the API and observe the dashboard update automatically.

---

## Load Testing

The project includes a simple concurrent HTTP load generator:

```bash
npm run load:test
```

The load test sends:

```text
5,000 HTTP requests
50 concurrent requests per batch
```

### Observed Benchmark

Local benchmark result:

```text
Total requests:     5000
Successful:         5000
Failed:             0
Success rate:       100.00%

Average latency:    25.42 ms
Minimum latency:    12.10 ms
Maximum latency:    51.23 ms

Total test time:    4.31 s
Requests/second:    1160.09
```

This benchmark measures the HTTP event-ingestion endpoint under the local development environment.

It should not be interpreted as a production capacity guarantee.

---

## Reliability Verification

The pipeline was also tested for duplicate event processing.

When the same `eventId` is submitted multiple times, Redis-based idempotency prevents the duplicate from being processed again.

Expected behavior:

```text
First event
    ↓
Processed
    ↓
MongoDB + Redis

Duplicate event
    ↓
Detected
    ↓
Ignored
```

This protects analytics counters from double counting.

---

## Data Flow

A typical event follows this path:

```text
Client
  │
  │ POST /events
  ▼
NestJS API
  │
  │ publish
  ▼
Kafka
  │
  │ consume
  ▼
Analytics Consumer
  │
  ├──────────────► MongoDB
  │
  ├──────────────► Redis
  │                    │
  │                    │ metrics
  │                    ▼
  └──────────────► WebSocket Gateway
                       │
                       ▼
                  Live Dashboard
```

---

## Key Engineering Concepts Demonstrated

### Asynchronous processing

Kafka separates event ingestion from event processing.

### Event-driven architecture

Events flow through Kafka rather than requiring synchronous communication between every component.

### Idempotent processing

Redis-based event keys prevent duplicate events from being counted more than once.

### Caching and aggregation

Redis provides fast access to frequently changing analytics metrics.

### Persistence

MongoDB stores raw event data independently from the real-time aggregate layer.

### Automatic data retention

MongoDB TTL indexes automatically remove expired event records.

### Real-time communication

Socket.IO/WebSockets push updated analytics to connected clients.

### Containerized infrastructure

Kafka, MongoDB, and Redis are managed through Docker Compose.

### Performance testing

A concurrent load generator measures ingestion latency, throughput, success rate, and failures.

---

## Future Improvements

Potential production extensions include:

* Multiple analytics consumer groups
* Kafka dead-letter topics
* Schema validation with Avro or JSON Schema
* Partition-aware event keys
* Redis Streams
* Horizontal consumer scaling
* Authentication and authorization
* Prometheus metrics
* Grafana dashboards
* Distributed tracing
* Kubernetes deployment
* Cloud-managed Kafka and MongoDB

---

## License

This project is intended as a portfolio and learning project.
