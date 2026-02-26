import { goto } from "$app/navigation";
import { page } from "$app/state";
import { createContext } from "svelte";
import type { PromiseOrValue } from "$lib";
import type { CreateTabResponse } from "../routes/api/create-tab/+server";

export type FileDocumentData = {
  kind: "local_file",
  file: File,
} | {
  kind: "no_data",
};

export type FileDocument = {
  id: string,
  mime_type: string,
  name: string,
  data: FileDocumentData,
  progress: number,
};

export type TabData = {
  id: string,
  name: string,
  documents: FileDocument[],
};

export type ContextData = {
  /**
   * Wether we are signedin in any way anonymous or not
   */
  isSignedIn: boolean,
  /**
   * Wether we are signedin with an anonymous user
   */
  isAnonymous: boolean,
  tabs: TabData[],
};

export const [getContext, setContext] = createContext<ContextData>();

export function discrete_mode(ctx: ContextData): boolean {
  return (ctx.tabs.length === 0 || ctx.tabs.length === 1 && ctx.tabs[0].documents.length === 0) &&
    (page.url.pathname.startsWith("/tab") || page.url.pathname === `/`);
}

export async function createTab(ctx: ContextData, name?: string): Promise<TabData> {
  if (!name) {
    name = "New Tab";
    let i = 1;
    while (ctx.tabs.some(t => t.name === name))
      name = `New Tab #${i += 1}`;
  }

  const result: CreateTabResponse = await fetch("/api/create-tab", {
    method: "POST",
    body: JSON.stringify({
      name,
    }),
    headers: {
      "Content-Type": "application-json",
    },
  }).then(res => res.json());
  
  ctx.tabs.push({
    id: result.id,
    name: name,
    documents: [],
  });
  goto(`/tab/${result.id}`);
  return ctx.tabs.at(-1)!;
}
