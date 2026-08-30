# 📡 Collaboration Protocol

## 1. Transport Layer
The system employs a hybrid transport strategy based on the urgency and persistence of the data.

* **Real-time Stream (WebSockets/WebRTC/UDP)**: 
    * **Presence**: (Cursors) - Extremely high frequency.
    * **Spatial Locks**: (Moving a module) - High frequency, ephemeral. These are "intent" signals that should be broadcast instantly to prevent "selection jumping."
    * **Data Locks**: (Focusing an input) - Medium frequency.
* **Reliable Sync (REST/GraphQL/WebSockets/TCP)**: 
    * **Structural Locks**: (Deleting/Adding modules) - Low frequency, high importance. Requires acknowledgement to ensure graph integrity.
    * **Committed Value** & **Module Position (Final)**.

## 2. Command Propagation & History
To maintain a predictable user experience, the system implements **Scoped Local History**. Undo/Redo operations are tied to the individual user's session, not the global document state.

*   **Local History Stack**: Each client maintains its own `historyManager`. Only commands initiated by the local user are pushed to this stack.
*   **Remote Mutation**: Changes received from other users are applied as direct store mutations. These are **never** pushed to the local undo stack.
*   **The Undo Execution Flow**:
    1.  **Pop**: User triggers Undo → system pops the last `Command` from the local stack.
    2.  **Validate**: Before executing the inverse action, the system checks if the target entity (Module/Port/Link) still exists and is in a state that allows the inverse operation.
    3.  **Execute or Skip (Vacuous Truth)**:
        *   If the target was already deleted by another user, the command is considered "vacuously true" (the desired end state is already achieved). The system silently discards the command and moves to the next item in the stack.
        *   If the target exists, the inverse command is executed and broadcast to all clients.

*   **Rule**: Local Undo is an *intent* to revert a change, subject to the *current global reality* of the graph.

## 3. Distributed Execution Authority
For `onProcess` (Imperative Flow) handlers, the system defines who is allowed to trigger the computation.

### A. Client-Side Authority
* The triggering user executes the logic.
* The resulting `computedValue` is pushed to the store and broadcast to others.

### B. Server-Side Orchestration
* The triggering user sends a `Run` signal.
* A central coordinator executes the DAG logic.
* The coordinator broadcasts the final `computedValue` to all clients.

## 4. Conflict Resolution Logic
The protocol for resolving `hasRemoteUpdate` flags:
1. **Overwrite**: Client sends `commit` command → Server updates DB → Broadcasts new value.
2. **Accept**: Client updates local `draftValue` with `remoteCommitted` → Clears `hasRemoteUpdate` flag.
