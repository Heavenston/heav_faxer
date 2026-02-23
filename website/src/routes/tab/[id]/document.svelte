<script lang="ts">
  import {
    FileImage,
    FilePlay,
    FileHeadphone,
    FileArchive,
    FileCode,
    FileBraces,
    FileSpreadsheet,
    FileText,
    File as DefaultFileIcon,
    FileTerminal,
    Trash,
  } from '@lucide/svelte';
  import { fade } from "svelte/transition";
  import Loader from "$lib/loader.svelte";
  import { modals } from "svelte-modals";
  import ConfirmDialog from '$lib/confirm_dialog.svelte';
  import type { FileDocument } from "../../tab_state.svelte";

  function getLucideIcon(doc: FileDocument) {
    if (doc.mime_type.startsWith('image/')) return FileImage;
    if (doc.mime_type.startsWith('video/')) return FilePlay;
    if (doc.mime_type.startsWith('audio/')) return FileHeadphone;

    const extension = doc.file_name.split('.').pop()?.toLowerCase() || '';

    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return FileArchive;
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'rs', 'go', 'java', 'c', 'cpp'].includes(extension)) return FileCode;
    if (extension === 'json') return FileBraces;
    if (['csv', 'xls', 'xlsx'].includes(extension)) return FileSpreadsheet;
    if (['pdf', 'txt', 'md', 'doc', 'docx', 'rtf', 'log'].includes(extension)) return FileText;
    if (['jar', "exe"].includes(extension)) return FileTerminal;

    if (doc.mime_type.includes('pdf') || doc.mime_type.includes('text')) return FileText;
    if (doc.mime_type.includes('spreadsheet') || doc.mime_type.includes('csv')) return FileSpreadsheet;
    if (doc.mime_type.includes('zip') || doc.mime_type.includes('compressed')) return FileArchive;

    return DefaultFileIcon;
  }

  let { doc, onremove }: { doc: FileDocument, onremove?: () => void } = $props();

  let Icon = $derived.by(() => {
    return getLucideIcon(doc);
  });

  let file_name = $derived(doc.file_name);
  let progress_text = $derived(`${Math.floor(doc.progress * 100)}%`);
</script>

<div
  class="document-container"
  style:--upload-progress={doc.progress}
>
  <div
    style:view-transition-name={`document-${doc.local_id}`}
    class="document"
  >
    {#if doc.mime_type.startsWith('image/')}
      {#if doc.data.kind === "local_file"}
        <img src={URL.createObjectURL(doc.data.file)} class="img-previz" alt={doc.data.file.name} />
      {/if}
    {/if}
    <Icon size="var(--icon-size)" class="doc-icon" />
    {#if doc.progress < 1}
      <div out:fade={{ duration: 100 }} class="progress-overlay">
      </div>
      <div out:fade={{ duration: 100 }} class={["progress-text-container", {"progress-start": doc.progress < 0.5}]}>
        {#if doc.progress == 0}
          <Loader />
        {:else}
          <div>{progress_text}</div>
        {/if}
      </div>
    {/if}
  </div>
  <button class={["delete-btn"]} onclick={() => {
    modals.open(ConfirmDialog as any, {
      description: `Deleting file \`${doc.file_name}\``,
      yes_red: true,
      yes_button: "Delete",
      no_button: "Cancel",
      action: () => {
        onremove?.()
      },
    });
  }}>
    <Trash size="1rem" />
  </button>
  <div class="document-title">
    {file_name}
  </div>
</div>

<style lang="scss">
.document-container {
  width: 10rem;

  display: flex;
  flex-direction: column;

  gap: .5rem;

  position: relative;

  view-transition-class: animated-item;

  contain: layout;

  .document {
    width: 10rem;
    aspect-ratio: calc(1/sqrt(2));

    background: var(--gray-light);
    border-radius: var(--border-radius);

    display: flex;
    justify-content: start;
    align-items: end;
    padding: 0.4rem 0.2rem;

    color: white;

    position: relative;
    overflow: hidden;

    --icon-size: 2rem;
    
    &:not(:has(img)) {
      justify-content: center;
      align-items: center;
    }

    .img-previz {
      $padding: .5rem;

      display: block;

      position: absolute;
      inset: 0;
      z-index: -1;

      object-fit: contain;
      inset: $padding;
      width: calc(100% - $padding*2);
      height: calc(100% - $padding*2);
    }

    .progress-text-container {
      content: var(--progress-text1);
      position: absolute;
      top: 0;
      height: 1.5rem;

      display: flex;
      justify-content: center;
      align-items: center;

      transition: left 100ms ease-out, right 100ms ease-out;

      &.progress-start {
        left: calc(var(--upload-progress) * 100%);
        right: 0;
      }

      &:not(.progress-start) {
        left: 0;
        right: calc((1 - var(--upload-progress)) * 100%);
        color: black;
        font-weight: bold;
      }
    }

    .progress-overlay {
      content: var(--progress-text2);
      position: absolute;
      top: 0;
      left: 0;

      background: rgba(0,0,0,0.75);
      height: 1.5rem;
      width: 100%;

      &::before {
        content: "";
        display: block;
        background: var(--gray-lighter);
        width: calc(var(--upload-progress) * 100%);
        height: 100%;
        transition: width 100ms linear;
      }
    }
  }

  .document-title {
    text-align: center;
    width: 100%;

    position: relative;

    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    white-space: nowrap;
  }

  .delete-btn {
    opacity: 0;

    position: absolute;
    top: -.5rem;
    right: -.5rem;

    height: 1.5rem;
    width: 1.5rem;
    background: var(--red);

    border-radius: 1rem;

    display: flex;
    justify-content: center;
    align-items: center;

    transition: opacity var(--transition);
  }

  &:hover {
    .delete-btn {
      opacity: 1;
    }
  }
}

</style>
