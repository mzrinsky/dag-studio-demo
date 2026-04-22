import { vi } from "vitest";
import { useGraphStore } from "./useGraphStore";

export const setupStoreMock = () => {
  const localStorageMock = (() => {
    let store: Record<string, any> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  vi.stubGlobal("localStorage", localStorageMock);
};

export const resetStore = () => {
  useGraphStore.setState({
    nodes: {},
    ports: {},
    connections: [],
    handlerRegistry: {},
    nodeRefs: {},
    history: [],
    historyIndex: -1,
  });
  localStorage.clear();
};
