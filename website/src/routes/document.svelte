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
    X,
  } from '@lucide/svelte';
  import { fade } from "svelte/transition";
  import Loader from "./document-loader.svelte";

  export type FileDocumentData = {
    kind: "local_file",
    file: File,
  };
  export type FileDocument = {
    local_id: string,
    mime_type: string,
    file_name: string,
    data: FileDocumentData,
    progress: number,
  };

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
        <img src={URL.createObjectURL(doc.data.file)} class="img-previz1" alt={doc.data.file.name} />
        <img src={URL.createObjectURL(doc.data.file)} class="img-previz2" alt={doc.data.file.name} />
      {/if}
    {/if}
    <Icon size="var(--icon-size)" class="doc-icon" />
    {#if doc.progress < 1}
      <div class="progress-overlay">
      </div>
      <div out:fade class={["progress-text-container", {"progress-start": doc.progress < 0.5}]}>
        {#if doc.progress == 0}
          <Loader />
        {:else}
          <div>{progress_text}</div>
        {/if}
      </div>
    {/if}
  </div>
  <button class={["delete-btn"]} onclick={() => onremove?.()}>
    <X size="1rem" />
  </button>
  <div class="document-title">
    <div class="partial-title">{file_name}</div>
    <div class="full-title">
      {file_name}
    </div>
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
    padding: 0.6rem 0.2rem;

    color: white;

    position: relative;
    overflow: hidden;

    --icon-size: 2rem;
    
    &:not(:has(img)) {
      justify-content: center;
      align-items: center;
    }

    .img-previz1, .img-previz2 {
      display: block;

      position: absolute;
      inset: 0;

      z-index: -1;
    }

    .img-previz1 {
      object-fit: cover;
      filter: blur(10px);
      width: 100%;
      height: 100%;
    }
    .img-previz2 {
      object-fit: contain;
      inset: .5rem;
      width: calc(100% - 1rem);
      height: calc(100% - 1rem);
    }

    .progress-text-container {
      content: var(--progress-text1);
      position: absolute;
      right: 0;
      left: 0;

      display: flex;
      justify-content: center;
      align-items: center;

      transition: top 100ms ease-out, bottom 100ms ease-out;

      &.progress-start {
        top: calc(var(--upload-progress) * 100%);
        bottom: 0;
      }

      &:not(.progress-start) {
        top: 0;
        bottom: calc((1 - var(--upload-progress)) * 100%);

        >* {
          background: var(--gray-darker);
          padding: 0.25rem 0.5rem;
          border-radius: var(--border-radius);
        }
      }
    }

    .progress-overlay {
      content: var(--progress-text2);
      position: absolute;
      bottom: 0;
      right: 0;
      left: 0;

      background: rgba(0,0,0,0.75);
      height: calc((1 - var(--upload-progress)) * 100%);

      transition: height 100ms linear;

      display: flex;
      justify-content: center;
      align-items: center;

      backdrop-filter: grayscale(50%) blur(3px);
    }
  }

  .document-title {
    text-align: center;
    width: 100%;

    position: relative;

    .partial-title {
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
      white-space: nowrap;
    }

    .full-title {
      display: none;
    
      position: absolute;
      top: -0.25rem;
      left: 50%;

      transform: translateX(-50%);

      background: var(--gray-darker);
      padding: 0.25rem 0.5rem;
      border-radius: var(--border-radius);
      white-space: nowrap;
    }
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
  }

  &:hover {
    z-index: 1;

    .delete-btn {
      opacity: 1;
    }

    .full-title {
      display: initial;
    }
  }
}

</style>
