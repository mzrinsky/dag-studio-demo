# 🏗️ Distribution & Architecture Boundary

## 1. Overview
DAG Studio is architected as a three-tier stack. This separation ensures that the mathematical core is portable, the visual editor is reusable as a framework, and the final application remains a concrete implementation of a specific product.

The hierarchy is: **Data Engine** → **Visual Framework** → **Product Implementation**.

---

## 2. Tier 1: The Data Engine (The "Headless" Core)
The Engine is the source of truth. It is a state machine that manages the mathematical and structural integrity of the graph. While it is "headless" (it does not render pixels), it is **React-integrated** to allow for high-performance bindings.

### Core Responsibilities:
*   **Graph Topology**: The registry of modules, ports, and links.
*   **Validation Layer**: Cycle detection (Acyclicity) and Type Validation.
*   **State Machinery**: Managing the "Data Quad" (Default → Committed → Computed → Draft).
*   **Command Logic**: The `historyManager` and abstract `Command` pattern for undo/redo.
*   **Binding Orchestration**: Managing the lifecycle of `nodeRefs` to allow direct communication between the store and React component instances.

### Constraints:
*   **Zero Presentation**: No CSS, no DOM manipulation, and no UI layout logic. It manages *state*, not *views*.
*   **Zero Transport Dependencies**: No APIs, no WebSockets.
*   **Dependency Profile**: React (for hooks/refs), Zustand, Immer, D3-math.

---

## 3. Tier 2: The Visual Framework (The "SDK" Layer)
The Visual Framework is a UI library that wraps the Data Engine. It provides the "Module Editor" experience. A developer should be able to use this tier to build their own DAG-based tool without needing your backend.

### Core Responsibilities:
*   **The Binding Bridge**: The `<Ports>` engine and the logic connecting React Refs to the Data Engine.
*   **Visual Primitives**: The `<DAGFlow>`, `<ConnectionCanvas>`, and `<Module>` shell components.
*   **Interaction Layer**: Handling drag-and-drop, zooming, and the visual "patching" of ports.
*   **Generic UI State**: Managing z-indices, selection highlights, and canvas viewport.
*   **Theming Engine**: Providing a default visual identity and a set of themeable CSS variables or a Provider, allowing the Product layer to inject custom branding without modifying the framework core.

### Constraints:
*   **UI Primitives**: Utilizes Tailwind CSS and shadcn/ui to provide a high-quality, accessible default interface.
*   **Themeable/Extensible**: While it provides a default visual baseline, it exposes a theme engine (via CSS variables and Tailwind config) allowing the Product layer to inject custom branding without modifying the framework core.
*   **Infrastructure Blind**: It has no knowledge of where data is saved or how users are authenticated.

---

## 4. Tier 3: The Product Implementation (The Application)
The Application is the concrete "skin" and "plumbing." It is the final product that the end-user interacts with, utilizing the Visual Framework to present the Data Engine.

### Core Responsibilities:
*   **Visual Identity**: Final brand-specific styling, custom color palettes, and high-level UX orchestrations (e.g., Conflict popovers, onboarding tours).
*   **The Transport Layer**: Implementation of WebSockets/WebRTC for real-time presence and sync.
*   **Persistence Orchestration**: The server-side Event Journal and database snapshots.
*   **Business Logic (Workers)**: The actual functional code inside the modules (the specific APIs or transforms).
*   **Identity Management**: User accounts, permissions, and mapping `userIds` to `presenceColors`.

---

## 5. Summary of Separation

| Feature | Tier 1: Data Engine | Tier 2: Visual Framework | Tier 3: Product App |
| :--- | :--- | :--- | :--- |
| **Role** | The "Brain" | The "Interface" | The "Product" |
| **Analogy** | The Math | The Editor | The Software |
| **Knowledge** | Graph Theory | React & Interaction | Business & Infra |
| **State** | Topology & Values | Viewport & Selection | Persistence & Auth |
| **Styling** | None | Tailwind / shadcn/ui (Primitives) | Brand-specific Theme / Custom UX |
| **Transport** | None | None | WebSocket / API |
| **Goal** | Data Stability | Component Reusability | User Value |

### Example Flow of a "Module Move"
1.  **Product App**: User drags a module.
2.  **Visual Framework**: Captures the mouse event → Updates the coordinate in the Engine.
3.  **Data Engine**: Validates the move → Updates the state registry.
4.  **Product App**: Detects the state change → Sends the update to the `PostgresEventJournal` via API.
