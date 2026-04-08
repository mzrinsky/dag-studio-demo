# 🧩 DAG Studio POC: Visual Data Flow Engine

**A Next-Generation Visual Programming Framework for Complex Data Pipelines.**

DAG Studio moves beyond simple node-graph visualization. It is a specialized, high-performance framework designed to model, visualize, and execute complex, multi-stage data transformations using a highly decoupled architecture.

> [!IMPORTANT]
> **Work in Progress:** This project is currently in the Proof-of-Concept (POC) phase. The architectural plan and technical specifications are more mature than the current implementation. Expect rapid iterations as the vision is translated into code.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: POC](https://img.shields.io/badge/Status-POC-blue.svg)]()
[![Tech Stack](https://img.shields.io/badge/React%2019+-indigo.svg)]()

## ✨ Core Concept: Decoupling Presentation from Flow

The primary innovation of DAG Studio is the strict architectural separation between **what the node looks like** (Presentation) and **how it processes data** (Binding/Execution). We treat the graph not just as a drawing, but as a *defined computational blueprint*.

---

## ⚙️ Architecture Deep Dive

The framework is built around four core, interconnected components:

### 1. The Hierarchy (The Flow Structure)
*   **`<DAGFlow>`**: The root context provider. Manages global systems like the coordinate system (D3), connection manager (edges), node manager (z-index/layout), and the `historyManager` (undo/redo).
*   **`<Node>` (Presentation Shell)**: The "dumb" container. Responsible *only* for layout and visual structure. It holds no business logic or flow state.
*   **`<Ports>` (Binding Engine)**: The intelligence layer. This component wraps the visual shell, acting as the declaration point for inputs/outputs and bridging the component's internal state to the global graph.
*   **`<Handle>`**: The physical, interactive connection points.

### 2. Identity & State Management (Robustness)
To ensure stability across React re-renders, we enforce a **Self-Registering Identity** pattern:
*   **UUID Mandate**: Every Node and Port *must* have a stable, unique ID to prevent reconciliation errors.
*   **Zustand Global Registry**: All positions and states are globally registered, allowing the system to track dependencies without relying on the ephemeral React component tree.
*   **State Partitioning**: The system distinguishes between *Transient State* (e.g., dragging) and *Committed State* (e.g., node placed) to optimize history and undo/redo performance.
*   **Performance Ref Binding**: The `nodeRef` property binds to a direct **React Ref**, enabling the `Ports` engine to read high-frequency data changes directly from the component instance, bypassing unnecessary re-renders.

### 3. Hybrid Execution Model (Computational Depth)
We support two concurrent data-flow modes to balance responsiveness with heavy processing:

*   🟢 **Reactive Flow (`onChange`)**:
    *   **Trigger**: Immediate change detection.
    *   **Use Case**: UI updates, live calculations, sliders, and real-time previews.
    *   **Behavior**: Data propagates immediately as a stream through the graph.
*   🟠 **Imperative Flow (`onProcess`)**:
    *   **Trigger**: Manual user action (e.g., "Run" button) or scheduled events.
    *   **Use Case**: Heavy computation, API calls, and long-running background jobs.
    *   **Behavior**: Operations are registered as asynchronous "Jobs," waiting for prerequisite dependencies to resolve before execution.

---

## 📜 Developer Guardrails (The Laws)

To maintain the integrity of the graph, all contributions must follow these laws:

1.  **Law of Decoupling**: Business logic *never* lives in `<Node>`. It belongs in the `Ports` declaration or the wrapped worker component.
2.  **Law of Binding**: Every data ingress or egress point must be explicitly declared within the `<Ports>` metadata.
3.  **Law of Identity**: Never rely on array indices for keys; always use UUIDs.
4.  **Law of Execution**: Long-running tasks **must** use `onProcess` to protect the main UI thread.
5.  **Law of Gradual Typing**: Port types are optional (defaulting to `any`) to allow rapid prototyping, but should be added incrementally to enhance stability.

---

## 🚀 Implementation Example (Pseudo-Code)

```jsx
<DAGFlow connectionManager={connManager} nodeManager={nodeManager}>
    <Node connectionManager={connManager} nodeManager={nodeManager}>
        <Ports
            connectionManager={connManager} nodeManager={nodeManager}
            inputs={[
                {
                    label: "Live Signal",
                    type: "number", // Optional: ConnectionManager prevents invalid links
                    nodeRef: myComponentRef, 
                    onChange: (val) => { /* Reactive: Immediate push */ }
                }
            ]}
            outputs={[
                {
                    label: "Heavy Compute",
                    onProcess: async () => { 
                        /* Imperative: Runs as a registered job */
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

## 🛠️ Tech Stack

*   **Framework**: Next.js 16, React 19+
*   **Styling**: Tailwind CSS, shadcn/ui
*   **State Management**: Zustand
*   **Interaction/Layout**: d3-drag, d3-zoom

***
*Disclaimer: This repository represents a Proof of Concept (POC). The architectural vision described above is the target goal for the current implementation.*