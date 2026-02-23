<script lang="ts">
  import { tick } from "svelte";
  import Document, { type FileDocument } from "./document.svelte";
  import { Share2, Folder, UserRound } from "@lucide/svelte";

  let documents: FileDocument[] = $state([]);

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

  let selected: number = $state(0);
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
  <button class={["tab",{["tab-selected"]: selected === idx}]} onclick={() => { selected = idx; }}>
    {name}
  </button>
{/snippet}

{#if documents.length === 0}
  <div class="unitied-page">
    {@render fileuploadform()}
  </div>
{:else}
  <div class="container">
    <header>
      {@render tab(0, "Today's Uploads")}
      {@render tab(1, "New Folder")}
      {@render tab(2, "Older Folder")}
    </header>
    <div class="section">
      <div class="section-header">
        <div class="section-header-buttons">
          <button class="section-header-button section-alignment-fix"><Share2 size="1.3rem" /></button>
          <button class="section-header-button"><Folder size="1.3rem" /></button>
        </div>
        <div class="section-header-separator2"></div>
        <div class="section-header-buttons">
          <button class="section-header-button"><UserRound size="1.3rem" /></button>
        </div>
      </div>
      <div class={["document-container", {["activated"]: documents.length > 0}]}>
        {#each documents as doc (doc.local_id)}
          <Document doc={doc} onremove={() => removeDoc(doc.local_id)} />
        {/each}
        {@render fileuploadform()}
      </div>
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

.unitied-page {
  height: 100vh;

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
  gap: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: .5rem;

  .section-header-separator1, .section-header-separator2 {
    display: inline-block;
    height: 3px;
    background: var(--gray-light);
  }

  .section-header-separator1 {
    width: 1rem;
  }

  .section-header-separator2 {
    flex-grow: 1;
  }

  .section-header-buttons {
    display: flex;
    align-items: center;
    gap: .25rem;
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

    margin: -.25rem;

    :global(>svg) {
      display: block;
    }

    &:hover {
      background: var(--gray-light);
    }
  }
}

.container {
  min-height: 100vh;
}

header {
  height: 2rem;
  width: 100%;

  background: var(--gray-darker);

  display: flex;

  padding: 0 0rem;
  gap: 0rem;

  >.tab {
    display: flex;
    justify-content: center;
    align-items: center;

    height: 100%;

    background: var(--gray-darker);
    padding: 0 1rem;
    color: var(--text-color-gray);

    transition: background 100ms ease-out, border-radius 100ms ease-out, color 100ms ease-out;

    &.tab-selected {
      border-radius: var(--border-radius) var(--border-radius) 0 0;
      background: var(--gray-dark);
      color: var(--text-color);
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
  animation: fade-in 100ms ease-out;
  animation-fill-mode: both;
}

::view-transition-old(.animated-item):only-child {
  animation: fade-out 100ms ease-out;
  animation-fill-mode: both;
}

::view-transition-group(*) {
  animation-duration: 200ms;
}

.account-button {
  position: absolute;
  top: 1rem;
  right: 1rem;

  width: 2.5rem;
  height: 2.5rem;

  display: flex;
  justify-content: center;
  align-items: center;

  background: var(--gray-light);
  border-radius: var(--border-radius);

  box-shadow: rgba(0,0,0,0.25) 0 3px 7.5px;

  transition: box-shadow 100ms ease-out, background 100ms ease-out;

  &:hover {
    box-shadow: rgba(0,0,0,0.25) 0 5px 15px;
    background: var(--gray-lightest);
    color: black;
  }
}
</style>
