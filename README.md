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

The framework is built around five core, interconnected components:

### 1. The Hierarchy (The Flow Structure)
*   **`<DAGFlow>`**: The root context provider. Manages the global coordinate system (D3) and provides the canvas for rendering nodes and connections.
*   **`<ConnectionCanvas>`**: A pure view layer that subscribes to the global store to render SVG edges between ports.
*   **`<Node>` (Presentation Shell)**: The "dumb" container. Responsible *only* for layout and visual structure. It holds no business logic or flow state.
*   **`<Ports>` (Binding Engine)**: The intelligence layer. This component wraps the visual shell, acting as the declaration point for inputs/outputs and bridging the component's internal state to the global graph.
*   **`<Handle>`**: The physical, interactive connection points.

### 2. Identity & State Management (Robustness)
To ensure stability and persistence, DAG Studio utilizes a **Centralized State Engine** (Zustand + Immer):
*   **UUID Mandate**: Every Node and Port *must* have a stable, unique ID. Array indices are strictly forbidden as keys.
*   **Global Registry**: All positions, z-indices, and connection mappings are stored in a global store (`useGraphStore`), allowing logic to exist independently of the React component tree.
*   **State Partitioning**: 
    *   **Transient State**: High-frequency updates (e.g., dragging) update the store directly for immediate feedback.
    *   **Committed State**: Structural changes are wrapped in a `Command` pattern for undo/redo support via a `historyManager`.
*   **Performance Ref Binding**: The `nodeRef` property binds to a direct **React Ref**, enabling the `Ports` engine to interact with component instances without triggering unnecessary re-renders.

### 3. Hybrid Execution Model (Computational Depth)
We support three concurrent data-flow modes to balance responsiveness, persistence, and heavy processing:

*   🟢 **Reactive Flow (`onChange`)**:
    *   **Trigger**: Immediate change detection.
    *   **Use Case**: UI updates, live calculations, and real-time previews.
    *   **Behavior**: Data propagates immediately as a stream through the graph.
*   🟠 **Imperative Flow (`onProcess`)**:
    *   **Trigger**: Manual user action (e.g., "Run" button) or scheduled events.
    *   **Use Case**: Heavy computation, API calls, and long-running background jobs.
    *   **Behavior**: Operations are registered as asynchronous "Jobs," waiting for prerequisite dependencies to resolve.
*   🔵 **Persistent Flow (`onCommit`)**:
    *   **Trigger**: Finalization (e.g., `onBlur`, `Enter` key, or explicit "Save").
    *   **Use Case**: Database persistence, saving user settings, or permanent configuration updates.
    *   **Behavior**: Transitions a "Draft" value to a "Committed" state.

---

## 📜 Developer Guardrails (The Laws)

To maintain the integrity of the graph, all contributions must follow these laws:

1.  **Law of Decoupling**: Business logic *never* lives in `<Node>`. It belongs in the `Ports` declaration, the store actions, or the wrapped worker component.
2.  **Law of Binding**: Every data ingress or egress point must be explicitly declared within the `<Ports>` metadata.
3.  **Law of Identity**: Never rely on array indices for keys; always use UUIDs.
4.  **Law of Execution**: Long-running tasks **must** use `onProcess` to protect the main UI thread.
5.  **Law of Strict Typing**: Every port **must** have an explicit type. Type validation is performed in the store during connection creation to prevent invalid data flows.

---

## 🚀 Implementation Example (Pseudo-Code)

```jsx
<DAGFlow>
    <ConnectionCanvas />
    <Node>
        <Ports
            inputs={[
                {
                    label: "Live Signal",
                    type: "number", // REQUIRED: Type must be explicitly defined
                    nodeRef: myComponentRef, 
                    onChange: (val) => { /* Reactive: Immediate push */ }
                }
            ]}
            outputs={[
                {
                    label: "Heavy Compute",
                    type: "string", // REQUIRED: Type must be explicitly defined
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
*   **State Management**: Zustand (with Immer and Persist middleware)
*   **Interaction/Layout**: d3-drag, d3-zoom

***
*Disclaimer: This repository represents a Proof of Concept (POC). The architectural vision described above is the target goal for the current implementation.*