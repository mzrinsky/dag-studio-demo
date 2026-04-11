import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const MAX_HISTORY_SIZE = 50;

export type PortType = 'number' | 'string' | 'boolean' | 'any';

const TYPE_COMPATIBILITY: Record<PortType, Set<PortType>> = {
  'any': new Set(['any', 'number', 'string', 'boolean']),
  'number': new Set(['any', 'number']),
  'string': new Set(['any', 'string']),
  'boolean': new Set(['any', 'boolean']),
};

const isValidConnection = (sourceType: PortType, targetType: PortType): boolean => {
  const compatibleTargets = TYPE_COMPATIBILITY[sourceType];
  return compatibleTargets ? compatibleTargets.has(targetType) : false;
};


export interface PortState {
  id: string;
  nodeId: string;
  label: string;
  type: PortType;
  direction: 'in' | 'out';
  
  // --- The Value Quad ---
  defaultValue: any;    // The baseline (read-only once node is created)
  committedValue: any;  // The "Saved" state (Persistent Flow)
  draftValue: any;      // The "Editing" state (Reactive Flow)
  computedValue: any;   // The "Result" state (Imperative Flow)
}

export interface NodeState {
  id: string;
  position: { x: number; y: number };
  zIndex: number;
  type: string; // The component type
}

export interface Connection {
  id: string;
  sourcePortId: string;
  targetPortId: string;
}

export interface Command {
  execute: (draft: GraphStateInternal) => void;
  undo: (draft: GraphStateInternal) => void;
}

type GraphStateInternal = Omit<GraphState, 'undo' | 'redo' | 'executeCommand'>;

export interface GraphSnapshot {
  nodes: Record<string, NodeState>;
  ports: Record<string, PortState>;
  connections: Connection[];
}

interface GraphState {
  nodes: Record<string, NodeState>;
  ports: Record<string, PortState>;
  connections: Connection[];
  nodeRefs: Record<string, any>;
  history: Command[]; 
  historyIndex: number;
  
  // Actions
  updateNodePosition: (id: string, x: number, y: number) => void;
  updatePortValue: (id: string, value: any, slot?: 'draft' | 'committed' | 'computed') => void;
  registerNodeRef: (id: string, ref: any) => void;
  unregisterNodeRef: (id: string) => void;
  executeCommand: (command: Command) => void;
  bringToFront: (id: string) => void;
  addConnection: (sourcePortId: string, targetPortId: string) => void;
  
  // Committed actions (now just helpers that call executeCommand)
  addNode: (node: NodeState, ports: PortState[]) => void;
  removeNode: (id: string) => void;
  // ... other add/remove helpers ...
  
  undo: () => void;
  redo: () => void;
}

// Helper function to detect cycles
// Returns true if adding a connection from sourceNodeId to targetNodeId creates a cycle
const wouldCreateCycle = (
  sourceNodeId: string, 
  targetNodeId: string, 
  connections: Connection[], 
  ports: Record<string, PortState>
): boolean => {
  const adjList: Record<string, string[]> = {};
  
  // Build an adjacency list of Node -> Node
  connections.forEach(conn => {
    const sourceNode = ports[conn.sourcePortId]?.nodeId;
    const targetNode = ports[conn.targetPortId]?.nodeId;
    if (sourceNode && targetNode) {
      if (!adjList[sourceNode]) adjList[sourceNode] = [];
      adjList[sourceNode].push(targetNode);
    }
  });

  const visited = new Set<string>();
  const stack = [targetNodeId];

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node === sourceNodeId) return true; // Cycle detected!

    if (!visited.has(node)) {
      visited.add(node);
      const neighbors = adjList[node] || [];
      stack.push(...neighbors);
    }
  }

  return false;
};

