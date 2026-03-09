import { createContextId, useContext, useContextProvider } from "@builder.io/qwik";

export type File = {
  id: string,
  name: string,
};

export type Tab = {
  id: string,
  name: string,
  files: File[],
};

export type GlobalStore = {
  tabs: Tab[],
};

const globalStoreContext = createContextId<GlobalStore>("global-store");

export function useGlobalStoreProvider(data: GlobalStore) {
  useContextProvider(globalStoreContext, data);
}

export function useGlobalStore(): GlobalStore {
  return useContext(globalStoreContext);
}
