export type PortType = "number" | "string" | "boolean" | "any";

export interface PortState {
  id: string;
  nodeId: string;
  label: string;
  type: PortType;
  direction: "in" | "out";
  defaultValue: any;
  committedValue: any;
  draftValue: any;
  computedValue: any;
}

export interface NodeState {
  id: string;
  position: { x: number; y: number };
  zIndex: number;
  type: string;
}

export interface Connection {
  id: string;
  sourcePortId: string;
  targetPortId: string;
}

export interface PortContext {
  portId: string;
  nodeId: string;
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
  nodes: Record<string, NodeState>;
  ports: Record<string, PortState>;
  connections: Connection[];

  // Execution
  nodeRefs: Record<string, any>;
  handlerRegistry: Record<string, PortHandlers>;

  // History
  history: Command[];
  historyIndex: number;

  // Actions
  updateNodePosition: (id: string, x: number, y: number) => void;
  bringToFront: (id: string) => void;
  addNode: (node: NodeState, ports: PortState[]) => void;
  removeNode: (id: string) => void;
  addConnection: (sourcePortId: string, targetPortId: string) => void;

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
