import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGraphStore } from "./useGraphStore";

// Mock localStorage globally for the test environment
const localStorageMock = (() => {
  let store: Record<string, any> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

vi.stubGlobal("localStorage", localStorageMock);

describe("useGraphStore", () => {
  beforeEach(() => {
    useGraphStore.setState({
      nodes: {},
      ports: {},
      connections: [],
      handlerRegistry: {}, // Reset transient registry
      nodeRefs: {},
      history: [],
      historyIndex: -1,
    });
    localStorage.clear();
  });

  describe("Connection Guardrails", () => {
    it("should prevent connections between incompatible types", () => {
      // Setup: Create two ports of different types
      useGraphStore.setState((state) => {
        state.ports = {
          p1: {
            id: "p1",
            nodeId: "n1",
            label: "S1",
            type: "number",
            direction: "out",
            defaultValue: 0,
            committedValue: 0,
            draftValue: 0,
            computedValue: 0,
          },
          p2: {
            id: "p2",
            nodeId: "n2",
            label: "S2",
            type: "string",
            direction: "in",
            defaultValue: "",
            committedValue: "",
            draftValue: "",
            computedValue: "",
          },
        };
      });

      useGraphStore.getState().addConnection("p1", "p2");

      expect(useGraphStore.getState().connections.length).toBe(0);
    });

    it("should prevent circular dependencies (A -> B -> A)", () => {
      useGraphStore.setState((state) => {
        state.ports = {
          p1: {
            id: "p1",
            nodeId: "n1",
            label: "out",
            type: "any",
            direction: "out",
            defaultValue: 0,
            committedValue: 0,
            draftValue: 0,
            computedValue: 0,
          },
          p2: {
            id: "p2",
            nodeId: "n2",
            label: "in",
            type: "any",
            direction: "in",
            defaultValue: 0,
            committedValue: 0,
            draftValue: 0,
            computedValue: 0,
          },
          p3: {
            id: "p3",
            nodeId: "n2",
            label: "out",
            type: "any",
            direction: "out",
            defaultValue: 0,
            committedValue: 0,
            draftValue: 0,
            computedValue: 0,
          },
          p4: {
            id: "p4",
            nodeId: "n1",
            label: "in",
            type: "any",
            direction: "in",
            defaultValue: 0,
            committedValue: 0,
            draftValue: 0,
            computedValue: 0,
          },
        };
      });

      // Valid connection: n1 -> n2
      useGraphStore.getState().addConnection("p1", "p2");
      // Invalid connection: n2 -> n1 (Creates cycle)
      useGraphStore.getState().addConnection("p3", "p4");

      expect(useGraphStore.getState().connections.length).toBe(1);
    });
  });

  describe("Command History", () => {
    it("should undo node creation", () => {
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

      useGraphStore.getState().addNode(node, ports);
      expect(useGraphStore.getState().nodes["n1"]).toBeDefined();

      useGraphStore.getState().undo();
      expect(useGraphStore.getState().nodes["n1"]).toBeUndefined();
    });
  });

  describe("Data Flow & Value Quad", () => {
    it("should propagate draft values via the onChange handler (Reactive Flow)", () => {
      // Setup: Node A (Out) -> Node B (In)
      useGraphStore.setState((state) => {
        state.ports = {
          p_out: {
            id: "p_out",
            nodeId: "n_a",
            label: "Out",
            type: "number",
            direction: "out",
            defaultValue: 0,
            committedValue: 0,
            draftValue: 0,
            computedValue: 0,
          },
          p_in: {
            id: "p_in",
            nodeId: "n_b",
            label: "In",
            type: "number",
            direction: "in",
            defaultValue: 0,
            committedValue: 0,
            draftValue: 0,
            computedValue: 0,
          },
        };
        state.connections = [
          { id: "c1", sourcePortId: "p_out", targetPortId: "p_in" },
        ];
      });

      // Mock handler for the target port
      const onChangeMock = vi.fn();
      useGraphStore.getState().registerPortHandlers("p_in", {
        onChange: onChangeMock,
      });

      // Act: Update the source port's draft value
      useGraphStore.getState().updatePortValue("p_out", 42, "draft");

      // Assert: Value is stored correctly
      expect(useGraphStore.getState().ports["p_out"].draftValue).toBe(42);

      // Assert: Handler was triggered with correct value and context
      expect(onChangeMock).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          portId: "p_in",
          currentValue: 42,
          previousValue: 0,
        }),
      );
    });

    it("should trigger onCommit handler only when committed slot is updated (Persistent Flow)", () => {
      useGraphStore.setState((state) => {
        state.ports = {
          p_out: {
            id: "p_out",
            nodeId: "n_a",
            label: "Out",
            type: "string",
            direction: "out",
            defaultValue: "",
            committedValue: "",
            draftValue: "",
            computedValue: "",
          },
          p_in: {
            id: "p_in",
            nodeId: "n_b",
            label: "In",
            type: "string",
            direction: "in",
            defaultValue: "",
            committedValue: "",
            draftValue: "",
            computedValue: "",
          },
        };
        state.connections = [
          { id: "c1", sourcePortId: "p_out", targetPortId: "p_in" },
        ];
      });

      const onChangeMock = vi.fn();
      const onCommitMock = vi.fn();
      useGraphStore.getState().registerPortHandlers("p_in", {
        onChange: onChangeMock,
        onCommit: onCommitMock,
      });

      // Act 1: Update draft - should NOT trigger onCommit
      useGraphStore.getState().updatePortValue("p_out", "Drafting...", "draft");
      expect(onChangeMock).toHaveBeenCalled();
      expect(onCommitMock).not.toHaveBeenCalled();

      // Act 2: Update committed - should trigger onCommit
      useGraphStore
        .getState()
        .updatePortValue("p_out", "Final Value", "committed");
      expect(onCommitMock).toHaveBeenCalledWith(
        "Final Value",
        expect.objectContaining({ portId: "p_in" }),
      );
    });

    it("should maintain separate values for the quad slots", () => {
      useGraphStore.setState((state) => {
        state.ports = {
          p1: {
            id: "p1",
            nodeId: "n1",
            label: "P1",
            type: "any",
            direction: "out",
            defaultValue: "init",
            committedValue: "init",
            draftValue: "init",
            computedValue: "init",
          },
        };
      });

      useGraphStore.getState().updatePortValue("p1", "draft_val", "draft");
      useGraphStore.getState().updatePortValue("p1", "comp_val", "computed");
      useGraphStore.getState().updatePortValue("p1", "comm_val", "committed");

      const port = useGraphStore.getState().ports["p1"];
      expect(port.draftValue).toBe("draft_val");
      expect(port.computedValue).toBe("comp_val");
      expect(port.committedValue).toBe("comm_val");
      expect(port.defaultValue).toBe("init");
    });

    it("should clean up handlers when unregisterPortHandlers is called", () => {
      useGraphStore.setState((state) => {
        state.ports = {
          p_out: {
            id: "p_out",
            nodeId: "n_a",
            label: "Out",
            type: "number",
            direction: "out",
            defaultValue: 0,
            committedValue: 0,
            draftValue: 0,
            computedValue: 0,
          },
          p_in: {
            id: "p_in",
            nodeId: "n_b",
            label: "In",
            type: "number",
            direction: "in",
            defaultValue: 0,
            committedValue: 0,
            draftValue: 0,
            computedValue: 0,
          },
        };
        state.connections = [
          { id: "c1", sourcePortId: "p_out", targetPortId: "p_in" },
        ];
      });

      const onChangeMock = vi.fn();
      useGraphStore
        .getState()
        .registerPortHandlers("p_in", { onChange: onChangeMock });

      // Remove handlers
      useGraphStore.getState().unregisterPortHandlers("p_in");

      // Act
      useGraphStore.getState().updatePortValue("p_out", 100, "draft");

      // Assert: Handler should not be called
      expect(onChangeMock).not.toHaveBeenCalled();
    });
  });
});
