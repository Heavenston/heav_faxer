import { pushState } from "$app/navigation";
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

export function selected_tab_id(): string {
  if (typeof page.state.selected_tab === "string")
    return page.state.selected_tab;
  return tabs[0]?.uuid ?? "error"; 
}

export function set_selected_tab(new_tab: string) {
  withTransition(() => {
    pushState("", {
      selected_tab: new_tab,
    });
  });
}

export function selected_tab(): TabData {
  let idx = tabs.findIndex(tab => tab.uuid === selected_tab_id());
  if (idx < 0) {
    console.warn(`No such selected tab with id ${selected_tab_id()}`);
    idx = 0;
  }
  return tabs[idx];
};
export function discrete_mode(): boolean {
  return selected_tab().documents.length === 0 && tabs.length === 1;
}

const documents = $derived(selected_tab().documents);

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

export function removeDoc(id: string) {
  withTransition(() => {
    const idx = documents.findIndex(doc => doc.local_id === id);
    if (idx >= 0)
      documents.splice(idx, 1);
  });
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
  set_selected_tab(uuid);
  return tabs.at(-1)!;
}

export function removeTab(id: string) {
  const idx = tabs.findIndex(tab => tab.uuid === id);
  if (idx < 0)
    return;
  if (tabs.length <= 1)
    createTab();
  tabs.splice(idx, 1);
  if (selected_tab().uuid === id) {
    set_selected_tab(tabs[0].uuid);
  }
}

export function createAndUploadFile(file: File) {
  documents.push({
    progress: 0,
    file_name: file.name,
    mime_type: file.type,
    data: {
      kind: "local_file",
      file,
    },
    local_id: crypto.randomUUID(),
  });
  const doc: FileDocument = documents.at(-1)!;

  setTimeout(() => {
    const i = setInterval(() => {
      doc.progress += Math.random() * 0.05;
      if (doc.progress > 1) {
        doc.progress = 1;
        clearInterval(i);
      }
    }, 100);
  }, 3000 * Math.random());
}

