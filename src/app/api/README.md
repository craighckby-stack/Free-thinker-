# API Gateway Documentation

> **Executive Summary:** Primary ingress gateway for the DARLEK CANN v3.0 system (OMEGA-Emergent architecture), providing real-time diagnostics and agent orchestration hooks.

---

## Quick Navigation
- [API Endpoints](#api-endpoints)
- [Type Definitions](#type-definitions)
- [Integration Requirements](#integration-requirements)

---

## API Endpoints

The API gateway exposes core system telemetry and agent synchronization capabilities via standardized HTTP methods.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api` | Retrieves system health, performance metrics, and node status. |
| `POST` | `/api` | Submits agent-orchestration payloads for swarm synchronization. |

### Example Request (`POST /api`)

```json
{
  "context": "omega-sync",
  "swarmId": "darlek-cann-v3",
  "payload": {
    "action": "initialize_node",
    "priority": 1
  }
}
```

---

## Type Definitions

To ensure strict type-safety across client and server integrations, payloads must adhere to the following TypeScript interfaces:

```typescript
export type OmegaAction = 'initialize_node' | 'sync_swarm' | 'terminate_node';

export interface SwarmPayload {
  action: OmegaAction;
  priority: number;
}

export interface ApiRequestPayload {
  context: string;
  swarmId: string;
  payload: SwarmPayload;
}

export interface ApiResponse {
  status: 'success' | 'error';
  nodeId: string;
  timestamp: number;
  metrics?: Record<string, unknown>;
}
```

---

## Integration Requirements

Engineered for seamless interfacing with core system repositories.

* **Required Header:** `X-Agent-Context` must be included in all incoming requests to guarantee proper routing.

### Implementation Example

```bash
curl -X POST https://api.internal.darlek/api \
  -H "Content-Type: application/json" \
  -H "X-Agent-Context: OMEGA-NODE-01" \
  -d '{"context": "omega-sync", "swarmId": "darlek-cann-v3", "payload": {"action": "initialize_node", "priority": 1}}'
```