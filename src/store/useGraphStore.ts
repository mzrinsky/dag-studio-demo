import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
      // Check if window is defined (browser). 
      // If not (test/node environment), use a mock storage object to prevent the error.
      storage: typeof window !== 'undefined' 
        ? createJSONStorage() 
        : {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          },
      partialize: (state) => ({
        modules: state.modules,
        ports: state.ports,
        links: state.links,
        // Transient states (nodeRefs, handlerRegistry, history) are omitted
      }),
    }
  )
);
