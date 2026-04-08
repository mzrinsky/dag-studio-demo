# 🧩 DAG Studio POC: Visual Data Flow Engine

**A Next-Generation Visual Programming Framework for Complex Data Pipelines.**

DAG Studio moves beyond simple node-graph visualization. It is a specialized, high-performance framework designed to model, visualize, and execute complex, multi-stage data transformations using a highly decoupled architecture.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: POC](https://img.shields.io/badge/Status-POC-blue.svg)]()
[![Tech Stack](https://img.shields.io/badge/React%2019+-indigo.svg)]()

## ✨ Core Concept: Decoupling Presentation from Flow

The primary innovation of DAG Studio is the strict architectural separation between **what the node looks like** (Presentation) and **how it processes data** (Binding/Execution). We treat the graph not just as a drawing, but as a *defined computational blueprint*.

---

## ⚙️ Architecture Deep Dive

The framework is built around four core, interconnected components:

### 1. The Hierarchy (The Flow Structure)
*   **`<DAGFlow>`**: The root context provider. Manages global systems like the coordinate system (D3) and the central Connection/Node managers.
*   **`<Node>` (Presentation Shell)**: The "dumb" container. Responsible *only* for layout and visual structure. It holds no business logic or flow state itself.
*   **`<Ports>` (Binding Engine)**: The intelligence layer. This component wraps the visual shell, acting as the declaration point for inputs/outputs and bridging the component's internal state to the global graph state.
*   **`<Handle>`**: The physical, interactive connection points.

### 2. Identity & State Management (Robustness)
To ensure stability across React re-renders, we enforce a **Self-Registering Identity** pattern:
*   **UUID Mandate**: Every Node and Port *must* have a stable, unique ID.
*   **Zustand Global Registry**: All positions and states are globally registered in a Zustand store, allowing connection managers to track dependencies outside the ephemeral React component tree.
*   **Performance Ref Binding**: The `nodeRef` property is specifically designed to bind to a direct **React Ref**, enabling the `Ports` engine to read high-frequency data changes directly from the underlying component instance without causing unnecessary re-renders.

### 3. Hybrid Execution Model (Computational Depth)
We support two fundamentally different ways data can flow:

*   🟢 **Reactive Flow (`onChange`)**:
    *   **Trigger**: Immediate change detection.
    *   **Use Case**: UI updates, live calculations (e.g., a slider reading a value).
    *   **Behavior**: Data propagates immediately as a stream.
*   🟠 **Imperative Flow (`onProcess`)**:
    *   **Trigger**: Manual user action (e.g., clicking "Run").
    *   **Use Case**: Heavy computation, API calls, background jobs.
    *   **Behavior**: The operation is registered as an asynchronous "Job," waiting for prerequisites to resolve before execution.

---

## 📜 Developer Guardrails (The Laws)

These laws enforce predictable and maintainable code:

1.  **Law of Decoupling**: Business logic *never* lives in `<Node>`. It belongs in the `Ports` declaration or the wrapped worker component.
2.  **Law of Binding**: Every data ingress or egress point must be explicitly declared within the `<Ports>` metadata.
3.  **Law of Identity**: Never rely on array indices for keys; always use UUIDs.
4.  **Law of Execution**: Long-running tasks **must** use `onProcess` to protect the main UI thread.

---

## 🚀 Implementation Example (Pseudo-Code Context)

```jsx
// The framework handles UUID registration and Zustand synchronization automatically.
<DAGFlow connectionManager={connManager} nodeManager={nodeManager}>
    <Node connectionManager={connManager} nodeManager={nodeManager}>
        <Ports
            connectionManager={connManager} nodeManager={nodeManager}
            inputs={[
                {
                    label: "Live Signal",
                    nodeRef: myComponentRef, // Direct Ref Binding for performance
                    onChange: (val) => { 
                        // Reactive: Immediate push update
                    }
                }
            ]}
            outputs={[
                {
                    label: "Heavy Compute",
                    onProcess: async () => { 
                        // Imperative: Registers a background Job
                        return await performHeavyTask();
                    }
                }
            ]}
        >
            {/* The wrapped component contains the actual worker logic */}
            <MyWorkerComponent ref={myComponentRef} />
        </Ports>
    </Node>
</DAGFlow>
```

## 🛠️ Tech Stack

*   **Framework**: Next.js 16, React 19+
*   **Styling**: Tailwind CSS, shadcn/ui
*   **State Management**: Zustand
*   **Interaction/Layout**: d3-drag, d3-zoom

***
*Disclaimer: This repository represents a Proof of Concept (POC) adhering to the detailed technical specification provided.*