import { StateCreator } from "zustand";
import { GraphState, PortContext } from "./types";

export const createExecutionSlice: StateCreator<GraphState> = (set, get) => ({
  nodeRefs: {},
  handlerRegistry: {},

  registerNodeRef: (id, ref) =>
    set((state) => {
      state.nodeRefs[id] = ref;
    }),
  unregisterNodeRef: (id) =>
    set((state) => {
      delete state.nodeRefs[id];
    }),
  registerPortHandlers: (portId, handlers) =>
    set((state) => {
      state.handlerRegistry[portId] = handlers;
    }),
  unregisterPortHandlers: (portId) =>
    set((state) => {
      delete state.handlerRegistry[portId];
    }),

  updatePortValue: (id, value, slot = "draft") =>
    set((state) => {
      const port = state.ports[id];
      if (!port) return;

      const prevValue =
        slot === "draft"
          ? port.draftValue
          : slot === "committed"
            ? port.committedValue
            : port.computedValue;

      if (slot === "draft") port.draftValue = value;
      else if (slot === "committed") port.committedValue = value;
      else if (slot === "computed") port.computedValue = value;

      const downstream = state.connections.filter((c) => c.sourcePortId === id);
      downstream.forEach((conn) => {
        const targetPort = state.ports[conn.targetPortId];
        const handlers = state.handlerRegistry[conn.targetPortId];
        if (!targetPort || !handlers) return;

        const context: PortContext = {
          portId: conn.targetPortId,
          nodeId: targetPort.nodeId,
          previousValue: prevValue,
          currentValue: value,
        };

        if ((slot === "draft" || slot === "computed") && handlers.onChange) {
          handlers.onChange(value, context);
        } else if (slot === "committed" && handlers.onCommit) {
          handlers.onCommit(value, context);
        }
      });
    }),
});
