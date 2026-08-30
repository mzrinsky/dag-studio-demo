# 🧬 Collaboration State Model

## 1. State Partitioning
To prevent "state jitter," the collaboration layer distinguishes between local-only volatile state and shared synchronized state.

| State Segment | Scope | Sync Trigger | Persistence |
| :--- | :--- | :--- | :--- |
| **Draft Value** | Local | N/A | No |
| **Committed Value** | Shared | `onCommit` | Yes |
| **Module Position** | Shared | On Drag Release | Yes |
| **Presence** | Shared | Real-time (High Freq) | No |
| **Locks** | Shared | Real-time (Event-driven) | No |

## 2. Presence Schema
Presence is treated as a high-frequency, ephemeral layer.

```typescript
interface UserPresence {
  userId: string;
  userName: string;
  presenceColor: string;
  avatarUrl?: string;
  cursor: { x: number; y: number };
  focusedObjectId?: string; // The ID of the module/port currently selected
}
```

## 3. The Locking Model (Mutual Exclusion)
The system uses a "Soft-Lock" mechanism to prevent concurrent structural modifications.

### A. Lock Definition
A lock is a claim over a specific `objectId` within the graph.
```typescript
interface ObjectLock {
  objectId: string;
  userId: string;
  timestamp: number;
  // lockType determines WHICH interaction is blocked, not ALL interaction.
  lockType: 'SPATIAL' | 'STRUCTURAL' | 'DATA'; 
}
```

### B. Hierarchical Locking Logic (Type-Specific)
Locks propagate upwards, but only within their own functional domain to prevent productivity bottlenecks:

*   **SPATIAL Lock (Movement)**:
    *   **Port → Module**: If a `Port` is being used to create a patch, the parent `Module` is implicitly `SPATIAL` locked. This prevents other users from moving the module while a patch is being anchored to it.
    *   **Impact**: Blocks `drag` events; does **not** block data editing.
*   **STRUCTURAL Lock (Topology)**:
    *   **Module → Port**: If a `Module` is being deleted or reconfigured, all child `Ports` are `STRUCTURAL` locked.
    *   **Impact**: Blocks new patches or port deletions; does **not** block value updates.
*   **DATA Lock (Value)**:
    *   **Port → Port**: A lock on a specific port's value.
    *   **Impact**: Sets the input field to `read-only`.

**Crucially**: A `SPATIAL` lock on a Module does **not** trigger a `DATA` lock on its Ports. Users can continue to edit values inside a module even while another user is moving that module across the canvas.

## 4. The Conflict State ("The Fifth State")
A conflict occurs when the system detects a divergence between the local "Draft" state and the shared "Committed" state. 

**Trigger Condition:** 
A conflict is flagged if `remoteCommittedValue` is updated via the sync layer while the local user has an active `draftValue` (i.e., the port is currently being edited but not yet committed).

*   **State Flag**: `isConflicted: boolean`
*   **Conflict Payload**: 
    *   `localDraft`: The current uncommitted value in the local UI.
    *   `remoteCommitted`: The latest value synchronized from the server.
    *   `timestamp`: When the remote update arrived.
*   **Resolution Strategies**:
    *   **Overwrite (Local Wins)**: Push `localDraft` to the shared state via `onCommit`.
    *   **Accept (Remote Wins)**: Discard `localDraft` and update local state to `remoteCommitted`.
    *   **Merge**: (Optional) Trigger a custom merge function based on the Port's data type.

**Prevention**: While "Soft-Locks" reduce the probability of conflicts, the Conflict State serves as the final safety net for network latency and race conditions.
