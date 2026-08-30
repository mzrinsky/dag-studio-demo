import { StateCreator } from "zustand";
import { GraphState, ModuleState, PortState, PortType, LinkState } from "./types";

const TYPE_COMPATIBILITY: Record<PortType, Set<PortType>> = {
  any: new Set(["any", "number", "string", "boolean"]),
  number: new Set(["any", "number"]),
  string: new Set(["any", "string"]),
  boolean: new Set(["any", "boolean"]),
};

const isValidPatch = (
  sourceType: PortType,
  targetType: PortType,
): boolean => {
  return TYPE_COMPATIBILITY[sourceType]?.has(targetType) ?? false;
};

const wouldCreateCycle = (
  sourceModuleId: string,
  targetModuleId: string,
  links: LinkState[],
  ports: Record<string, PortState>,
): boolean => {
  const adjList: Record<string, string[]> = {};
  links.forEach((link) => {
    const s = ports[link.sourcePortId]?.moduleId;
    const t = ports[link.targetPortId]?.moduleId;
    if (s && t) {
      if (!adjList[s]) adjList[s] = [];
      adjList[s].push(t);
    }
  });
  const visited = new Set<string>();
  const stack = [targetModuleId];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node === sourceModuleId) return true;
    if (!visited.has(node)) {
      visited.add(node);
      stack.push(...(adjList[node] || []));
    }
  }
  return false;
};

// 1. Define the TopologySlice interface
export interface TopologySlice {
  modules: Record<string, ModuleState>;
  ports: Record<string, PortState>;
  links: LinkState[];
  updateModulePosition: (id: string, x: number, y: number) => void;
  bringToFront: (id: string) => void;
  addModule: (module: ModuleState, ports: PortState[]) => void;
  removeModule: (id: string) => void;
  addPatch: (sourcePortId: string, targetPortId: string) => void;
}

// 2. Use the Immer-aware StateCreator generic
export const createTopologySlice: StateCreator<
  GraphState,
  [["zustand/immer", never]],
  [],
  TopologySlice
> = (set, get) => ({
  modules: {},
  ports: {},
  links: [],

  updateModulePosition: (id, x, y) =>
    set((state) => {
      if (state.modules[id]) {
        state.modules[id].position = { x, y };
      }
    }),

  bringToFront: (id) =>
    set((state) => {
      const modules = Object.values(state.modules);
      if (modules.length === 0) return;
      const maxZ = modules.reduce((max, n) => Math.max(max, n.zIndex), 0);
      if (state.modules[id]) state.modules[id] = { ...state.modules[id], zIndex: maxZ + 1 };
    }),

  addModule: (module, ports) => {
    get().executeCommand({
      execute: (s) => {
        s.modules[module.id] = module;
        ports.forEach((p) => {
          s.ports[p.id] = p;
        });
      },
      undo: (s) => {
        delete s.modules[module.id];
        ports.forEach((p) => {
          delete s.ports[p.id];
        });
      },
    });
  },

  removeModule: (id) => {
    const { modules, ports, links } = get();
    const module = modules[id];
    const associatedPorts = Object.values(ports).filter((p) => p.moduleId === id);
    const portIds = new Set(associatedPorts.map((p) => p.id));
    const associatedLinks = links.filter(
      (c: LinkState) => portIds.has(c.sourcePortId) || portIds.has(c.targetPortId),
    );

    get().executeCommand({
      execute: (s) => {
        delete s.modules[id];
        associatedPorts.forEach((p) => {
          delete s.ports[p.id];
        });
        s.links = s.links.filter(
          (c: LinkState) => !portIds.has(c.sourcePortId) && !portIds.has(c.targetPortId),
        );
      },
      undo: (s) => {
        s.modules[id] = module!;
        associatedPorts.forEach((p) => {
          s.ports[p.id] = p;
        });
        s.links.push(...associatedLinks);
      },
    });
  },

  addPatch: (sourcePortId, targetPortId) => {
    const { ports, links } = get();
    const source = ports[sourcePortId];
    const target = ports[targetPortId];
    if (!source || !target || sourcePortId === targetPortId) return;
    if (!isValidPatch(source.type, target.type)) return;
    if (wouldCreateCycle(source.moduleId, target.moduleId, links, ports))
      return;

    get().executeCommand({
      execute: (s) => {
        s.links.push({
          id: crypto.randomUUID(),
          sourcePortId,
          targetPortId,
        });
      },
      undo: (s) => {
        s.links = s.links.filter(
          (c: LinkState) =>
            !(
              c.sourcePortId === sourcePortId && c.targetPortId === targetPortId
            ),
        );
      },
    });
  },
});
