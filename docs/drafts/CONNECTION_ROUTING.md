# 🔌 Connection Routing Specification

## 1. Architectural Philosophy: The "View-Only" Path
The global state store tracks connections as a simple mapping: `Connection { sourcePortId, targetPortId }`. It does **not** store the SVG path data. 

The `ConnectionCanvas` is responsible for calculating the path in real-time based on the current spatial coordinates of the Ports. This ensures that as nodes move, the lines update fluidly without needing to commit "path updates" to the global state engine.

## 2. Routing Strategies
To support different user preferences and visual styles, the Routing Engine supports multiple path-generation strategies, categorized by their behavior and visual intent.

### A. Linear & Direct
*   **The "Straight Line"**: A simple `M x1 y1 L x2 y2`. Minimalist; used for very short distances or as the absolute final fallback.
*   **The "Cable" (Catenary)**: A visual approximation of a hanging cable using a quadratic or cubic Bezier curve. Rather than a real-time physics simulation, the "sag" is calculated as a fixed or distance-based offset of the control point on the Y-axis.
*   **Logic**: "Linear" routing is a composite strategy. The system selects the specific path based on distance, unless forced:
    *   **Very Short ($\le$ 20px)**: Straight Line.
    *   **Short to Medium ($>$ 20px)**: Cable.
*   **Visual Intent**: These are "Over-the-Top" routes—they typically ignore obstacles and cut across the UI.

### B. The "Organic" Cubic Bezier
*   **Logic**: A cubic Bezier curve with two control points offset horizontally (typically 50%).
*   **Visual**: Smooth, "swooping" lines.
*   **Best for**: General purpose, clean look.

### C. The "Orthogonal" Manhattan Route
*   **Logic**: Lines consist only of 90-degree angles. This implementation uses **Smart Routing** (A*), but is subject to a strict **Computational Budget** (Max Iterations).
*   **Visual**: Circuit-board style.
*   **Best for**: Dense logic graphs.
*   **Failure Pipeline**: To ensure system stability, Orthogonal routing follows a mandatory degradation path: `Smart Routing (A*)` $\rightarrow$ `Standard Manhattan (Ignore Collisions)` $\rightarrow$ `Linear`.

### D. The "Manual" Custom Route
*   **Logic**: A series of user-defined waypoints.
*   **Calculation**: `M x1 y1 L wx1 wy1 L wx2 wy2 ... L x2 y2`.
*   **Visual**: Precise, user-curated paths.
*   **State Storage**: To keep the core graph logic clean, waypoint coordinates are **not** stored in the primary `connections` array. Instead, they are persisted in a `shallow` `connectionMetadata` object within the `useGraphStore`, keyed by the connection's unique ID.

### 3. Routing Hierarchy & Overrides
To balance administrative control with user flexibility, routing is determined by a priority stack. The system evaluates from top to bottom, using the first defined value it encounters:

1.  **Administrative Enforcement (Highest Priority)**: 
    *   **Scope**: Graph-wide or Connection-specific.
    *   **Persistence**: Stored in the **Global State Engine** (via `useGraphStore` and persisted to the database). These locks are immutable for the end-user.
    *   **Use Case**: Ensuring a professional, standardized look for shared organizational templates.

2.  **User-Specific Override (Medium Priority)**:
    *   **Per-Route**: A user manually changes the style of a single connection.
    *   **Global Preference**: A user's general routing preference.
    *   **Persistence**: By default, stored in **Local Storage**. However, users may explicitly "Save/Commit" these preferences to the **Global State Engine** (Persistent State) to share their layout with others, provided no Administrative Lock is active.
    *   **Logic**: Only applied if **no** Administrative Enforcement is active.

3.  **Graph Default (Lowest Priority)**:
    *   **Scope**: Graph-wide or Connection-specific.
    *   **Logic**: The fallback value defined by the creator of the graph, or defined by the port.

**Evaluation Order:**
`Admin Lock` $\rightarrow$ `User Per-Route Setting` $\rightarrow$ `User Global Preference` $\rightarrow$ `Graph Default`

## 4. Special Routing Cases & Visual Feedback

### A. Connection Validation (Law of Acyclicity)
To enforce the Law of Acyclicity, the routing engine provides immediate visual feedback during the "Plug" phase:
*   **Invalid Target**: If a user hovers a plug over a port that would create a forbidden loop, the "Ghost Path" turns red and the target Port enters a **"Forbidden" state** (e.g., a red 'X' overlay and high-contrast red border).
*   **Bidirectional Warning**: Simultaneously, the source Port from which the plug originated should receive a "Warning" visual state to notify the user that the current connection attempt is invalid.
*   **Invalid Drop**: Any attempt to commit a connection that violates graph laws is silently rejected by the store, and the plug snaps back to the origin port.

