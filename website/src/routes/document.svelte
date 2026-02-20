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
    X,
  } from '@lucide/svelte';

  export function getLucideIcon(file: File) {
    if (file.type.startsWith('image/')) return FileImage;
    if (file.type.startsWith('video/')) return FilePlay;
    if (file.type.startsWith('audio/')) return FileHeadphone;

    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return FileArchive;
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'rs', 'go', 'java', 'c', 'cpp'].includes(extension)) return FileCode;
    if (extension === 'json') return FileBraces;
    if (['csv', 'xls', 'xlsx'].includes(extension)) return FileSpreadsheet;
    if (['pdf', 'txt', 'md', 'doc', 'docx', 'rtf', 'log'].includes(extension)) return FileText;

    if (file.type.includes('pdf') || file.type.includes('text')) return FileText;
    if (file.type.includes('spreadsheet') || file.type.includes('csv')) return FileSpreadsheet;
    if (file.type.includes('zip') || file.type.includes('compressed')) return FileArchive;

    return DefaultFileIcon;
  }
  export type FileDocument = {
    id: string,
    file: File,
  };

  let { doc, onremove }: { doc: FileDocument, onremove?: () => void } = $props();

  let Icon = $derived.by(() => {
    return getLucideIcon(doc.file);
  });
</script>

<div class="document-container">
  <div
    style:view-transition-name={`document-${doc.id}`}
    class="document"
  >
    <Icon size="4rem" />
  </div>
  <button class={["delete-btn"]} onclick={() => onremove?.()}>
    <X size="1rem" />
  </button>
  <div class="document-title">
    <div class="partial-title">{doc.file.name}</div>
    <div class="full-title">
      {doc.file.name}
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

    padding: 0.6rem 0.2rem;

    color: var(--text-color-gray);
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
