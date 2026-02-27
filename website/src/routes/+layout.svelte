<script lang="ts">
	import "../global.scss";

	import { page } from "$app/state";
  import { Modals } from "svelte-modals";
  import { ChevronDown, Plus, UserRound } from "@lucide/svelte";
  import type { LayoutProps } from "./$types";

	import favicon from '$lib/assets/favicon.svg';
  import { discrete_mode, createTab, setContext, type ContextData } from "$lib/state.svelte";

	let { children, data }: LayoutProps = $props();

	// We only initialize the context with the initial page data, we manually
	// keep the context up to date
	/* svelte-ignore state_referenced_locally */
	const ctx: ContextData = $state({
  	user: data.user,
	  tabs: data.tabs.map(tab => ({
	    id: tab.id,
	    name: tab.name,
	    documents: [],
	  })),
	} satisfies ContextData);

	setContext(ctx);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="container">
  <header class={{"header-discrete": discrete_mode(ctx)}}>
    <div class="header-inside-container">
      {#each ctx.tabs as tab_data (tab_data.id)}
        <a
          class={["tab",{["tab-selected"]: page.url.pathname === `/tab/${tab_data.id}`}]}
          href="/tab/{tab_data.id}"
        >
          {tab_data.name}
        </a>
      {/each}
      <button
        class="new-tab"
        onclick={() => createTab(ctx)}
      >
        <Plus size="1.3rem" />
      </button>
      <div class="tabs-separator"></div>
      <a href="/user-settings" class={["tabs-header-button", {"tabs-header-button-selected": page.url.pathname === "/user-settings" }]}>
        <UserRound size="1.3rem" />
      </a>
    </div>
    <div class="discrete-arrow">
      <ChevronDown size="1.3rem" />
    </div>
  </header>
	{@render children()}
</div>

<Modals>
	{#snippet backdrop({ close })}
    <button aria-label="Close dialog" tabindex="-1" class="modal-backdrop" onclick={() => close()}></button>
  {/snippet}
</Modals>

<style lang="scss">
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  height: 2rem;
  width: 100%;

  &.header-discrete {
    position: absolute;
    // Bigger outer container size for easier :hover
    height: 3rem;

    .header-inside-container {
      opacity: 0;
      transform: translateY(-2rem);
    }

    .discrete-arrow {
      position: absolute;
      inset: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      transform: translateY(0);
      height: 2rem;

      transition: transform var(--transition);

      color: var(--text-color-gray);
    }

    &:hover {
      .header-inside-container {
        opacity: 1;
        transform: translateY(0);
      }

      .discrete-arrow {
        transform: translateY(2rem) rotate(180deg);
      }
    }
  }

  &:not(.header-discrete) .discrete-arrow {
    display: none;
  }

  .header-inside-container {
    height: 2rem;
    width: 100%;

    background: var(--gray-darker);

    display: flex;

    padding: 0 0rem;
    gap: 0rem;

    transition: opacity var(--transition), transform var(--transition);
  }

  .tab {
    display: flex;
    justify-content: center;
    align-items: center;

    height: 100%;

    background: var(--gray-darker);
    padding: 0 1rem;
    color: var(--text-color-gray);

    transition: background var(--transition), color var(--transition);

    &.tab-selected {
      background: var(--gray-dark);
      color: var(--text-color);
    }

    &:hover {
      color: var(--text-color);
    }
  }

  .new-tab {
    height: 100%;
    aspect-ratio: 1;
    display: flex;
    justify-content: center;
    align-items: center;

    transition: color var(--transition);
    color: var(--text-color-gray);

    &:hover {
      color: white;
    }
  }

  .tabs-separator {
    flex-grow: 1;
  }

  .tabs-header-button {
    height: 100%;
    aspect-ratio: 1;
    display: flex;
    justify-content: center;
    align-items: center;

    transition: color var(--transition);
    color: var(--text-color-gray);

    &:hover {
      color: white;
    }

    &.tabs-header-button-selected {
      background: var(--gray-dark);
    }
  }
}

.modal-backdrop {
	position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.5);
}
</style>
