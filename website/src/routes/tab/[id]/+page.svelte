<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { discrete_mode, tabs, withTransition, type FileDocument, type TabData } from "../../tab_state.svelte";
  import { Folder, Pencil, Share2, SquareCheckBig, Trash2 } from "@lucide/svelte";
  import { modals } from "svelte-modals";
  import ConfirmDialog from "$lib/confirm_dialog.svelte";
  import Document from "./document.svelte";

  const selected_tab = $derived(tabs.find(tab => tab.uuid === page.params.id) ?? null);

  $effect(() => {
    if (selected_tab === null)
      goto("/");
  });

  const documents = $derived(selected_tab?.documents ?? []);

  function removeDoc(id: string) {
    withTransition(() => {
      const idx = documents.findIndex(doc => doc.local_id === id);
      if (idx >= 0)
        documents.splice(idx, 1);
    });
  }

  function createTab(name?: string): TabData {
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

  function removeTab(id: string) {
    const idx = tabs.findIndex(tab => tab.uuid === id);
    if (idx < 0)
      return;
    if (tabs.length <= 1)
      createTab();
    tabs.splice(idx, 1);
    if (selected_tab?.uuid === id) {
      goto(`/tab/${tabs[0].uuid}`);
    }
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

{#if discrete_mode()}
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
      <button
        class="section-header-button section-header-button-red"
        onclick={() => {
          modals.open(ConfirmDialog as any, {
            description: `Deleting tab \`${selected_tab?.name}\``,
            yes_red: true,
            yes_button: "Delete",
            no_button: "Cancel",
            action() {
              if (selected_tab)
                removeTab(selected_tab.uuid);
            },
          });
        }}
      >
        <Trash2 size="1.3rem" />
      </button>
    </div>
    <div class={["document-container", {["activated"]: documents.length > 0}]}>
      {#each documents as doc (doc.local_id)}
        <Document doc={doc} onremove={() => removeDoc(doc.local_id)} />
      {/each}
      {@render fileuploadform()}
    </div>
  </div>
{/if}

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
