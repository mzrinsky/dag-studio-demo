# DAG Studio Technical Specification

## 1. Core Architecture
DAG Studio is a visual programming framework centered around **Data Ports**. The architecture strictly decouples visual presentation from data flow management by centralizing all graph logic in a global state engine.

### The Hierarchy
*   **`<DAGFlow>`**: The root visual context. Manages the global coordinate system (via D3) and provides the canvas for rendering nodes and connections.
*   **`<ConnectionCanvas>`**: A pure view layer. Subscribes to the store's connection state and renders SVG edges between ports.
*   **`<Node>` (Presentation Shell)**: A "dumb" structural container. Responsible for layout, visual encapsulation, and hosting one or more Port configurations. It acts as a spatial boundary; data flows between Ports, regardless of whether those Ports reside in the same Node or different ones.
*   **`<Ports>` (Binding Engine)**: The intelligence layer. Wraps React components to declare the node's interface. It defines the **Ports** (the static sockets) and manages the lifecycle of the **Plug** (the draggable connection lead) during the connection process.

## 2. Identity & State Management
The system utilizes a **Centralized State Engine** (Zustand + Immer) to ensure stability, persistence, and predictable data flow.

*   **Slicing Pattern**: To maintain scalability and separate concerns, the global store is partitioned into domain-specific slices (e.g., `topologySlice` for structure, `executionSlice` for data flow, `historySlice` for undo/redo).
*   **UUIDs**: Every Node and Port must have a unique ID. Array indices are strictly forbidden as keys.
*   **Global Registry**: All node positions, z-indices, port values, and connection mappings are stored in the `useGraphStore`. This allows for logic (like connection validation) to exist independently of the React component tree.
*   **Z-Index Management**: Node layering is treated as state within the store, allowing for "Bring to Front" functionality and persistence across sessions.
*   **State Persistence & History**: 
    *   **Transient State**: High-frequency updates (e.g., dragging a node) update the store directly for immediate UI feedback.
    *   **Committed State**: Structural changes (e.g., creating a connection, adding a node) are wrapped in a `Command` pattern and pushed to the `historyManager` for undo/redo support.
*   **The `nodeRef` Binding**: The `nodeRef` property in Port configurations must bind to a **React Ref**. This allows the `Ports` engine to interact directly with the underlying component instance, bypassing unnecessary re-renders for high-frequency data updates.

## 3. Hybrid Execution Model
The system supports three concurrent data-flow modes. The distinction is defined by the handler used in the Port configuration.

### The Data Stability Gradient (The Data Quad)
Data in DAG Studio is not a single value, but a lifecycle. A Port manages four distinct state slots to ensure stability:
1. **Default Value**: The hard-coded baseline.
2. **Draft Value (`onChange`)**: The volatile, immediate state. High-frequency, low-precision.
3. **Computed Value (`onProcess`)**: The verified result of a job. High-precision, asynchronous.
4. **Committed Value (`onCommit`)**: The persisted system state. The "Source of Truth" for databases.

**Lifecycle Flow:** `Draft` $\rightarrow$ `Computed` $\rightarrow$ `Committed`.

### A. Reactive Flow (`onChange`)
*   **Trigger**: Immediate (on value change).
*   **Behavior**: Data propagates through the graph as soon as a change is detected in the store.
*   **Use Case**: UI updates, real-time calculations, sliders, and live previews.
*   **Implementation**: Executed by the store after the **Draft Value** is updated.

### B. Processing Logic (`onProcess`)
*   **Trigger**: External/Global (e.g., a global "Run" signal, a scheduler, or a manual trigger).
*   **Behavior**: This is a **definition of work**. When the graph engine executes, it calls this handler to transform inputs into a high-precision result.
*   **Use Case**: API calls, heavy computations, background worker processes.
*   **Implementation**: The handler returns a value which the store then writes to the **Computed Value** slot.

### C. Persistent Flow (`onCommit`)
*   **Trigger**: Finalization (e.g., `onBlur`, `Enter` key, or explicit "Save").
*   **Behavior**: The system transitions a value from Draft/Computed to Committed in the data model.
*   **Use Case**: Saving user settings, updating node configurations, persisting graph state.
*   **Implementation**: Executed by the store after the **Committed Value** is updated (used for side-effects like DB writes).

