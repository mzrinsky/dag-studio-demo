# 🧩 DAG Studio POC: Visual Data Flow Engine

**A Next-Generation Visual Programming Framework for Complex Data Pipelines.**

DAG Studio moves beyond simple node-graph visualization. It is a specialized, high-performance framework designed to model, visualize, and execute complex, multi-stage data transformations using a highly decoupled architecture.

> [!IMPORTANT]
> **Work in Progress:** This project is currently in the Proof-of-Concept (POC) phase. The architectural plan and technical specifications are more mature than the current implementation. Expect rapid iterations as the vision is translated into code.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: POC](https://img.shields.io/badge/Status-POC-blue.svg)]()
[![Tech Stack](https://img.shields.io/badge/React%2019+-indigo.svg)]()

## 🤖 Development Methodology: Human-in-the-Loop AI

This project is developed using a **Human-in-the-Loop (HITL)** approach to AI augmentation:

*   **Architecture & Planning**: The high-level system design and technical specifications are co-authored by humans and AI to ensure rigorous structural integrity.
*   **Implementation**: The codebase is primarily AI-generated, guided by the strict constraints defined in `AGENTS.md`, and refined through human review and manual edits.
*   **Transparency**: To maintain a clear audit trail, all commits are attributed to the specific AI model used during that iteration.

## ✨ Core Concept: Decoupling Presentation from Flow

The primary innovation of DAG Studio is the shift from **Edge-centric** to **Port-centric** architecture. 

While traditional node libraries (like ReactFlow) treat connections as simple lines between boxes, DAG Studio treats the graph as a *defined computational blueprint*. By centering the architecture on **Data Ports**, we introduce a strict "Contract" for every node. A port isn't just a socket; it's a typed interface that manages a **stability gradient**—allowing data to evolve from a volatile draft to a verified result and finally to a persisted record.

---

## ⚙️ Architecture Deep Dive

The framework is built around four core, interconnected components:

### 1. The Hierarchy (The Flow Structure)
*   **`<DAGFlow>`**: The root context provider. Manages the global coordinate system (D3) and provides the canvas for rendering nodes and connections.
*   **`<ConnectionCanvas>`**: A pure view layer that subscribes to the global store to render SVG edges between ports.
*   **`<Node>` (Presentation Shell)**: The "dumb" container. Responsible *only* for layout and visual structure. It holds no business logic or flow state.
*   **`<Ports>` (Binding Engine)**: The intelligence layer. This component wraps the visual shell, acting as the declaration point for inputs/outputs and bridging the component's internal state to the global graph.
*   **`Port` & `Plug`**: The interactive interface. A **Port** is the static connection point; a **Plug** is the active draggable entity created when a user initiates a connection from a Port.

### 2. Identity & State Management (Robustness)
To ensure stability and persistence, DAG Studio utilizes a **Centralized State Engine** (Zustand + Immer):
*   **UUID Mandate**: Every Node and Port *must* have a stable, unique ID. Array indices are strictly forbidden as keys.
*   **Global Registry**: All positions, z-indices, and connection mappings are stored in a global store (`useGraphStore`), allowing logic to exist independently of the React component tree.
*   **State Partitioning**: 
    *   **Transient State**: High-frequency updates (e.g., dragging) update the store directly for immediate feedback.
    *   **Committed State**: Structural changes are wrapped in a `Command` pattern for undo/redo support via a `historyManager`.
*   **Performance Ref Binding**: The `nodeRef` property binds to a direct **React Ref**, enabling the `Ports` engine to interact with component instances without triggering unnecessary re-renders.

### 3. Hybrid Execution Model (The Data Lifecycle)
Unlike traditional systems that force a single execution mode, DAG Studio supports three concurrent flows. These are **complementary**, allowing a single port to handle different stages of data maturity:

*   🟢 **Reactive Flow (`onChange`)** → **Draft Value**
    *   **Trigger**: Immediate change detection.
    *   **Use Case**: UI updates, live calculations, and real-time previews.
    *   **Behavior**: High-frequency, low-precision data streams.
*   🟠 **Imperative Flow (`onProcess`)** → **Computed Value**
    *   **Trigger**: Manual action (e.g., "Run") or dependency resolution.
    *   **Use Case**: Heavy computation, API calls, and background jobs.
    *   **Behavior**: High-precision results processed as asynchronous "Jobs."
*   🔵 **Persistent Flow (`onCommit`)** → **Committed Value**
    *   **Trigger**: Finalization (e.g., `onBlur`, `Enter`, or "Save").
    *   **Use Case**: Database persistence and permanent configuration.
    *   **Behavior**: Transitions a verified result into a permanent system state.

---

## 📚 Technical Specifications

For a detailed implementation guide on the system's advanced layers, refer to the following specification documents in `/docs/drafts`:

*   **[Distribution Boundary](docs/drafts/DISTRIBUTION_BOUNDARY.md)**: Defines the three-tier stack separation (Data Engine → Visual Framework → Product App).
*   **[UI State Management](docs/drafts/UI_STATE_MANAGEMENT.md)**: Detailed logic for the "Data Quad" (Default, Committed, Computed, Draft) and state recovery.
*   **[Collaboration State](docs/drafts/COLLABORATION_STATE.md)**: The "Soft-lock" mechanism, presence schema, and conflict resolution logic.
*   **[Collaboration UI](docs/drafts/COLLABORATION_UI.md)**: Visual requirements for remote cursors, locking masks, and conflict popovers.
*   **[Persistence Strategy](docs/drafts/PERSISTENCE_STRATEGY.md)**: The Append-Only Event Journal, snapshotting, and global state recovery.
*   **[Connection Routing](docs/drafts/CONNECTION_ROUTING.md)**: Logic for path generation (Linear, Organic, Orthogonal), the Layered Overlay Model, and dynamic performance degradation.

---


## 📜 Developer Guardrails (The Laws)

To maintain the integrity of the graph, all contributions must follow these laws:

1.  **Law of Decoupling**: Business logic *never* lives in `<Node>`. It belongs in the `Ports` declaration, the store actions, or the wrapped worker component.
2.  **Law of Binding**: Every data ingress or egress point must be explicitly declared within the `<Ports>` metadata.
3.  **Law of Identity**: Never rely on array indices for keys; always use UUIDs.
4.  **Law of Execution**: Long-running tasks **must** use `onProcess` to protect the main UI thread.
5.  **Law of Strict Typing**: Every port **must** have an explicit type. Type validation is performed in the store during connection creation to prevent invalid data flows.
6.  **Law of Acyclicity**: To prevent infinite loops in Reactive Flow, the system must block any connection that creates a closed loop across the graph (excluding internal node feedback). This ensures that real-time data streams remain stable and cannot crash the browser.

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

---

## 💖 Support & Sustainability

DAG Studio is an ambitious open-source project. To keep the development momentum and maintain the high architectural standards required for this framework, support is greatly appreciated.

### ☕ Individual Support
If DAG Studio is helpful to your workflow, consider buying me a coffee!
[![ko-fi](https://img.shields.io/badge/Ko-fi-f16233?style=for-the-badge&logo=ko-fi&logoColor=white&color=ff005c)](https://ko-fi.com/creamcitymatt)

### 🏢 Corporate Sponsorship
If your organization is building AI orchestration tools or complex data pipelines and would like to sponsor development, please [open a sponsorship issue](https://github.com/mzrinsky/dag-studio-demo/issues/new?template=sponsorship.yml) or reach out via [LinkedIn](https://www.linkedin.com/in/matt-zrinsky).

---

## 🎨 Inspirations & Lineage

DAG Studio stands on the shoulders of giants. The architectural philosophy of this project is heavily inspired by the elegance of immediate-mode GUIs and the robustness of professional node-based editors:

*   **Reason**: The pioneering influence of "patch cable" style software connectivity and modular signal routing.
*   **Dear ImGui**: For the philosophy of high-performance, state-driven UI.
*   **Tweakpane & dat.GUI**: For the mastery of compact, intuitive control interfaces.
*   **LightGraph.js**: For the foundational approach to visual graph connectivity.
*   **ComfyUI**: For demonstrating the power of DAGs in generative AI workflows.

***
*Disclaimer: This repository represents a Proof of Concept (POC). The architectural vision described above is the target goal for the current implementation.*