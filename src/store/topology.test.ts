import { describe, it, expect, beforeEach } from "vitest";
import { useGraphStore } from "./useGraphStore";
import { setupStoreMock, resetStore } from "./test-utils";

setupStoreMock();

describe("Topology Slice", () => {
  beforeEach(() => resetStore());

  it("should prevent patches between incompatible types", () => {
    useGraphStore.setState((state) => {
      state.ports = {
        p1: {
          id: "p1",
          moduleId: "n1",
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
          moduleId: "n2",
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

    useGraphStore.getState().addPatch("p1", "p2");
    expect(useGraphStore.getState().links.length).toBe(0);
  });

  it("should prevent circular dependencies (A -> B -> A)", () => {
    useGraphStore.setState((state) => {
      state.ports = {
        p1: {
          id: "p1",
          moduleId: "n1",
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
          moduleId: "n2",
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
          moduleId: "n2",
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
          moduleId: "n1",
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

    useGraphStore.getState().addPatch("p1", "p2"); // n1 -> n2
    useGraphStore.getState().addPatch("p3", "p4"); // n2 -> n1 (Cycle!)

    expect(useGraphStore.getState().links.length).toBe(1);
  });
});