## 4. Developer Guardrails (The Laws)
1. **Law of Decoupling**: No business logic in `<Node>`. Logic belongs in the store actions, the `Ports` configuration, or the wrapped component.
2. **Law of Binding**: All data entering or leaving a component must be declared in the `<Ports>` metadata.
3. **Law of Identity**: Never use array indices as keys for nodes or ports; always use UUIDs.
4. **Law of Execution**: Long-running tasks **must** be implemented via `onProcess` to prevent blocking the main UI thread.
5. **Law of Strict Typing**: Every port must have an explicit type. Type validation is performed in the store during connection creation to prevent invalid data flows and ensure system stability.
6. **Law of Acyclicity**: To prevent infinite loops in Reactive Flow, the system must prevent circular dependencies. While a Port may connect to another Port within the same Node (internal feedback), the global state engine must block any connection that creates a closed loop across the graph.
7. **Law of Command**: Any structural modification to the graph topology (adding/removing nodes, ports, or connections) **must** be implemented via the `Command` pattern to ensure atomic undo/redo capability. Direct mutation of the topology outside of `executeCommand` is strictly forbidden.
8. **Law of Verification**: No logic shall be committed to the global store without corresponding unit tests. All tests must utilize `resetStore()` to ensure isolation and specifically verify the three pillars: Topology (legality/cycles), Execution (Data Quad lifecycle), and History (undo/redo atomicity).
9. **Law of Attribution**: To maintain a transparent audit trail of human vs. AI contributions, every commit must include a footer identifying the AI's role using the following strict taxonomy:
    *   **Case A: AI-Generated Code/Logic**: If the AI wrote the actual code, implemented a feature, or fixed a bug.
        *   *Format*: `Co-authored-by: [Model Name] [Parameter Count]` (e.g., `Co-authored-by: Gemma 4 31B`)
    *   **Case B: Fully AI-Automated**: If the AI performed the task end-to-end via Agent Mode.
        *   *Format*: `Generated-by: [Model Name] [Parameter Count]`
    **Requirement for Models**: The model must accurately identify its own identity and parameter count based on its current system prompt or known architecture.

## 5. Design Philosophy: The Port-First Approach

DAG Studio departs from traditional "Node-Edge" frameworks by treating the **Port** as the primary unit of logic and the **Node** as a secondary organizational unit.

* **The Node as a Spatial Group**: In this architecture, a `<Node>` is effectively a "dumb" grouping mechanism...
* **The Ports Component as a Factory**: The `<Ports>` component is the actual "Binding Engine." It acts as a factory...
* **Authority of Validation**: 
    * **The Store** is the sole authority on **Connection Legality** (Type compatibility and Acyclicity).
    * **The Ports Component** is the sole authority on **Component Interface** (Which ports are exposed and how they bind to the inner component).
*   **Non-Exclusive Execution Modes**: The three execution modes (Reactive, Imperative, Persistent) are **complementary, not mutually exclusive**. A single port can implement multiple handlers to create a data stability gradient:
    *   `onChange` for immediate, low-precision UI feedback (**Draft Value**).
    *   `onProcess` for deferred, high-precision computation (**Computed Value**).
    *   `onCommit` for final, permanent state synchronization (**Committed Value**).
    This allows a single data point to evolve from a "volatile draft" to a "verified result" and finally to a "persisted record."

## 6. Implementation Example (Pseudo-code)

```jsx
// UI components now simply subscribe to the store and trigger actions
<DAGFlow>
    <ConnectionCanvas /> {/* Purely renders lines from store.connections */}
    
    <Node>
        <Ports
            // Identity: UUID auto-generated by store registration
            inputs={[
                {
                    label: "Live Signal",
                    type: "number", // REQUIRED: Type must be explicitly defined
                    nodeRef: myComponentRef, 
                    onChange: (val) => { 
                        /* Reactive: Push update to downstream immediately */ 
                    }
                }
            ]}
            outputs={[
                {
                    label: "Heavy Compute",
                    type: "string", // REQUIRED: Type must be explicitly defined
                    onProcess: async () => { 
                        /* Imperative: Run as a registered job */ 
                        return await performHeavyTask();
                    }
                }
            ]}
        >
            <MyWorkerComponent ref={myComponentRef} />
        </Ports>
    </Node>
</DAGFlow>
```

## 7. Tech Stack
*   **Framework**: Next.js 16, React 19+
*   **Styling**: Tailwind CSS, shadcn/ui
*   **State**: Zustand (with Immer and Persist middleware)
*   **Interaction**: d3-drag, d3-zoom

## 8. Testing Standards
To maintain the integrity of the graph engine, all store logic must be verified via unit tests.

*   **Isolated State**: Tests must use a `resetStore()` utility in `beforeEach` to prevent state leakage between test cases.
*   **Store Mocking**: Since the store is a singleton, use a dedicated `setupStoreMock()` to ensure a clean environment for Vitest.
*   **Test Domains**:
    *   **Topology Tests**: Focus on connection legality (Type matching) and graph theory (Acyclicity/Loop prevention).
    *   **Execution Tests**: Focus on the "Data Quad" lifecycle. Verify that `onChange` triggers propagation and that draft/computed/committed slots remain distinct.
    *   **History Tests**: Focus on the `Command` pattern. Every structural change must be testable via `undo()` and `redo()`, including the clearing of the forward stack upon new actions.
*   **Mocking Side-Effects**: Use `vi.fn()` to spy on port handlers (like `onChange`) to verify that data flows through the graph as expected without needing to render the UI.