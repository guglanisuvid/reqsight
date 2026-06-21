# ReqSight

[![npm version](https://img.shields.io/npm/v/reqsight.svg)](https://www.npmjs.com/package/reqsight)

Production-grade observability middleware for Express. Structured request/response logging, correlation ID propagation, outbound HTTP tracing via Axios interceptors, and a consistent error-handling pipeline — wired up in minutes, configurable without touching package internals.

Built on [Pino](https://getpino.io) for high-throughput, low-overhead JSON logging.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
  - [logLevel](#loglevel)
  - [prettyLogs](#prettylogs)
  - [stackTrace](#stacktrace)
  - [sanitize.request](#sanitizerequest)
  - [sanitize.response](#sanitizeresponse)
  - [sanitize.axiosErrors](#sanitizeaxioserrors)
- [API Reference](#api-reference)
  - [requestLogger](#requestlogger)
  - [errorLogger](#errorlogger)
  - [notFoundLogger](#notfoundlogger)
  - [throwError](#throwerror)
  - [axiosInterceptors](#axiosinterceptors)
  - [asyncHandler](#asynchandler)
- [Correlation IDs](#correlation-ids)
- [Request-Scoped Logging](#request-scoped-logging)
- [Axios Outbound Tracing](#axios-outbound-tracing)
- [Error Handling](#error-handling)
- [TypeScript](#typescript)
- [Log Output Examples](#log-output-examples)
- [Requirements](#requirements)
- [License](#license)

---

## Features

- **Structured logging** — every request and response logged as JSON, ready for Datadog, CloudWatch, Loki, or any log aggregator
- **Correlation ID propagation** — reads `x-correlation-id` from inbound headers or generates a UUID v4; attaches it to every log line and echoes it back in the response header
- **Request-scoped child logger** — `req.logger` is a Pino child bound to the correlation ID, method, and path, so your route handlers log in context without any extra setup
- **Outbound HTTP tracing** — Axios interceptors log every outbound request with correlation ID forwarding, and capture errors with configurable sanitization
- **Consistent error pipeline** — distinguishes operational errors (safe to expose) from unexpected crashes, with structured JSON responses and optional stack traces
- **Zero-config startup** — `postinstall` copies a fully annotated `reqsight.config.js` into your project root; edit it, or leave the defaults
- **Config evaluated once** — serializer functions are resolved at startup via a factory pattern, never per-request; no runtime branching on hot paths
- **Pretty logs in dev, raw JSON in prod** — controlled by a single `prettyLogs` flag; `pino-pretty` is optional so it never bloats production images
- **Full TypeScript support** — ships `.d.ts` declarations with Express module augmentation for `req.correlationId`, `req.startTime`, and `req.logger`

---

## Installation

```bash
npm install reqsight
```

A `reqsight.config.js` file will be created in your project root automatically. If one already exists it is left untouched.

If you want pretty-printed logs in development:

```bash
npm install --save-dev pino-pretty
```

If you want outbound Axios request tracing:

```bash
npm install axios
```

---

## Quick Start

```js
const express = require("express");
const {
  requestLogger,
  errorLogger,
  notFoundLogger,
  axiosInterceptors,
} = require("reqsight");

const app = express();

// Register Axios interceptors once at startup (optional)
axiosInterceptors();

app.use(express.json());

// Must be first — attaches req.correlationId, req.logger, req.startTime
app.use(requestLogger);

// Your routes
app.get("/", (req, res) => {
  res.json({ message: "ok" });
});

// After all routes
app.use(notFoundLogger);
app.use(errorLogger);

app.listen(3000);
```

That's it. Every request is now logged with a correlation ID, timing, and a structured response payload.

---

## Configuration

After `npm install`, open `reqsight.config.js` in your project root. It is a plain CommonJS module — edit it directly. ReqSight reads it once at startup.

```
your-project/
├── reqsight.config.js   ← generated on install, yours to edit
├── src/
└── ...
```

> The file is a verbatim copy of ReqSight's internal defaults. Every option is annotated with its possible values and examples.

---

### `logLevel`

Controls the minimum level emitted by ReqSight's logger.

```js
logLevel: process.env.LOG_LEVEL || "info"
```

| Value | Emits |
|-------|-------|
| `"fatal"` | fatal only |
| `"error"` | error, fatal |
| `"warn"` | warn and above |
| `"info"` | info and above (default) |
| `"debug"` | debug and above |
| `"trace"` | everything |

---

### `prettyLogs`

Enables colorized, human-readable output via `pino-pretty`. Requires `pino-pretty` to be installed.

```js
prettyLogs: process.env.NODE_ENV !== "production" || false
```

Disable in production — raw JSON is faster and integrates directly with log aggregators.

---

### `stackTrace`

Whether to include `stack` in error responses sent to the client.

```js
stackTrace: process.env.NODE_ENV !== "production" || false
```

Never expose stack traces in production — they reveal internal paths and module structure.

---

### `sanitize.request`

Controls what gets logged from incoming Express `req` objects on every request.

**Three modes:**

```js
// Mode 1 — function (default)
// Called per-request. Return exactly what you want logged.
request: (req) => ({
  ip: req?.ip,
  method: req?.method,
  originalUrl: req?.originalUrl,
  params: req?.params,
  query: req?.query,
  body: req?.body,
  "user-agent": req?.headers?.["user-agent"],
})

// Mode 2 — plain object
// Snapshotted once at startup. No dynamic values from req.
// Use for fixed metadata like service name.
request: { service: "payments-api", env: process.env.NODE_ENV }

// Mode 3 — anything else (e.g. null, true)
// Spreads the full raw req object. May expose sensitive data.
// Only appropriate in controlled environments.
request: null
```

---

### `sanitize.response`

Controls what gets logged from outgoing responses. Compatible with both Express `res` (uses `getHeader()`) and Axios response shapes (uses `headers` object).

`duration` and `responseSize` are always calculated directly in the middleware and merged into the log — they are not part of this serializer.

```js
// Mode 1 — function (default)
response: (res) => ({
  statusCode: res?.statusCode || res?.status,
  "content-type": res?.getHeader?.("content-type") || res?.headers?.["content-type"],
  "x-correlation-id": res?.getHeader?.("x-correlation-id") || res?.headers?.["x-correlation-id"],
})

// Mode 2 — plain object (static snapshot)
response: { service: "payments-api" }

// Mode 3 — anything else
// Spreads the raw response object.
response: null
```

---

### `sanitize.axiosErrors`

Controls what gets logged when an outbound Axios request fails.

Sensitive headers (`Authorization`, `Cookie`, `x-api-key`) are excluded from the default. The `data` payload from the downstream error response is included — useful for surfacing upstream validation messages.

```js
// Mode 1 — function (default)
axiosErrors: (err) => ({
  code: err?.code,
  message: err?.message,
  statusCode: err?.status,
  isRequestMade: !!err?.request,
  config: {
    url: err?.config?.url,
    method: err?.config?.method,
  },
  response: {
    status: err?.response?.status,
    data: err?.response?.data,
  },
  stack: err?.stack,
})

// Mode 2 — plain object (static snapshot)
axiosErrors: { service: "payments-api" }

// Mode 3 — anything else
// Spreads the full Axios error including raw config with all headers.
// Only use if you fully trust and control your log destination.
axiosErrors: null
```

---

## API Reference

### `requestLogger`

Express middleware. Must be registered **before** your routes.

- Reads `x-correlation-id` from the inbound request header, or generates a UUID v4
- Sets `x-correlation-id` on the response header
- Attaches `req.correlationId`, `req.startTime`, and `req.logger` to the request
- Logs `REQUEST RECEIVED` on every inbound request
- Patches `res.send` and `res.end` to log `REQUEST COMPLETED` with duration and response size when the response is sent

```js
app.use(requestLogger);
```

---

### `errorLogger`

Express error-handling middleware (4-argument signature). Must be registered **after** all routes.

Handles three error categories:

| Error type | Behaviour |
|---|---|
| Axios error with response | Forwards downstream status and data to the client |
| Operational error (`throwError`) | Sends structured JSON with the message and any extra properties |
| Unexpected crash | Sends a generic 500 with the correlation ID as a reference |

```js
app.use(errorLogger);
```

Stack traces are included in responses only when `config.stackTrace` is `true`.

---

### `notFoundLogger`

Catch-all middleware for unmatched routes. Register it after all routes and before `errorLogger`.

Responds with:

```json
{
  "success": false,
  "message": "Path not found",
  "code": "PATH_NOT_FOUND",
  "method": "GET",
  "path": "/unknown",
  "statusCode": 404
}
```

```js
app.use(notFoundLogger);
app.use(errorLogger);
```

---

### `throwError`

Throws an operational error that `errorLogger` will handle gracefully — the message is safe to expose to the client.

```js
const { throwError } = require("reqsight");

// Basic
throwError("User not found", 404);

// With extra fields merged into the response
throwError("Validation failed", 422, {
  field: "email",
  code: "INVALID_FORMAT",
});
```

```json
{
  "success": false,
  "message": "Validation failed",
  "field": "email",
  "code": "INVALID_FORMAT"
}
```

Non-operational errors (unhandled throws, programmer errors) receive a generic 500 response — internal details are never leaked.

---

### `axiosInterceptors`

Registers request and response interceptors on the global Axios instance. Call it **once** at startup. Safe to call multiple times — guards against double-registration internally.

```js
const { axiosInterceptors } = require("reqsight");
axiosInterceptors();
```

What it does:

- **Request interceptor** — logs every outbound request; warns if `x-correlation-id` is not set on the request config
- **Response interceptor (error)** — logs Axios errors using your `sanitize.axiosErrors` config

Requires Axios to be installed in your project. If Axios is not found, a warning is printed and the call is a no-op.

**Forwarding correlation IDs to downstream services:**

```js
const axios = require("axios");

const callDownstream = async (req) => {
  return axios.get("https://api.example.com/data", {
    headers: {
      "x-correlation-id": req.correlationId,
    },
  });
};
```

---

### `asyncHandler`

Wraps an async route handler and forwards any rejected promise to Express's `next(err)`, eliminating try/catch boilerplate in every route.

```js
const { asyncHandler, throwError } = require("reqsight");

app.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await db.findUser(req.params.id);
    if (!user) throwError("User not found", 404);
    res.json(user);
  })
);
```

---

## Correlation IDs

Every request handled by `requestLogger` gets a correlation ID:

1. If the client sends `x-correlation-id` in the request header, that value is used as-is
2. Otherwise, a UUID v4 is generated

The ID is:
- Attached to `req.correlationId`
- Set on the response header `x-correlation-id`
- Bound into `req.logger` (every log from that logger carries it automatically)
- Included in the `REQUEST RECEIVED` and `REQUEST COMPLETED` log messages

To propagate the ID through your entire call chain, pass it when calling downstream services:

```js
axios.get(url, {
  headers: { "x-correlation-id": req.correlationId },
});
```

---

## Request-Scoped Logging

`requestLogger` attaches a Pino child logger to `req.logger`. It is pre-bound with `correlationId`, `method`, and `path` — every message your route handler logs carries that context without any extra work.

```js
app.get("/orders", asyncHandler(async (req, res) => {
  req.logger.info("fetching orders from database");

  const orders = await db.getOrders();

  req.logger.info({ count: orders.length }, "orders fetched");

  res.json(orders);
}));
```

Log output:

```json
{ "level": "info", "correlationId": "a1b2c3...", "method": "GET", "path": "/orders", "msg": "fetching orders from database" }
{ "level": "info", "correlationId": "a1b2c3...", "method": "GET", "path": "/orders", "count": 42, "msg": "orders fetched" }
```

---

## Axios Outbound Tracing

Once `axiosInterceptors()` is called, every Axios request is logged automatically:

```
[a1b2c3] - OUTBOUND REQUEST  { method: "POST", url: "https://api.payments.io/charge", ... }
[a1b2c3] - OUTBOUND ERROR    { code: "ECONNREFUSED", statusCode: 503, ... }
```

If `x-correlation-id` is not set on the outbound request config, a warning is emitted so you can trace which call is missing ID propagation.

---

## Error Handling

ReqSight's error pipeline is built around the distinction between **operational errors** and **unexpected errors**.

**Operational errors** — raised intentionally via `throwError`. Safe to expose to clients.

```js
// In a route handler
throwError("Insufficient balance", 402, { required: 100, available: 40 });

// Response the client receives:
// { "success": false, "message": "Insufficient balance", "required": 100, "available": 40 }
```

**Unexpected errors** — unhandled exceptions, programmer errors. The client receives a generic 500 referencing the correlation ID so you can look it up in your logs.

```json
{
  "success": false,
  "message": "Even the best systems have bad days. Ours is having one right now. Reference: a1b2c3..."
}
```

**Axios errors** — when a downstream call fails and the error reaches `errorLogger`, ReqSight forwards the downstream status code and response body to the client:

```json
{ "success": false, "message": "Payment declined", "code": "CARD_DECLINED" }
```

---

## TypeScript

ReqSight ships `.d.ts` declarations. No `@types` package needed.

The Express `Request` interface is augmented automatically:

```ts
import express, { Request, Response } from "express";
import { requestLogger, throwError, asyncHandler } from "reqsight";

const app = express();
app.use(requestLogger);

app.get("/", asyncHandler(async (req: Request, res: Response) => {
  req.correlationId; // string | undefined
  req.startTime;     // number | undefined
  req.logger;        // pino.Logger | undefined

  throwError("Not allowed", 403);
}));
```

---

## Log Output Examples

**Development (`prettyLogs: true`):**

```
[2025-06-21 14:32:01.123] INFO  [a1b2c3d4] - REQUEST RECEIVED
    ip: "127.0.0.1"
    method: "POST"
    originalUrl: "/api/users"

[2025-06-21 14:32:01.187] INFO  [a1b2c3d4] - REQUEST COMPLETED
    statusCode: 201
    duration: "64ms"
    responseSize: "312 bytes"
```

**Production (`prettyLogs: false`):**

```json
{"level":"info","time":"2025-06-21T14:32:01.123Z","correlationId":"a1b2c3d4","method":"POST","path":"/api/users","ip":"127.0.0.1","originalUrl":"/api/users","msg":"[a1b2c3d4] - REQUEST RECEIVED"}
{"level":"info","time":"2025-06-21T14:32:01.187Z","correlationId":"a1b2c3d4","method":"POST","path":"/api/users","statusCode":201,"duration":"64ms","responseSize":"312 bytes","msg":"[a1b2c3d4] - REQUEST COMPLETED"}
```

---

## Requirements

| Dependency | Version | Notes |
|---|---|---|
| Node.js | ≥ 18 | |
| Express | ≥ 4.0.0 | peer dependency |
| Axios | ≥ 1.0.0 | optional peer dependency — only needed for `axiosInterceptors` |
| pino-pretty | any | optional — only needed when `prettyLogs: true` |

---

## License

MIT
