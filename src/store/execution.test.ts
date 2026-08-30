import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGraphStore } from "./useGraphStore";
import { setupStoreMock, resetStore } from "./test-utils";

setupStoreMock();

describe("Execution Slice", () => {
  beforeEach(() => resetStore());

  it("should propagate draft values via the onChange handler (Reactive Flow)", () => {
    useGraphStore.setState((state) => {
      state.ports = {
        p_out: {
          id: "p_out",
          moduleId: "n_a",
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
          moduleId: "n_b",
          label: "In",
          type: "number",
          direction: "in",
          defaultValue: 0,
          committedValue: 0,
          draftValue: 0,
          computedValue: 0,
        },
      };
      state.links = [
        { id: "c1", sourcePortId: "p_out", targetPortId: "p_in" },
      ];
    });

    const onChangeMock = vi.fn();
    useGraphStore
      .getState()
      .registerPortHandlers("p_in", { onChange: onChangeMock });

    useGraphStore.getState().updatePortValue("p_out", 42, "draft");

    expect(useGraphStore.getState().ports["p_out"].draftValue).toBe(42);
    expect(onChangeMock).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        portId: "p_in",
        currentValue: 42,
        previousValue: 0,
      }),
    );
  });

  it("should maintain separate values for the quad slots", () => {
    useGraphStore.setState((state) => {
      state.ports = {
        p1: {
          id: "p1",
          moduleId: "n1",
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
});
