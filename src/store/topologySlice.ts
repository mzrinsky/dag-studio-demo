import { StateCreator } from "zustand";
import { GraphState, NodeState, PortState, PortType, ConnectionState } from "./types";

const TYPE_COMPATIBILITY: Record<PortType, Set<PortType>> = {
  any: new Set(["any", "number", "string", "boolean"]),
  number: new Set(["any", "number"]),
  string: new Set(["any", "string"]),
  boolean: new Set(["any", "boolean"]),
};

const isValidConnection = (
  sourceType: PortType,
  targetType: PortType,
): boolean => {
  return TYPE_COMPATIBILITY[sourceType]?.has(targetType) ?? false;
};

const wouldCreateCycle = (
  sourceNodeId: string,
  targetNodeId: string,
  connections: ConnectionState[],
  ports: Record<string, PortState>,
): boolean => {
  const adjList: Record<string, string[]> = {};
  connections.forEach((conn) => {
    const s = ports[conn.sourcePortId]?.nodeId;
    const t = ports[conn.targetPortId]?.nodeId;
    if (s && t) {
      if (!adjList[s]) adjList[s] = [];
      adjList[s].push(t);
    }
  });
  const visited = new Set<string>();
  const stack = [targetNodeId];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node === sourceNodeId) return true;
    if (!visited.has(node)) {
      visited.add(node);
      stack.push(...(adjList[node] || []));
    }
  }
  return false;
};

// 1. Define the TopologySlice interface
export interface TopologySlice {
  nodes: Record<string, NodeState>;
  ports: Record<string, PortState>;
  connections: ConnectionState[];
  updateNodePosition: (id: string, x: number, y: number) => void;
  bringToFront: (id: string) => void;
  addNode: (node: NodeState, ports: PortState[]) => void;
  removeNode: (id: string) => void;
  addConnection: (sourcePortId: string, targetPortId: string) => void;
}

// 2. Use the Immer-aware StateCreator generic
export const createTopologySlice: StateCreator<
  GraphState,
  [["zustand/immer", never]],
  [],
  TopologySlice
> = (set, get) => ({
  nodes: {},
  ports: {},
  connections: [],

  updateNodePosition: (id, x, y) =>
    set((state) => {
      if (state.nodes[id]) {
        state.nodes[id].position = { x, y };
      }
    }),

  bringToFront: (id) =>
    set((state) => {
      const nodes = Object.values(state.nodes);
      if (nodes.length === 0) return;
      const maxZ = nodes.reduce((max, n) => Math.max(max, n.zIndex), 0);
      if (state.nodes[id]) state.nodes[id] = { ...state.nodes[id], zIndex: maxZ + 1 };
    }),

  addNode: (node, ports) => {
    get().executeCommand({
      execute: (s) => {
        s.nodes[node.id] = node;
        ports.forEach((p) => {
          s.ports[p.id] = p;
        });
      },
      undo: (s) => {
        delete s.nodes[node.id];
        ports.forEach((p) => {
          delete s.ports[p.id];
        });
      },
    });
  },

  removeNode: (id) => {
    const { nodes, ports, connections } = get();
    const node = nodes[id];
    const associatedPorts = Object.values(ports).filter((p) => p.nodeId === id);
    const portIds = new Set(associatedPorts.map((p) => p.id));
    const associatedConns = connections.filter(
      (c: ConnectionState) => portIds.has(c.sourcePortId) || portIds.has(c.targetPortId),
    );

    get().executeCommand({
      execute: (s) => {
        delete s.nodes[id];
        associatedPorts.forEach((p) => {
          delete s.ports[p.id];
        });
        s.connections = s.connections.filter(
          (c: ConnectionState) => !portIds.has(c.sourcePortId) && !portIds.has(c.targetPortId),
        );
      },
      undo: (s) => {
        s.nodes[id] = node!;
        associatedPorts.forEach((p) => {
          s.ports[p.id] = p;
        });
        s.connections.push(...associatedConns);
      },
    });
  },

  addConnection: (sourcePortId, targetPortId) => {
    const { ports, connections } = get();
    const source = ports[sourcePortId];
    const target = ports[targetPortId];
    if (!source || !target || sourcePortId === targetPortId) return;
    if (!isValidConnection(source.type, target.type)) return;
    if (wouldCreateCycle(source.nodeId, target.nodeId, connections, ports))
      return;

    get().executeCommand({
      execute: (s) => {
        s.connections.push({
          id: crypto.randomUUID(),
          sourcePortId,
          targetPortId,
        });
      },
      undo: (s) => {
        s.connections = s.connections.filter(
          (c: ConnectionState) =>
            !(
              c.sourcePortId === sourcePortId && c.targetPortId === targetPortId
            ),
        );
      },
    });
  },
});