### B. Proximity & Short-Circuiting
*   **Short-Route Threshold**: A global distance threshold (e.g., 50px) is defined. 
*   **Universal Fallback**: If the distance between ports falls below this threshold, OR if a complex routing algorithm (A*) exceeds its computational budget, the system automatically forces the **Linear** composite strategy (Straight Line vs. Cable based on the distance logic in Section 2.A). This ensures that connection visibility is never sacrificed for aesthetic routing.

### C. The Active Plug (Ghost Path)
While a user is dragging a new connection from a port but has not yet dropped it, the routing defaults to the **"Cable" (Catenary)** style. This provides a tactile, fluid feel during the creation process, regardless of the final routing preference.

### D. Anchor Point Offsets
*   **Anchor Point Offsets**: Routing calculations must not use the center coordinates of the Port element. Instead, they must use the **Anchor Point** (the specific edge/socket of the port). This ensures lines originate from the boundary of the node, preventing visual overlap with the node's internal content.
*   **Orthogonal Fallback**: In the event that the Smart Routing (A*) cannot find a valid path that avoids node occlusion, the system will fallback to a **Standard Manhattan Route** (90-degree angles, ignoring collisions) to ensure the connection is always visible.

## 5. Performance & Dynamic Degradation
Since recalculating 100+ Bezier curves or A* paths every frame during a node drag is expensive, the system employs **Dynamic Degradation**:

1.  **Drag-State Fallback**: When any node involved in a connection is in an `active-drag` state, the Routing Engine temporarily disables "Smart Routing" (A*) and "Manual" waypoints, falling back to **Organic Cubic Bezier** or **Linear** paths.
2.  **Re-Calculation Trigger**: The expensive A* pathfinding is only re-triggered `onDragEnd`.
3.  **Memoized Coordinates**: Use a selector to only trigger re-renders of lines connected to the node currently being moved.
4.  **SVG Grouping**: Wrap all connections in a single `<g>` element to minimize DOM overhead.
5.  **CSS Transitions**: Apply a slight `transition: d 0.1s ease-out` to the `d` attribute of the paths to smooth out jitter during fast movements.

## 6. Layering & Overlay Architecture
To avoid expensive DOM re-stacking and flickering during high-frequency interactions, the system utilizes a **Layered Overlay Model**. Rather than a unified render list, the `ConnectionCanvas` is split into three distinct Z-axis planes:

### A. The Base Layer (Background)
*   **Content**: All standard, inactive connections.
*   **Z-Index Logic**: This layer sits behind all `<Node>` components.
*   **Behavior**: Purely passive. It renders the bulk of the graph's wiring.

### B. The Node Layer (Midground)
*   **Content**: The `<Node>` components and their internal `<Ports>`.
*   **Z-Index Logic**: Managed by the `useGraphStore` (Bring to Front).

### C. The Interaction Overlay (Foreground)
*   **Content**: Selected connections, hovered paths, and the "Active Plug" (Ghost Path).
*   **Z-Index Logic**: This is a transparent SVG overlay that sits on top of the entire canvas.
*   **Dynamic Promotion**: When a connection is hovered or selected, it is **not** moved in the DOM. Instead:
    1.  The path is rendered in the Base Layer with a "muted" style.
    2.  A **duplicate path** is mirrored onto the Interaction Overlay.
    3.  The Overlay version applies "Active" styles (e.g., pulsing animations, increased stroke width, high-contrast colors).
*   **Event Delegation**: To prevent "phantom clicks," all mirrored paths must carry a `data-connection-id` attribute. The Interaction Overlay implements a single event listener that intercepts interactions and maps the `connectionId` back to the global state engine, ensuring that the logical connection is targeted regardless of which visual layer was touched.
*   **Benefit**: This allows for complex CSS animations (like a flowing data pulse) to be applied to the overlay path without affecting the performance of the rest of the graph.

## 7. Connection Z-Index Inheritance
To ensure visual consistency, the "depth" of a connection's influence is derived from its endpoints:

1.  **Depth Calculation**: A connection's implicit Z-index is $\max(\text{sourceNode.zIndex}, \text{targetNode.zIndex})$.
2.  **Visual Parity**: If a node is brought to the front, the connections attached to it do not necessarily move to the foreground (unless selected), but they are logically grouped with that node's spatial priority for the purpose of occlusion calculations in Orthogonal routing.
