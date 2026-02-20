<script lang="ts">
  import { tick } from "svelte";

  type FileDocument = {
    id: string,
    file: File,
  };

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

<div class={["container", {["activated"]: documents.length > 0}]}>
  {#each documents as doc (doc.id)}
    <div
      style:view-transition-name={`document-${doc.id}`}
      class={["fafa", "document"]}
    >
      <div class={"document-title"}>
        {doc.file.name}
      </div>
      <button class={["delete-btn"]} onclick={() => removeDoc(doc.id)}>
        x
      </button>
    </div>
  {/each}
  <form style:view-transition-name="document-form" class={["document", "file-upload-form"]}>
    <input type="file" multiple onchange={(event) => {
      const el = event.currentTarget;

      withTransition(() => {
        for (const file of el.files ?? []) {
          documents.push({ file, id: crypto.randomUUID() });
        }
      });
    }} />
    Select Files
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
  animation: fade-in 100ms ease-in;
  animation-fill-mode: both;
}

::view-transition-old(.animated-item):only-child {
  animation: fade-out 100ms ease-in;
  animation-fill-mode: both;
}

::view-transition-group(*) {
  animation-duration: 200ms;
}

.document {
  width: 10rem;
  aspect-ratio: calc(1/sqrt(2));

  display: flex;
  justify-content: center;
  align-items: center;

  position: relative;

  view-transition-class: animated-item;

  contain: layout;

  &.fafa {
    background: var(--gray-light);

    padding: calc(0.75 * var(--border-radius)) var(--border-radius);
    border-radius: var(--border-radius);

    overflow-wrap: break-word;
  }

  .document-title {
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }

  .delete-btn {
    opacity: 0;

    position: absolute;
    top: -.5rem;
    right: -.5rem;

    height: 1rem;
    width: 1rem;
    background: var(--red);

    border-radius: 1rem;
  }

  &:hover {
    .delete-btn {
      opacity: 1;
    }
  }
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
}
</style>
