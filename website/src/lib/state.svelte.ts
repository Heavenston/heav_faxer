import { goto } from "$app/navigation";
import { createContext } from "svelte";
import { authClient } from "$lib/auth-client";
import type { Session } from "$lib/auth.server";
import type { CreateTabResponse } from "../routes/api/tabs/+server";

export type TabData = {
  id: string,
  name: string,
};

export type ContextData = {
  user: Session["user"] | null,
  tabs: TabData[],
};

export const [getContext, setContext] = createContext<ContextData>();

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

  const response = await fetch("/api/tabs", {
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
  });
  goto(`/tab/${result.id}`);
  return ctx.tabs.at(-1)!;
}
