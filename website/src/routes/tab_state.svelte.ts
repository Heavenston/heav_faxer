import { goto } from "$app/navigation";
import { page } from "$app/state";
import { tick } from "svelte";

export type FileDocumentData = {
  kind: "local_file",
  file: File,
};
export type FileDocument = {
  local_id: string,
  mime_type: string,
  file_name: string,
  data: FileDocumentData,
  progress: number,
};

export type TabData = {
  name: string,
  uuid: string,

  documents: FileDocument[],
};

export const tabs: TabData[] = $state([
  { name: "Default Tab", uuid: crypto.randomUUID(), documents: [] },
]);

export function discrete_mode(): boolean {
  return tabs.length === 1 && tabs[0].documents.length === 0 && page.url.pathname === `/tab/${tabs[0].uuid}`;
}

export function withTransition(cb: () => void) {
  if (document.startViewTransition) {
    document.startViewTransition(async () => {
      cb();
      await tick();
    });
  }
  else {
    cb();
  }
}

export function createTab(name?: string): TabData {
  if (!name) {
    name = "New Tab";
    let i = 1;
    while (tabs.some(t => t.name === name))
      name = `New Tab #${i += 1}`;
  }
  const uuid = crypto.randomUUID();
  tabs.push({
    name: name,
    uuid,
    documents: [],
  });
  goto(`/tab/${uuid}`);
  return tabs.at(-1)!;
}

// export function removeTab(id: string) {
//   const idx = tabs.findIndex(tab => tab.uuid === id);
//   if (idx < 0)
//     return;
//   if (tabs.length <= 1)
//     createTab();
//   tabs.splice(idx, 1);
//   if (selected_tab().uuid === id) {
//     set_selected_tab(tabs[0].uuid);
//   }
// }
