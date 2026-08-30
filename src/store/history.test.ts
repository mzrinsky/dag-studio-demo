import { describe, it, expect, beforeEach } from "vitest";
import { useGraphStore } from "./useGraphStore";
import { setupStoreMock, resetStore } from "./test-utils";

setupStoreMock();

describe("History Slice", () => {
  beforeEach(() => resetStore());

  it("should undo and redo module creation", () => {
    const module = {
      id: "n1",
      position: { x: 0, y: 0 },
      zIndex: 1,
      type: "test",
    };
    const ports = [
      {
        id: "p1",
        moduleId: "n1",
        label: "p1",
        type: "any",
        direction: "in",
        defaultValue: 0,
        committedValue: 0,
        draftValue: 0,
        computedValue: 0,
      },
    ];

    // Action
    useGraphStore.getState().addModule(module, ports);
    expect(useGraphStore.getState().modules["n1"]).toBeDefined();

    // Undo
    useGraphStore.getState().undo();
    expect(useGraphStore.getState().modules["n1"]).toBeUndefined();

    // Redo
    useGraphStore.getState().redo();
    expect(useGraphStore.getState().modules["n1"]).toBeDefined();
  });

  it("should clear forward history when a new action is performed after undo", () => {
    const module1 = {
      id: "n1",
      position: { x: 0, y: 0 },
      zIndex: 1,
      type: "test",
    };
    const ports1 = [
      {
        id: "p1",
        moduleId: "n1",
        label: "p1",
        type: "any",
        direction: "in",
        defaultValue: 0,
        committedValue: 0,
        draftValue: 0,
        computedValue: 0,
      },
    ];

    useGraphStore.getState().addModule(module1, ports1);
    useGraphStore.getState().undo();

    // New action should wipe redo stack
    const module2 = {
      id: "n2",
      position: { x: 10, y: 10 },
      zIndex: 1,
      type: "test",
    };
    const ports2 = [
      {
        id: "p2",
        moduleId: "n2",
        label: "p2",
        type: "any",
        direction: "in",
        defaultValue: 0,
        committedValue: 0,
        draftValue: 0,
        computedValue: 0,
      },
    ];
    useGraphStore.getState().addModule(module2, ports2);

    useGraphStore.getState().redo(); // Should do nothing
    expect(useGraphStore.getState().modules["n1"]).toBeUndefined();
    expect(useGraphStore.getState().modules["n2"]).toBeDefined();
  });
});
