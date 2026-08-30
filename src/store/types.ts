export type PortType = "number" | "string" | "boolean" | "any";

export interface PortState {
  id: string;
  moduleId: string;
  label: string;
  type: PortType;
  direction: "in" | "out";
  defaultValue: any;
  committedValue: any;
  draftValue: any;
  computedValue: any;
}

export interface ModuleState {
  id: string;
  position: { x: number; y: number };
  zIndex: number;
  type: string;
}

export interface LinkState {
  id: string;
  sourcePortId: string;
  targetPortId: string;
}

export interface PortContext {
  portId: string;
  moduleId: string;
  previousValue: any;
  currentValue: any;
}

export interface PortHandlers {
  onChange?: (value: any, context: PortContext) => void;
  onProcess?: (context: PortContext) => Promise<any>;
  onCommit?: (value: any, context: PortContext) => void;
}

export interface Command {
  execute: (draft: any) => void;
  undo: (draft: any) => void;
}

export interface GraphState {
  // Topology
  modules: Record<string, ModuleState>;
  ports: Record<string, PortState>;
  links: LinkState[];

  // Execution
  nodeRefs: Record<string, any>;
  handlerRegistry: Record<string, PortHandlers>;

  // History
  history: Command[];
  historyIndex: number;

  // Actions
  updateModulePosition: (id: string, x: number, y: number) => void;
  bringToFront: (id: string) => void;
  addModule: (module: ModuleState, ports: PortState[]) => void;
  removeModule: (id: string) => void;
  addPatch: (sourcePortId: string, targetPortId: string) => void;

  updatePortValue: (
    id: string,
    value: any,
    slot?: "draft" | "committed" | "computed",
  ) => void;
  registerNodeRef: (id: string, ref: any) => void;
  unregisterNodeRef: (id: string) => void;
  registerPortHandlers: (portId: string, handlers: PortHandlers) => void;
  unregisterPortHandlers: (portId: string) => void;

  executeCommand: (command: Command) => void;
  undo: () => void;
  redo: () => void;
}
