import { tick } from "svelte";
import type { PromiseOrValue } from "$lib";

export async function withTransition(cb: () => PromiseOrValue<void>) {
  if (document.startViewTransition) {
    const trans = document.startViewTransition(async () => {
      await cb();
      await tick();
    });
    await trans.ready;
  }
  else {
    await cb();
  }
}

