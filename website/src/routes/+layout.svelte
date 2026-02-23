<script lang="ts">
	import "../global.scss";

	import favicon from '$lib/assets/favicon.svg';
  import { Modals } from "svelte-modals";
  import { Plus, UserRound } from "@lucide/svelte";
  import { discrete_mode, selected_tab, tabs, createTab, set_selected_tab } from "./tab_state.svelte";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="container">
  <header class={{"header-discrete": discrete_mode()}}>
    {#each tabs as tab_data (tab_data.uuid)}
      <button class={["tab",{["tab-selected"]: selected_tab().uuid === tab_data.uuid}]} onclick={() => { set_selected_tab(tab_data.uuid); }}>
        {tab_data.name}
      </button>
    {/each}
    <button
      class="new-tab"
      onclick={() => createTab()}
    >
      <Plus size="1.3rem" />
    </button>
    <div class="tabs-separator"></div>
    <a href="/user-settings" class="tabs-header-button"><UserRound size="1.3rem" /></a>
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

  background: var(--gray-darker);

  display: flex;

  padding: 0 0rem;
  gap: 0rem;

  transition: opacity var(--transition);

  &.header-discrete {
    position: absolute;
    opacity: 0;

    &:hover {
      opacity: 1;
    }
  }

  >.tab {
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

  >.new-tab {
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

  >.tabs-separator {
    flex-grow: 1;
  }

  >.tabs-header-button {
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
