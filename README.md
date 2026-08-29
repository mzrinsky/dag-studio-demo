# 🧩 DAG Studio POC: Visual Data Flow Engine

**A Next-Generation Visual Programming Framework for Complex Data Pipelines.**

DAG Studio moves beyond simple node-graph visualization. It is a specialized, high-performance framework designed to model, visualize, and execute complex, multi-stage data transformations using a highly decoupled architecture.

By strictly separating the data engine from the visual framework, DAG Studio aims to empower developers to rapidly build their own "patch cable" style interfaces for any domain—transforming complex logic into an intuitive, visual routing experience without rebuilding the underlying graph machinery.

To demonstrate this capability, the project will also serve as a comprehensive reference implementation, providing a concrete application that showcases the framework's power in a real-world scenario.

## 🎯 A Note on Intent

This project started from a simple desire to build a fun, "patch cable" style interface. Given that software like *Reason* has existed for nearly three decades, I assumed this was a solved problem. However, after searching for libraries that fit the bill, I found that most available solutions focus heavily on the visual "nodes and edges" rather than the underlying data contract.

I don't claim to have invented "Plugs & Ports"—it's likely a pattern used privately in many systems—but I couldn't find a comprehensive, public specification for it. I'm building DAG Studio because it's the system I want to use, and in doing so, I hope to provide a formalized spec that moves the conversation toward a more logical, port-centric approach. I have a deep passion for UI design and I feel this project encapsulates a lot of my ideas from over many years into one place. I hope you find it useful or at least interesting. Enjoy! 🎉

