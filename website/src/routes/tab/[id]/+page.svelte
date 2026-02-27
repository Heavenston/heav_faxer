<script lang="ts">
  import { Folder, Pencil, Share2, SquareCheckBig, Trash2 } from "@lucide/svelte";

  import { page } from "$app/state";
  import { goto } from "$app/navigation";

  import { createTab, getContext, type FileDocument } from "$lib/state.svelte";
  import { openConfirmDialog } from "$lib/modal_helpers";
  import { withTransition } from "$lib/with_transition";
  import Document from "./document.svelte";

  const ctx = getContext();
  const selected_tab = $derived(ctx.tabs.find(tab => tab.id === page.params.id) ?? null);

  $effect(() => {
    if (selected_tab === null)
      goto("/");
  });

  const documents = $derived(selected_tab?.documents ?? []);

  function removeDoc(id: string) {
    withTransition(() => {
      const idx = documents.findIndex(doc => doc.id === id);
      if (idx >= 0)
        documents.splice(idx, 1);
    });
  }

  function removeTab(id: string) {
    const idx = ctx.tabs.findIndex(tab => tab.id === id || tab.id === id);
    if (idx < 0)
      return;
    if (ctx.tabs.length <= 1)
      createTab(ctx);
    ctx.tabs.splice(idx, 1);
    if (selected_tab?.id === id || selected_tab?.id === id) {
      goto(`/tab/${ctx.tabs[0].id ?? ctx.tabs[0].id}`);
    }
  }

  function createAndUploadFile(file: File) {
    documents.push({
      progress: 0,
      name: file.name,
      mime_type: file.type,
      data: {
        kind: "local_file",
        file,
      },
      id: crypto.randomUUID(),
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

<div class="section">
  <div class="section-header">
    <button class="section-header-button"><Pencil size="1.3rem" /></button>
    <button class="section-header-button section-alignment-fix"><Share2 size="1.3rem" /></button>
    <button class="section-header-button"><Folder size="1.3rem" /></button>
    <button class="section-header-button"><SquareCheckBig size="1.3rem" /></button>
    <div class="section-header-separator"></div>
    <button
      class="section-header-button section-header-button-red"
      onclick={() => {
        openConfirmDialog({
          description: `Deleting tab \`${selected_tab?.name}\``,
          yes_red: true,
          yes_button: "Delete",
          no_button: "Cancel",
          action() {
            if (selected_tab)
              removeTab(selected_tab.id);
          },
        });
      }}
    >
      <Trash2 size="1.3rem" />
    </button>
  </div>
  <div class={["document-container", {["activated"]: documents.length > 0}]}>
    {#each documents as doc (doc.id)}
      <Document doc={doc} onremove={() => removeDoc(doc.id)} />
    {/each}
    {@render fileuploadform()}
  </div>
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

  width: 10rem;
  aspect-ratio: calc(1/sqrt(2));

  display: flex;
  justify-content: center;
  align-items: center;

  position: relative;

  view-transition-class: animated-item;

  >input[type=file] {
    position: absolute;
    inset: 0;

    opacity: 0;

    cursor: pointer;
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
