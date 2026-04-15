# 💾 Persistence Strategy

## 1. Overview
To ensure that DAG Studio is viable for production-grade work, the system distinguishes between **Transient State** (live interaction) and **Permanent State** (recoverable history). This strategy provides a safety net against catastrophic data loss, accidental mass-deletions ("griefing"), and system crashes.

## 2. The Event Journal (The Source of Truth)
The system does not merely store the current state of the graph; it maintains an **Append-Only Event Journal**. Every structural change (Command) that is broadcast to other clients is also logged on the server.

*   **Journal Entry**: `{ timestamp, userId, commandType, payload, checksum }`
*   **Purpose**: The Journal allows the system to reconstruct the graph state at any specific point in time by replaying events from the beginning of the project.

## 3. Snapshotting Mechanism
To avoid the computational cost of replaying thousands of events, the server implements a tiered snapshotting system.

### A. Automatic Checkpoints
The server automatically generates a full state dump (a "Snapshot") of the `useGraphStore` based on:
*   **Interval**: Every 5 minutes of active editing.
*   **Threshold**: Every 50 significant structural changes (e.g., adding/deleting nodes, changing connections).

### B. Manual Milestones
Users can explicitly trigger a "Named Snapshot" (e.g., "v1.0 - Stable Architecture"). These milestones are persisted indefinitely and are immune to automatic cleanup.

## 4. Recovery & The "Hard Reset"
In the event of a "griefing" attack or critical error, an administrator can perform a **Global State Reversion**.

### The Reversion Process:
1.  **Selection**: Admin selects a Snapshot or a specific timestamp from the Event Journal.
2.  **Broadcast**: The server sends a `GLOBAL_RESET` signal to all connected clients.
3.  **Client-Side Execution**:
    *   **Store Overwrite**: The `useGraphStore` is completely replaced by the snapshot data.
    *   **History Purge**: The local `historyManager` (Undo/Redo stacks) is wiped clean. This prevents a user from "undoing" the reset and returning the graph to a corrupted state.
    *   **Re-sync**: Clients acknowledge the reset and resume editing from the restored baseline.

## 5. Data Stability Gradient
To optimize performance, data is persisted according to its volatility:

| Data Type | Persistence Method | Frequency | Recovery Level |
| :--- | :--- | :--- | :--- |
| **Presence (Cursors)** | UDP/Websocket | Real-time | None (Ephemeral) |
| **Draft Values** | Local Store | Immediate | Session-only |
| **Committed Values** | Event Journal → DB | On Commit | Full History |
| **Graph Topology** | Event Journal → Snapshot | Threshold-based | Full History |

## 6. Implementation Guardrails
1.  **Immutability**: Snapshots must be stored as immutable blobs.
2.  **Pruning**: To prevent database bloat, the server may "squash" old event journals into a single base snapshot after a period of inactivity (e.g., 30 days).
3.  **Atomic Commits**: All structural changes to the graph must be atomic; a failure to write to the Event Journal must prevent the change from being broadcast to other clients.
