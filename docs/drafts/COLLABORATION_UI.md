# 🎨 Collaboration UI Specification

## 1. Presence Visualization
* **Remote Cursors**: Rendered as a pointer icon with a label containing the `userName`, colored by `presenceColor`.
* **Activity Indicators**: Users currently editing a field are indicated by a subtle glow or border around the specific Port/Input.

## 2. Locking Visuals
When an object is locked by another user, the UI must prevent interaction and provide feedback.

* **The Lock Mask**: A semi-transparent overlay or specific border style (e.g., dashed border in `presenceColor`) applied to the locked `Module` or `Port`.
* **Interaction Guard**: 
    * Locked objects are non-draggable.
    * Input fields for locked ports are set to `read-only`.
    * Tooltips appear on hover: *"Locked by [User Name]"*.

## 3. Conflict Resolution Interface
When `hasRemoteUpdate: true`, the UI must guide the user to resolve the discrepancy.

* **Visual Cue**: A "Conflict" icon (e.g., a pulsing orange dot) appears next to the Port label.
* **Resolution Popover**: Clicking the icon opens a small menu presenting:
    * **Option A (Overwrite)**: "Use my version" → Pushes local draft.
    * **Option B (Accept)**: "Use remote version" → Adopts remote value.
    * **Comparison**: A side-by-side view of the local vs. remote value.

## 4. Spatial Conflict Feedback
If a user attempts to move a module that is locked by another user, the UI provides a "bounce" animation or a "shake" effect to indicate the action is blocked.
