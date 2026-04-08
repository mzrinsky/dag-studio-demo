# DAG Studio Technical Specification

## 1. Core Architecture
DAG Studio is a visual programming framework centered around **Data Ports**. The architecture strictly decouples visual presentation from data flow management.

### The Hierarchy
*   **`<DAGFlow>`**: The root provider. Manages the global coordinate system (via D3), the connection manager (edge drawing), and the node manager (z-index/layout).
*   **`<Node>` (Presentation Shell)**: A "dumb" structural container. Responsible for layout, visual encapsulation, and hosting Ports. It must not contain business logic or state management for data flow.
*   **`<Ports>` (Binding Engine)**: The intelligence layer. Wraps React components to declare the node's interface. It bridges the internal component state to the global graph.
*   **`<Handle>`**: The physical connection points for inputs and outputs.

## 2. Identity & State Management
To ensure stability across React re-renders, the system uses a **Self-Registering Identity** pattern.

*   **UUIDs**: Every Node and Port must have a unique ID. If an ID is not provided via props, the component must auto-generate a UUID upon mounting.
*   **Zustand Registry**: All IDs and their corresponding positions/states are registered in a global Zustand store. This allows the Connection Manager to track dependencies without relying on the React component tree.
*   **The `nodeRef` Binding**: The `nodeRef` property in Port configurations must bind to a **React Ref**. This allows the `Ports` engine to interact directly with the underlying component instance, bypassing unnecessary re-renders for high-frequency data updates.

## 3. Hybrid Execution Model
The system supports two concurrent data-flow modes. The distinction is defined by the handler used in the Port configuration.

### A. Reactive Flow (`onChange`)
*   **Trigger**: Immediate.
*   **Behavior**: Data propagates through the graph as soon as a change is detected.
*   **Use Case**: UI updates, real-time calculations, sliders, and live previews.
*   **Implementation**: Mapped to the `onChange` handler in the Port definition.

### B. Imperative Flow (`onProcess`)
*   **Trigger**: Manual (e.g., a "Run" button) or Scheduled.
*   **Behavior**: The operation is registered as a "Job." It waits for a global execution signal or for all prerequisite dependencies to be resolved.
*   **Use Case**: API calls, heavy computations, background worker processes, and long-running jobs.
*   **Implementation**: Mapped to the `onProcess` handler in the Port definition.

## 4. Developer Guardrails (The Laws)
1.  **Law of Decoupling**: No business logic in `<Node>`. Logic belongs in the `Ports` configuration or the wrapped component.
2.  **Law of Binding**: All data entering or leaving a component must be declared in the `<Ports>` metadata.
3.  **Law of Identity**: Never use array indices as keys for nodes or ports; always use UUIDs.
4.  **Law of Execution**: Long-running tasks **must** be implemented via `onProcess` to prevent blocking the main UI thread.

## 5. Implementation Example (Pseudo-code)

```jsx
// The wrapper components handle the UUID registration and Zustand sync internally.
<DAGFlow connectionManager={connManager} nodeManager={nodeManager}>
    <Node connectionManager={connManager} nodeManager={nodeManager}>
        <Ports
            connectionManager={connManager} nodeManager={nodeManager}
            // Identity: UUID auto-generated if not provided
            inputs={[
                {
                    label: "Live Signal",
                    nodeRef: myComponentRef, // Bound to the actual React Ref
                    onChange: (val) => { 
                        /* Reactive: Push update to downstream immediately */ 
                    }
                }
            ]}
            outputs={[
                {
                    label: "Heavy Compute",
                    onProcess: async () => { 
                        /* Imperative: Run as a registered job */ 
                        return await performHeavyTask();
                    }
                }
            ]}
        >
            {/* The wrapped component is the actual worker */}
            <MyWorkerComponent ref={myComponentRef} />
        </Ports>
    </Node>
</DAGFlow>
```

## 6. Tech Stack
*   **Framework**: Next.js 16, React 19+
*   **Styling**: Tailwind CSS, shadcn/ui
*   **State**: Zustand
*   **Interaction**: d3-drag, d3-zoom