export const useGraphStore = create<GraphState>()(
  persist(
    immer((set, get) => ({ // 2. Wrap with immer
      nodes: {},
      ports: {},
      connections: [],
      nodeRefs: {},
      history: [],
      historyIndex: -1,

      // TRANSIENT STATE: Now clean and direct
      updateNodePosition: (id, x, y) => set((state) => {
        state.nodes[id].position = { x, y }; // Immer handles the immutable copy
      }),

      updatePortValue: (id, value, slot = 'draft') => set((state) => {
        const port = state.ports[id];
        if (!port) return;

        switch (slot) {
          case 'draft': port.draftValue = value; break;
          case 'committed': port.committedValue = value; break;
          case 'computed': port.computedValue = value; break;
        }
      }),

      registerNodeRef: (id, ref) => set((state) => {
        state.nodeRefs[id] = ref;
      }),

      unregisterNodeRef: (id) => set((state) => {
        delete state.nodeRefs[id];
      }),

      // --- NODE MANAGER LOGIC ---
      bringToFront: (id) => set((state) => {
        const nodes = Object.values(state.nodes);
        if (nodes.length === 0) return;
        
        const maxZ = nodes.reduce((max, n) => Math.max(max, n.zIndex), 0);
        if (state.nodes[id]) {
          state.nodes[id].zIndex = maxZ + 1;
        }
      }),

      // --- CONNECTION MANAGER LOGIC ---
      addConnection: (sourcePortId: string, targetPortId: string) => {
        const { ports, connections } = get();
        const source = ports[sourcePortId];
        const target = ports[targetPortId];

        if (!source || !target) return;

        // 1. Logic Guard: Prevent connecting a port to itself (Trivial Cycle)
        if (sourcePortId === targetPortId) {
          console.error("Cannot connect a port to itself");
          return;
        }

        // 2. Logic Guard: Type Validation using Compatibility Matrix
        if (!isValidConnection(source.type, target.type)) {
          console.error(`Type mismatch: ${source.type} cannot be connected to ${target.type}`);
          return;
        }

        // 3. Logic Guard: Cycle Detection (Prevents Reactive Flow Infinite Loops)
        if (wouldCreateCycle(source.nodeId, target.nodeId, connections, ports)) {
          console.error("Circular connection detected. Cycles are not allowed in this flow.");
          return;
        }

        get().executeCommand({
          execute: (s) => { 
            s.connections.push({ 
              id: crypto.randomUUID(), 
              sourcePortId, 
              targetPortId 
            }); 
          },
          undo: (s) => { 
            s.connections = s.connections.filter(c => 
              !(c.sourcePortId === sourcePortId && c.targetPortId === targetPortId)
            ); 
          }
        });
      },

      // COMMAND ENGINE: The "Brain"
      executeCommand: (command) => {
        set((state) => {
          // Clear forward history
          state.history = state.history.slice(0, state.historyIndex + 1);
          
          // Apply the command directly to the draft
          command.execute(state as GraphStateInternal);
          
          state.history.push(command);
          
          // Limit history stack size to prevent bloat
          if (state.history.length > MAX_HISTORY_SIZE) {
            state.history.shift();
          }
          
          state.historyIndex = state.history.length - 1;
        });
      },

      // COMMITTED ACTIONS: Logic is encapsulated in the Command object
      addNode: (node: NodeState, ports: PortState[]) => {
        get().executeCommand({
          execute: (s) => { 
            s.nodes[node.id] = node; 
            ports.forEach(p => { s.ports[p.id] = p; });
          },
          undo: (s) => { 
            delete s.nodes[node.id]; 
            ports.forEach(p => { delete s.ports[p.id]; });
          }
        });
      },

      removeNode: (id) => {
        const state = get();
        const node = state.nodes[id];
        const associatedPorts = Object.values(state.ports).filter(p => p.nodeId === id);
        const portIds = new Set(associatedPorts.map(p => p.id));
        
        // Identify connections that involve any of the node's ports
        const associatedConns = state.connections.filter(c => 
          portIds.has(c.sourcePortId) || portIds.has(c.targetPortId)
        );

        get().executeCommand({
          execute: (s) => {
            delete s.nodes[id];
            associatedPorts.forEach(p => { delete s.ports[p.id]; });
            // Filter out connections by checking if either port is gone
            s.connections = s.connections.filter(c => 
              !portIds.has(c.sourcePortId) && !portIds.has(c.targetPortId)
            );
          },
          undo: (s) => {
            s.nodes[id] = node!;
            associatedPorts.forEach(p => { s.ports[p.id] = p; });
            s.connections.push(...associatedConns);
          }
        });
      },

      // ... (Other add/remove functions follow the same pattern) ...

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < 0) return;
        
        set((state) => {
          const command = history[historyIndex];
          command.undo(state as GraphStateInternal);
          state.historyIndex = historyIndex - 1;
        });
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex >= history.length - 1) return;
        
        set((state) => {
          const command = history[historyIndex + 1];
          command.execute(state as GraphStateInternal);
          state.historyIndex = historyIndex + 1;
        });
      },
    })),
    {
      name: 'dag-studio-storage',
      partialize: (state) => ({ 
        nodes: state.nodes, 
        ports: state.ports, 
        connections: state.connections
      }),
    }
  )
);