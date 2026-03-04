<script lang="ts">
  import { Folder, Pencil, Share2, SquareCheckBig, Trash2 } from "@lucide/svelte";

  import { page } from "$app/state";
  import { goto } from "$app/navigation";

  import { createTab, getContext } from "$lib/state.svelte";
  import { openConfirmDialog } from "$lib/modal_helpers";
  import { withTransition } from "$lib/with_transition";
  import Document, { type FileDocument } from "./document.svelte";
  import type { PageProps } from "./$types";
  import type { CreateFileRequest, CreateFileResponse, GetTabFilesResponse } from "../../api/tabs/[tab_id=uuid]/files/+server";
  import { UploadTask } from "$lib/uploader";

  const { data }: PageProps = $props();

  const ctx = getContext();
  const selected_tab = $derived(ctx.tabs.find(tab => tab.id === page.params.id) ?? null);
  // svelte-ignore state_referenced_locally
  let files = $state(data.files.map((f: GetTabFilesResponse["files"][number]): FileDocument => f));

  $effect(() => {
    files = data.files;
  });

  async function removeDoc(id: string) {
    withTransition(() => {
      const idx = files.findIndex(doc => doc.id === id);
      if (idx >= 0)
        files.splice(idx, 1);
    });
  }

  async function removeTab(id: string) {
    const idx = ctx.tabs.findIndex(tab => tab.id === id || tab.id === id);
    if (idx < 0)
      return;

    (async () => {
      const response = await fetch(`/api/tabs/${id}`, { method: "DELETE" });
      // TODO: Rollback on error(?)
      if (!response.ok)
        throw new Error(await response.text());
    })();

    if (ctx.tabs.length <= 1)
      await createTab(ctx);

    const sid = selected_tab?.id;
    ctx.tabs.splice(idx, 1);
    if (sid === id) {
      goto(`/tab/${ctx.tabs[0].id ?? ctx.tabs[0].id}`);
    }
  }

  async function createAndUploadFiles(to_insert_files: File[]) {
    if (to_insert_files.length > 30) {
      const rest = to_insert_files.splice(30);
      await createAndUploadFiles(to_insert_files);
      await createAndUploadFiles(rest);
      return;
    }

    let new_files = to_insert_files.map((file): FileDocument => ({
      id: null,
      local_id: crypto.randomUUID(),
      owner: ctx.user?.id ?? "",
      tab: page.params.id ?? "",
      name: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,

      progress: { kind: "creating" },
      data: { kind: "local_file", file },
    }));

    await withTransition(() => {
      const start = files.length;
      files.push(...new_files);
      // get back the proxied objects
      new_files = files.slice(start);
    });

    const response = await fetch(`/api/tabs/${page.params.id}/files`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: to_insert_files.map(file => ({
          name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
        })),
      } satisfies CreateFileRequest),
    });
    if (!response.ok)
      throw new Error(await response.text());
    const body: CreateFileResponse = await response.json();

    new_files.forEach((file, idx) => {
      file.id = body.file_ids[idx];
      file.progress = { kind: "uploading", progress: 0 };

      const task = new UploadTask(`/api/tabs/${page.params.id}/files/${file.id}`, to_insert_files[idx]);

      task.on("uploadProgress", progress => {
        file.progress = { kind: "uploading", progress };
      })
      task.on("finishedSuccess", () => {
        file.progress = undefined;
      });
      task.on("finishedError", () => {
        file.progress = { kind: "error" };
      });
    });
  }
</script>

{#snippet fileuploadform()}
<form style:view-transition-name="document-form" class="file-upload-form">
  <input type="file" multiple onchange={(event) => {
    createAndUploadFiles([...(event.currentTarget.files ?? [])]);
  }} />
  {#if files.length > 0}
    Select new files
  {:else}
    Select or drop files
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
          async action() {
            if (selected_tab)
              await removeTab(selected_tab.id);
          },
        });
      }}
    >
      <Trash2 size="1.3rem" />
    </button>
  </div>
  <div class={["document-container", {["activated"]: files.length > 0}]}>
    {#each files as file (file.local_id ?? file.id)}
      <Document doc={file} onremove={() => file.id && removeDoc(file.id)} />
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
