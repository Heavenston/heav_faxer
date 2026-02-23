<script lang="ts">
  import { tick } from "svelte";
  import Document, { type FileDocument } from "./document.svelte";
  import { Share2, Folder, UserRound, Plus, Pencil, SquareCheckBig, Trash2 } from "@lucide/svelte";
  import { page } from "$app/state";
  import { pushState } from "$app/navigation";

  type TabData = {
    name: string,
    uuid: string,

    documents: FileDocument[],
  };

  const tabs: TabData[] = $state([
    { name: "Today's uploads", uuid: crypto.randomUUID(), documents: [] },
  ]);
  const selected_tab: number = $derived.by(() => {
    if (typeof page.state.selected_tab === "number")
      return page.state.selected_tab;
    return 0; 
  });

  function set_selected_tab(new_idx: number) {
    if (new_idx === selected_tab)
      return;
    pushState("", {
      selected_tab: new_idx,
    });
  }

  const documents: FileDocument[] = $derived(tabs[selected_tab].documents);

  function withTransition(cb: () => void) {
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

  function removeDoc(id: string) {
    withTransition(() => {
      const idx = documents.findIndex(doc => doc.local_id === id);
      if (idx >= 0)
        documents.splice(idx, 1);
    });
  }

  function createAndUploadFile(file: File) {
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

</script>

<svelte:document on:dragenter={() => {
  console.log("enter");
}} on:dragleave={() => {
  console.log("leave");
}} on:dragexit={() => {
  console.log("exit");
}} on:dragstart={() => {
  console.log("start");
}} on:dragend={() => {
  console.log("end");
}} on:dragover={() => {
  console.log("over");
}}/>

{#snippet fileuploadform()}
<form style:view-transition-name="document-form" class="file-upload-form">
  <input type="file" multiple onchange={(event) => {
    const el = event.currentTarget;

    withTransition(() => {
      for (const file of el.files ?? []) {
        createAndUploadFile(file);
      }
    });
  }} />
  {#if documents.length > 0}
    Select new files
  {:else}
    Select or drop new files
  {/if}
</form>
{/snippet}

{#snippet tab(idx: number, name: string)}
  <button class={["tab",{["tab-selected"]: selected_tab === idx}]} onclick={() => { set_selected_tab(idx); }}>
    {name}
  </button>
{/snippet}

<div class="container">
  <header class={{"header-discrete": documents.length === 0 && tabs.length === 1}}>
    {#each tabs as tab_data, index (tab_data.uuid)}
      {@render tab(index, tab_data.name)}
    {/each}
    <button
      class="new-tab"
      onclick={() => {
        let name = "New Tab";
        let i = 1;
        while (tabs.some(t => t.name === name))
          name = `New Tab #${i += 1}`;
        tabs.push({
          name: name,
          uuid: crypto.randomUUID(),
          documents: [],
        });
        set_selected_tab(tabs.length - 1);
      }}
    >
      <Plus size="1.3rem" />
    </button>
    <div class="tabs-separator"></div>
    <button class="tabs-header-button"><UserRound size="1.3rem" /></button>
  </header>
  {#if documents.length === 0}
    <div class="empty-section">
      {@render fileuploadform()}
    </div>
  {:else}
    <div class="section">
      <div class="section-header">
        <button class="section-header-button"><Pencil size="1.3rem" /></button>
        <button class="section-header-button section-alignment-fix"><Share2 size="1.3rem" /></button>
        <button class="section-header-button"><Folder size="1.3rem" /></button>
        <button class="section-header-button"><SquareCheckBig size="1.3rem" /></button>
        <div class="section-header-separator"></div>
        <button class="section-header-button section-header-button-red"><Trash2 size="1.3rem" /></button>
      </div>
      <div class={["document-container", {["activated"]: documents.length > 0}]}>
        {#each documents as doc (doc.local_id)}
          <Document doc={doc} onremove={() => removeDoc(doc.local_id)} />
        {/each}
        {@render fileuploadform()}
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
.file-upload-form {
  color: var(--text-color-gray);

  padding: calc(0.75 * var(--border-radius)) var(--border-radius);

  border: dashed var(--text-color-gray);
  border-radius: var(--border-radius);

  display: flex;
  justify-content: center;
  align-items: center;

  position: relative;

  text-align: center;

  >input[type=file] {
    position: absolute;
    inset: 0;

    opacity: 0;

    cursor: pointer;
  }
}

.empty-section {
  flex-grow: 1;

  display: flex;
  justify-content: center;
  align-items: center;

  .file-upload-form {
    min-width: 20rem;
    max-width: 100%;
    aspect-ratio: 4/3;
  }
}

.section {
  display: flex;
  flex-direction: column;

  padding: 1rem;
  padding-top: .5rem;
  gap: .5rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0;

  .section-header-separator {
    display: inline-block;
    height: 3px;
    background: var(--gray-light);

    flex-grow: 1;

    &:not(:first-child) {
      margin-left: .5rem;
    }
    &:not(:last-child) {
      margin-right: .5rem;
    }
  }

  .section-alignment-fix {
    :global(>svg) {
      transform: translateX(-1px);
    }
  }

  .section-header-button {
    height: 2rem;
    width: 2rem;

    display: flex;
    justify-content: center;
    align-items: center;

    border-radius: var(--border-radius);
    transition: color var(--transition);
    color: var(--text-color-gray);

    :global(>svg) {
      display: block;
    }

    &:hover {
      color: white;
      &.section-header-button-red {
        color: var(--red);
      }
    }

  }
}

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

.document-container {
  display: flex;

  gap: 1rem;

  justify-content: flex-start;
  align-items: flex-start;
  align-content: flex-start;

  flex-wrap: wrap;

  >* {
    flex-grow: 0;
  }

  .file-upload-form {
    width: 10rem;
    aspect-ratio: calc(1/sqrt(2));

    display: flex;
    justify-content: center;
    align-items: center;

    position: relative;

    view-transition-class: animated-item;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    // transform: translateY(-10px) scale(0.95);
  }
}

@keyframes fade-out {
  to {
    opacity: 0;
    // transform: translateY(10px) scale(0.95);
  }
}

::view-transition-new(.animated-item):only-child {
  animation: fade-in var(--transition);
  animation-fill-mode: both;
}

::view-transition-old(.animated-item):only-child {
  animation: fade-out var(--transition);
  animation-fill-mode: both;
}

::view-transition-group(*) {
  animation-duration: var(--transition-duration);
}
</style>
