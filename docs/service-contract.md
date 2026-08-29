# WebMCP Service Reliability Contract Guide

This guide explains how external browser applications and service authors can expose WebMCP tools compatible with MCPx durable transactions.

---

## 1. The Triad: Execute, Inspect, Compensate

To make any consequential service mutation durable and verifiable, the service author exposes three corresponding WebMCP tools:

```text
┌──────────────────────────────────────────────────────────┐
│                   Reliability Contract                   │
├───────────────────┬──────────────────┬───────────────────┤
│   01. EXECUTE     │   02. INSPECT    │  03. COMPENSATE   │
│   (Consequential) │  (Ground Truth)  │    (Rollback)     │
│                   │                  │                   │
│   create_route    │    get_route     │   delete_route    │
└───────────────────┴──────────────────┴───────────────────┘
```

---

## 2. Parameter Contract: `operationKey`

All three tools in a reliability contract must accept a common correlation identity parameter (typically `operationKey` or `idempotencyKey`):

```json
{
  "type": "object",
  "properties": {
    "operationKey": {
      "type": "string",
      "description": "Deterministic transaction operation identity"
    }
  },
  "required": ["operationKey"]
}
```

### Purpose of `operationKey`:
1. **`execute`**: Used to ensure that if the same write is received multiple times, the service returns the existing resource rather than creating duplicates.
2. **`inspect`**: Used to query if a resource associated with this transaction identity was committed to storage.
3. **`compensate`**: Used to identify and safely destroy the resource associated with this transaction identity.

---

## 3. Tool Return Shapes

### `execute` Tool Output
Should return JSON containing the created resource ID:
```json
{
  "resourceId": "rt_849204",
  "created": true,
  "operationKey": "tx:1788009632:routing-step"
}
```

### `inspect` Tool Output
Should return an authoritative boolean indicator of presence:
```json
{
  "exists": true,
  "resourceId": "rt_849204",
  "operationKey": "tx:1788009632:routing-step"
}
```
*If not found, returns `{ "exists": false, "operationKey": ... }`.*

### `compensate` Tool Output
Should return an acknowledgement of deletion:
```json
{
  "deleted": true,
  "operationKey": "tx:1788009632:routing-step"
}
```

---

## 4. Developer Assertions

When configuring a contract in the MCPx control plane, the service owner confirms three assertions:
1. **Execute Idempotency**: Executing the mutation twice with the same `operationKey` does not create duplicate records.
2. **Authoritative Ground Truth**: The inspect tool checks true backend storage rather than uncommitted memory buffers.
3. **Safe Compensation**: The compensate tool can be safely called multiple times without throwing fatal errors if the resource was already deleted.
