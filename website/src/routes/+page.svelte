<script lang="ts">
  import Document from "./document.svelte";
  import { Share2, Folder, Pencil, SquareCheckBig, Trash2 } from "@lucide/svelte";
  import { modals } from "svelte-modals";
  import ConfirmDialog from "$lib/confirm_dialog.svelte";
  import { discrete_mode, withTransition, createAndUploadFile, selected_tab, removeTab, removeDoc } from "./tab_state.svelte";

  const documents = $derived(selected_tab().documents);
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
            description: `Deleting tab \`${selected_tab.name}\``,
            yes_red: true,
            yes_button: "Delete",
            no_button: "Cancel",
            action() {
              removeTab(selected_tab().uuid);
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
