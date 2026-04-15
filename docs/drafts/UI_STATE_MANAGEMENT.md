# 🖥️ DAG Studio UI State Specification

## 1. Overview
The DAG Studio UI is not a direct reflection of a single value, but a window into the **Data Quad**. To provide a professional-grade editing experience, the UI must leverage the four states of any given Port to allow users to navigate through different versions of their data without destructive loss.

### The Data Quad Reference
Every Port manages four distinct value states:
1. **Default**: The factory/template value.
2. **Committed**: The last saved/persisted value.
3. **Computed**: The result of the current graph execution (`onProcess`).
4. **Draft**: The current volatile value in the input field (`onChange`).

## 2. State-Driven UI Controls
The UI should provide explicit "Recovery" and "Reset" actions based on the delta between these four states.

### A. Revert to Default (The Hard Reset)
*   **Trigger**: A "Reset" icon (e.g., a counter-clockwise arrow) appearing when `Draft !== Default`.
*   **Action**: Overwrites the `Draft` and `Committed` values with the `Default` value.
*   **Visual Cue**: The icon is dimmed if the current value already matches the default.

### B. Revert to Committed (The Undo/Cancel)
*   **Trigger**: A "Discard Changes" option appearing when `Draft !== Committed`.
*   **Action**: Overwrites the `Draft` value with the last `Committed` value.
*   **Use Case**: User made several changes in the UI but decides they prefer the state of the last successful save.

### C. Accept Computed (The Update)
*   **Trigger**: An "Apply Result" button appearing when `Computed !== Draft`.
*   **Action**: Promotes the `Computed` value (the output of a heavy process) to the `Draft` value.
*   **Use Case**: A user runs a heavy computation via `onProcess`; once the result is ready, they can choose to adopt that result as their new working value.

## 3. Visual Indicators of State Divergence
To avoid user confusion, the UI must visually signal *which* state is currently being viewed or edited.

| Condition | Visual Indicator | Meaning |
| :--- | :--- | :--- |
| `Draft !== Committed` | Subtle amber underline | "Unsaved Changes" |
| `Draft !== Default` | Small "modified" dot | "Customized from Default" |
| `Computed` is updating | Pulsing loader in Port | "Processing updated value..." |
| `Draft === Committed === Default` | Neutral state | "Clean/Pristine State" |

## 4. Interaction Flow for Recovery
When a user interacts with a Port's value, the UI follows this lifecycle:

1.  **Interaction**: User types → `Draft` updates → UI shows "Unsaved Changes" indicator.
2.  **Decision Point**: 
    *   **Save**: User hits Enter/Blur → `onCommit` triggers → `Committed` = `Draft`.
    *   **Revert**: User clicks "Revert" → `Draft` = `Committed` → UI returns to neutral.
    *   **Reset**: User clicks "Reset" → `Draft` = `Default` → UI returns to pristine.

## 5. Integration with Collaboration
In a multi-user environment, the "Revert" functionality extends to the remote state:
*   **Revert to Remote**: If a conflict is detected, the user can choose to discard their local `Draft` and adopt the `Committed` value currently held in the global state by another user.