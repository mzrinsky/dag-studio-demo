import { StateCreator } from "zustand";
import { GraphState, Command } from "./types";

const MAX_HISTORY_SIZE = 50;

// 1. Define the specific interface for the history slice
export interface HistorySlice {
  history: Command[];
  historyIndex: number;
  executeCommand: (command: Command) => void;
  undo: () => void;
  redo: () => void;
}

// 2. Use the 4-generic StateCreator pattern with Immer middleware type
export const createHistorySlice: StateCreator<
  GraphState,
  [["zustand/immer", never]],
  [],
  HistorySlice
> = (set, get) => ({
  history: [],
  historyIndex: -1,

  executeCommand: (command: Command) => {
    set((state) => {
      state.history = state.history.slice(0, state.historyIndex + 1);
      command.execute(state);
      state.history.push(command);
      if (state.history.length > MAX_HISTORY_SIZE) state.history.shift();
      state.historyIndex = state.history.length - 1;
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < 0) return;
    set((state) => {
      history[historyIndex].undo(state);
      state.historyIndex = historyIndex - 1;
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    set((state) => {
      history[historyIndex + 1].execute(state);
      state.historyIndex = historyIndex + 1;
    });
  },
});