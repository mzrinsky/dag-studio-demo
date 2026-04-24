import { StateCreator } from "zustand";
import { GraphState, PortContext, PortHandlers } from "./types";

export interface ExecutionSlice {
  nodeRefs: Record<string, any>;
  handlerRegistry: Record<string, PortHandlers>;
  registerNodeRef: (id: string, ref: any) => void;
  unregisterNodeRef: (id: string) => void;
  registerPortHandlers: (portId: string, handlers: PortHandlers) => void;
  unregisterPortHandlers: (portId: string) => void;
  updatePortValue: (id: string, value: any, slot?: "draft" | "computed" | "committed") => void;
}

// The 2nd and 3rd generics [["zustand/immer", never]] tell TypeScript 
// that 'set' uses Immer's mutation-style updates.
export const createExecutionSlice: StateCreator<
  GraphState, 
  [["zustand/immer", never]], 
  [], 
  ExecutionSlice
> = (set, _get) => ({
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