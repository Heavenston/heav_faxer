<script lang="ts">
  import { createTab, getContext } from "$lib/state.svelte";
  import { withTransition } from "$lib/with_transition";

  const ctx = getContext();
</script>

<div class="empty-section">
  <form style:view-transition-name="document-form" class="file-upload-form">
    <input type="file" multiple onchange={(event) => {
      const el = event.currentTarget;

      withTransition(async () => {
        const tab = await createTab(ctx);

        for (const file of el.files ?? []) {
          tab.documents.push({
            id: "",
            data: {
              file,
              kind: "local_file",
            },
            mime_type: file.type,
            name: file.name,
            progress: 0,
          });
        }
      });
    }} />
    Select or drop new files
  </form>
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

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@keyframes fade-out {
  to {
    opacity: 0;
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
