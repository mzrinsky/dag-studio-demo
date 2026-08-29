# ⚙️ Technical Spec: Store Execution Engine

This document defines the internal mechanics of the `executionSlice` and the global store's responsibility in managing data propagation, signal processing, and graph integrity.

## 1. The Port Type System (`PortType`)
To satisfy the **Law of Strict Typing**, connection validation is not based on JavaScript types, but on a defined union of descriptors.

### Type Definition
```typescript
type PortType = 
  | 'number' 
  | 'string' 
  | 'boolean' 
  | 'blob' 
  | 'json'
  | `custom:${string}`; // Allows for domain-specific types (e.g., custom:audio-signal)
```

### Connection Validation (`canConnect`)
The store must implement a validation check before any connection is committed to the topology:
1. **Type Matching**: Source Output Type must strictly equal Target Input Type.
2. **Implicit Casting**: The system shall **not** perform implicit casting (e.g., number $\rightarrow$ string). Users must use an explicit "Adapter" to ensure data transparency.
3. **Acyclicity Check**: Based on the **Law of Contextual Acyclicity**, a connection is blocked if it creates a loop AND the port involves `onProcess`.

---

## 2. Reactive Flow (`onChange`) & The Circuit Breaker
Reactive flow is an event-driven propagation system. To prevent infinite recursion in cycles, a "Circuit Breaker" is mandatory.

### Propagation Logic
When `updatePortValue` is called with the `draft` slot:
1. Increment a `propagationDepth` counter for the current transaction.
2. Trigger `onChange` handlers for all immediate downstream targets.
3. Recursively propagate updates.

### The Circuit Breaker Threshold
- **Max Depth**: 50 iterations.
- **Behavior**: If `depth > 50`, the store must truncate the propagation chain, log a warning to the developer console (`"Reactive loop detected: propagation truncated"`), and cease execution for that transaction.

---

## 3. Imperative Flow (`onProcess`) & Topological Sorting
Imperative flow is designed for high-precision jobs. It requires a deterministic order of execution.

### The Execution Algorithm
When a global "Run" signal is triggered:
1. **Linearization**: The store performs a **Kahn's Algorithm** topological sort on the current graph topology.
2. **Execution Queue**: Nodes are placed in a queue based on their dependency rank.
3. **Sequential Processing**: 
    - Execute `onProcess` for Node A.
    - Write result to **Computed Value** slot.
    - Pass output to Node B's input.
    - Repeat until the sink nodes are reached.

### Error Handling
If any `onProcess` handler throws an error, the execution chain for that branch is halted, and the port state is marked as `error`, preventing "stale" data from propagating downstream.

---

## 4. Temporal Flow (`onSample`) & Signal Memory
Temporal flow bypasses the standard Zustand state tree to avoid React render cycles at high frequencies (e.g., 60Hz or 44.1kHz).

### The Clock Source
The execution engine utilizes a `requestAnimationFrame` loop for UI-synced signals and is designed to be extensible to `AudioWorklet` for low-latency audio.

### Signal Memory Strategy (RingBuffer)
To implement the **Flyweight Pattern**, the store manages a set of contiguous `Float32Array` buffers:
1. **Buffer Pool**: A pre-allocated slab of memory shared across all signal ports.
2. **RingBufferView**: Instead of passing the whole array, `onSample` handlers receive a `RingBufferView` object containing:
    - `pointer`: Current read/write index.
    - `data`: The underlying `ArrayBuffer`.
    - `getPrevious(offset)`: Access to $t-1$ values for feedback loops.

### Feedback Loop Implementation
Because the memory is persistent across samples, a port can read its own output from the previous frame ($t-1$) via the RingBufferView, enabling mathematically stable oscillators and filters.

---

## 5. The Data Quad Lifecycle Summary
The `executionSlice` manages the transition of values through these slots:

| Slot | Trigger | Stability | Persistence |
| :--- | :--- | :--- | :--- |
| **Draft** | `onChange` | Volatile | Transient (Store) |
| **Computed** | `onProcess` | Verified | Session-based |
| **Committed** | `onCommit` | Permanent | Disk/Database |
| **Signal** | `onSample` | Temporal | Buffer Pool |

### Promotion Flow
`User Input` $\rightarrow$ `Draft` $\rightarrow$ (`onProcess`) $\rightarrow$ `Computed` $\rightarrow$ (`onCommit`) $\rightarrow$ `Committed`.