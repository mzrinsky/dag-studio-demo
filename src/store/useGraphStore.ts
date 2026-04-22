import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { GraphState } from './types';
import { createTopologySlice } from './topologySlice';
import { createExecutionSlice } from './executionSlice';
import { createHistorySlice } from './historySlice';

export const useGraphStore = create<GraphState>()(
  persist(
    immer((...a) => ({
      ...createTopologySlice(...a),
      ...createExecutionSlice(...a),
      ...createHistorySlice(...a),
    })),
    {
      name: 'dag-studio-storage',
      partialize: (state) => ({
        nodes: state.nodes,
        ports: state.ports,
        connections: state.connections,
        // Transient states (nodeRefs, handlerRegistry, history) are omitted
      }),
    }
  )
);