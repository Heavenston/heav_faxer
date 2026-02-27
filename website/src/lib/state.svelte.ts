import { goto } from "$app/navigation";
import { page } from "$app/state";
import { createContext } from "svelte";
import type { CreateTabResponse } from "../routes/api/create-tab/+server";
import { authClient } from "$lib/auth-client";
import type { Session } from "$lib/auth.server";

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
  user: Session["user"] | null,
  tabs: TabData[],
};

export const [getContext, setContext] = createContext<ContextData>();

export function discrete_mode(ctx: ContextData): boolean {
  return (ctx.tabs.length === 0 || ctx.tabs.length === 1 && ctx.tabs[0].documents.length === 0) && page.url.pathname === `/`;
}

export async function signOut(ctx: ContextData) {
  const result = await authClient.signOut();
  if (result.error != null) {
    console.error(result.error);
    return false;
  }
  else {
    ctx.user = null;
    return true;
  }
}

export async function signInAnonymous(ctx: ContextData) {
  const result = await authClient.signIn.anonymous();
  if (result.error != null) {
    console.error(result.error);
    return false;
  }
  else {
    ctx.user = (result.data?.user ?? null) as Session["user"];
    return true;
  }
}

export async function signInGoogle(_ctx: ContextData) {
  await authClient.signIn.social({
    provider: "google",
  });
}

export async function signInGithub(_ctx: ContextData) {
  await authClient.signIn.social({
    provider: "github",
  });
}

export async function createTab(ctx: ContextData, name?: string): Promise<TabData> {
  if (ctx.user === null) {
    await signInAnonymous(ctx);
  }

  if (!name) {
    name = "New Tab";
    let i = 1;
    while (ctx.tabs.some(t => t.name === name))
      name = `New Tab #${i += 1}`;
  }

  const response = await fetch("/api/create-tab", {
    method: "POST",
    body: JSON.stringify({
      name,
    }),
    headers: {
      "Content-Type": "application-json",
    },
  });
  if (!response.ok)
    throw new Error(await response.text());
  const result: CreateTabResponse = await response.json();
  
  ctx.tabs.push({
    id: result.id,
    name: name,
    documents: [],
  });
  goto(`/tab/${result.id}`);
  return ctx.tabs.at(-1)!;
}
