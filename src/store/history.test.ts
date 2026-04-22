import { describe, it, expect, beforeEach } from "vitest";
import { useGraphStore } from "./useGraphStore";
import { setupStoreMock, resetStore } from "./test-utils";

setupStoreMock();

describe("History Slice", () => {
  beforeEach(() => resetStore());

  it("should undo and redo node creation", () => {
    const node = {
      id: "n1",
      position: { x: 0, y: 0 },
      zIndex: 1,
      type: "test",
    };
    const ports = [
      {
        id: "p1",
        nodeId: "n1",
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
    useGraphStore.getState().addNode(node, ports);
    expect(useGraphStore.getState().nodes["n1"]).toBeDefined();

    // Undo
    useGraphStore.getState().undo();
    expect(useGraphStore.getState().nodes["n1"]).toBeUndefined();

    // Redo
    useGraphStore.getState().redo();
    expect(useGraphStore.getState().nodes["n1"]).toBeDefined();
  });

  it("should clear forward history when a new action is performed after undo", () => {
    const node1 = {
      id: "n1",
      position: { x: 0, y: 0 },
      zIndex: 1,
      type: "test",
    };
    const ports1 = [
      {
        id: "p1",
        nodeId: "n1",
        label: "p1",
        type: "any",
        direction: "in",
        defaultValue: 0,
        committedValue: 0,
        draftValue: 0,
        computedValue: 0,
      },
    ];

    useGraphStore.getState().addNode(node1, ports1);
    useGraphStore.getState().undo();

    // New action should wipe redo stack
    const node2 = {
      id: "n2",
      position: { x: 10, y: 10 },
      zIndex: 1,
      type: "test",
    };
    const ports2 = [
      {
        id: "p2",
        nodeId: "n2",
        label: "p2",
        type: "any",
        direction: "in",
        defaultValue: 0,
        committedValue: 0,
        draftValue: 0,
        computedValue: 0,
      },
    ];
    useGraphStore.getState().addNode(node2, ports2);

    useGraphStore.getState().redo(); // Should do nothing
    expect(useGraphStore.getState().nodes["n1"]).toBeUndefined();
    expect(useGraphStore.getState().nodes["n2"]).toBeDefined();
  });
});