> [!IMPORTANT]
> **Work in Progress:** This project is currently in the Proof-of-Concept (POC) phase. The architectural plan and technical specifications are more mature than the current implementation. Expect rapid iterations as the vision is translated into code.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: POC](https://img.shields.io/badge/Status-POC-blue.svg)]()
[![Tech Stack](https://img.shields.io/badge/React%2019+-indigo.svg)]()

## 🤖 Development Methodology: Human-in-the-Loop AI

This project is developed using a **Human-in-the-Loop (HITL)** approach to AI augmentation:

*   **Architecture & Planning**: The high-level system design and technical specifications are co-authored by humans and AI to ensure rigorous structural integrity.
*   **Implementation**: The codebase is primarily AI-generated, guided by the strict constraints defined in `AGENTS.md`, and refined through human review and manual edits.
*   **Attribution**: Every commit is strictly tagged with the contributing AI model and parameter count (e.g., Co-authored-by: Gemma 4 31B) to maintain a transparent audit trail of human vs. AI contributions.

## ✨ Core Concept: Decoupling Presentation from Flow

The primary innovation of DAG Studio is the shift from **Edge-centric** to **Port-centric** architecture. 

While traditional node libraries (like ReactFlow) treat connections as simple lines between boxes, DAG Studio treats the graph as a *defined computational blueprint*. By centering the architecture on **Data Ports**, we introduce a strict "Contract" for every node. A port isn't just a socket; it's a typed interface that manages a **Stability Gradient**—allowing data to evolve through the **Data Quad** from a volatile draft to a verified result and finally to a persisted record.


---

## ⚙️ Architecture Deep Dive

The framework is built around five core, interconnected components:

### 1. The Hierarchy (The Flow Structure)
*   **`<DAGFlow>`**: The root context provider. Manages the global coordinate system (D3) and provides the canvas for rendering nodes and connections.
*   **`<ConnectionCanvas>`**: A pure view layer that subscribes to the global store to render SVG edges between ports.
*   **`<Node>` (Presentation Shell)**: The "dumb" container. Responsible *only* for layout and visual structure. It holds no business logic or flow state.
*   **`<Ports>` (Binding Engine)**: The intelligence layer. This component wraps the visual shell, acting as the declaration point for inputs/outputs. It defines the "API" (callbacks) that the global store will use to interact with the wrapped component.
*   **`Port` & `Plug`**: The interactive interface. A **Port** is the static connection point; a **Plug** is the active draggable entity created when a user initiates a connection from a Port.

### 2. Identity & State Management (Robustness)
To ensure stability and persistence, DAG Studio utilizes a **Centralized State Engine** (Zustand + Immer):
*   **UUID Mandate**: Every Node and Port *must* have a stable, unique ID. Array indices are strictly forbidden as keys.
*   **Global Registry**: All positions, z-indices, and connection mappings are stored in a global store (`useGraphStore`). **The Store is the sole Source of Truth and the Orchestrator of all data flow**; it decides when to trigger port callbacks based on graph dependencies.
*   **State Partitioning**: 
    *   **Transient State**: High-frequency updates (e.g., dragging) update the store directly for immediate feedback.
    *   **Committed State**: Structural changes are wrapped in a `Command` pattern for undo/redo support via a `historyManager`.
*   **Performance Ref Binding**: The `nodeRef` property binds to a direct **React Ref**, enabling the `Ports` engine to interact with component instances without triggering unnecessary re-renders.
*   **Signal Memory Strategy**: To prevent Garbage Collection spikes during high-frequency temporal flow (`onSample`), the store utilizes a **Buffer Pool (Flyweight Pattern)**. Instead of decentralized buffers, the store manages contiguous memory slabs and provides Ports with lightweight "views," ensuring O(1) access and minimal memory overhead.

### 3. Hybrid Execution Model (The Data Stability Gradient)
Unlike traditional systems that force a single execution mode, DAG Studio supports four **complementary execution modes** that operate concurrently. These modes are the mechanisms the Store uses to manage the **Data Stability Gradient**—the process of moving a value through the "Data Quad" state slots to ensure system stability:

*   🟢 **Reactive Flow (`onChange`)** $\rightarrow$ **Draft Value**
    *   **Nature**: Volatile, immediate, low-precision.
    *   **Trigger**: Triggered by the Store upon immediate change detection (e.g., UI interaction).
    *   **Use Case**: UI updates, live calculations, and real-time previews.
*   🟠 **Imperative Flow (`onProcess`)** $\rightarrow$ **Computed Value**
    *   **Nature**: Verified, high-precision, asynchronous.
    *   **Trigger**: Triggered by the Store via a global "Run" signal or dependency resolution.
    *   **Use Case**: Heavy computation, API calls, and background jobs.
*   🟣 **Temporal Flow (`onSample`)** $\rightarrow$ **Signal Value**
    *   **Nature**: High-frequency, clock-synced, stateful.
    *   **Trigger**: Triggered by a system clock/sample rate (e.g., Audio context).
    *   **Use Case**: Synthesizers, oscillators, and real-time signal processing.
*   🔵 **Persistent Flow (`onCommit`)** $\rightarrow$ **Committed Value**
    *   **Nature**: Permanent system state (The "Source of Truth").
    *   **Trigger**: Triggered by the Store upon finalization (e.g., `onBlur`, `Enter`, or "Save").
    *   **Use Case**: Database persistence and permanent configuration.

#### 🔄 The Promotion Logic
Data does not simply exist in slots; it is **promoted** based on confidence and intent:
- **Draft $\rightarrow$ Computed**: Occurs when an `onProcess` job successfully returns a high-precision result.
- **Computed $\rightarrow$ Committed**: Occurs when an `onCommit` handler persists the value to the system of record.
- **Signal $\rightarrow$ Draft**: Occurs when a temporal signal is sampled at a specific point in time for UI visualization.

**Linear Lifecycle:** `Default Value` $\rightarrow$ `Draft` $\rightarrow$ `Computed` $\rightarrow$ `Committed`.
**Temporal Cycle:** `Signal Value` $\rightleftharpoons$ `Feedback Loop` (via RingBuffer).

---

## 📚 Technical Specifications

For a detailed implementation guide on the system's advanced layers, refer to the following specification documents in `/docs/drafts`:

*   **[Distribution Boundary](docs/drafts/DISTRIBUTION_BOUNDARY.md)**: Defines the three-tier stack separation (Data Engine → Visual Framework → Product App).
*   **[UI State Management](docs/drafts/UI_STATE_MANAGEMENT.md)**: Detailed logic for the "Data Quad" (Default, Committed, Computed, Draft) and state recovery.
*   **[Collaboration State](docs/drafts/COLLABORATION_STATE.md)**: The "Soft-lock" mechanism, presence schema, and conflict resolution logic.
*   **[Collaboration UI](docs/drafts/COLLABORATION_UI.md)**: Visual requirements for remote cursors, locking masks, and conflict popovers.
*   **[Persistence Strategy](docs/drafts/PERSISTENCE_STRATEGY.md)**: The Append-Only Event Journal, snapshotting, and global state recovery.
*   **[Connection Routing](docs/drafts/CONNECTION_ROUTING.md)**: Logic for path generation (Linear, Organic, Orthogonal), the Layered Overlay Model, and dynamic performance degradation.

### 🔌 The Port Interface Contract
To ensure compatibility across the framework, every port must adhere to the following definition within the `<Ports>` binding engine:

| Property | Type | Description |
| :--- | :--- | :--- |
| `label` | `string` | The user-facing name of the port. |
| `type` | `PortType` | Strict type descriptor (Primitives or Custom IDs) used for connection validation. |
| `nodeRef` | `React.Ref` | Direct binding to the inner component instance. |
| `onChange?` | `(val: T) => void` | Handler for reactive, event-driven updates. |
| `onProcess?` | `() => Promise<T>` | Handler for asynchronous, high-precision jobs. |
| `onSample?` | `(state: RingBuffer) => T` | Handler for clock-synced signal generation. |
| `onCommit?` | `(val: T) => void` | Handler for permanent state persistence. |

---

## 📜 Developer Guardrails (The Laws)

To maintain the integrity of the graph, all contributions must follow these laws:

1.  **Law of Decoupling**: Business logic *never* lives in `<Node>`. It belongs in the `Ports` declaration, the store actions, or the wrapped worker component.
2.  **Law of Binding**: Every data ingress or egress point must be explicitly declared within the `<Ports>` metadata.
3.  **Law of Identity**: Never rely on array indices for keys; always use UUIDs.
4.  **Law of Execution**: Long-running tasks **must** use `onProcess` to protect the main UI thread.
5. **Law of Strict Typing**: Every port **must** have an explicit type descriptor. The Store performs a compatibility check between the source output and target input using these descriptors to prevent invalid data flows. This system supports both built-in primitives and user-defined custom types.
6.  **Law of Contextual Acyclicity**: The system manages cycles based on the execution context to ensure stability:
    *   **Reactive Flow (`onChange`)**: Cycles are permitted but governed by a "Circuit Breaker" (max propagation depth) to prevent browser-locking infinite loops.
    *   **Imperative Flow (`onProcess`)**: Strict DAG (Directed Acyclic Graph) enforcement is required. The engine must block or flag cycles during the topological sort to ensure jobs have a deterministic termination point.
    *   **Temporal Flow (`onSample`)**: Cycles are explicitly permitted as "Feedback Loops," utilizing state-buffering from the previous frame ($t-1$) to maintain mathematical stability.

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
                    onChange: (val) => { /* Reactive: Immediate push */ },
                    onSample: (buf) => { /* Temporal: Clock-synced audio/signal */ }
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