<script lang="ts">
  import { tick } from "svelte";
  import Document, { type FileDocument } from "./document.svelte";

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
      const idx = documents.findIndex(doc => doc.id === id);
      if (idx >= 0)
        documents.splice(idx, 1);
    });
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

<div class={["container", {["activated"]: documents.length > 0}]}>
  {#each documents as doc (doc.id)}
    <Document doc={doc} onremove={() => removeDoc(doc.id)} />
  {/each}
  <form style:view-transition-name="document-form" class={["document", "file-upload-form"]}>
    <input type="file" multiple onchange={(event) => {
      const el = event.currentTarget;

      withTransition(() => {
        for (const file of el.files ?? []) {
          documents.push({
            progress: 0,
            file,
            id: crypto.randomUUID(),
          });
          const doc: FileDocument = documents.at(-1)!;
          const i = setInterval(() => {
            doc.progress += Math.random() * 0.05;
            if (doc.progress > 1) {
              doc.progress = 1;
              clearInterval(i);
            }
          }, 100);
        }
      });
    }} />
    {#if documents.length > 0}
      Select new files
    {:else}
      Select or drop new files
    {/if}
  </form>
</div>

<style lang="scss">
.container {
  width: 100vw;

  display: flex;

  padding: 1rem;
  gap: 1rem;
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

.container:not(.activated) {
  height: 100vh;

  justify-content: center;
  align-items: center;

  .file-upload-form {
    min-width: 20rem;
    max-width: 100%;
    aspect-ratio: 4/3;
  }
}

.container.activated {
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
</style>
