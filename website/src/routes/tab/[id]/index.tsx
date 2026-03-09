import { $, QRL, component$, useComputed$, useStore } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { LucideIcon } from "@heav-websites/component-lib";
import { Pencil, Share2, Folder, SquareCheckBig, Trash2 } from "lucide";
import { openConfirmDialog } from "~/modals/modals";

type FileDocument = {
  id: string | null,
};

const Document = component$<{
  doc: FileDocument,
  onRemove: QRL<() => void>,
}>(() => {
  return <></>;
});

export default component$(() => {
  const location = useLocation();
  const tabId = useComputed$(() => location.params.id);
  const tabName = useComputed$(() => "")

  const deleteTab = $(() => {
    
  });
  const deleteDoc = $((id: string) => {
    
  });
  const createAndUploadFiles = $((files: File[]) => {
    
  });

  const files = useStore<FileDocument[]>([]);

  return (
    <div class="section">
      <div class="section-header">
        <button class="section-header-button"><LucideIcon icon={Pencil} size="1.3rem" /></button>
        <button class="section-header-button section-alignment-fix"><LucideIcon icon={Share2} size="1.3rem" /></button>
        <button class="section-header-button"><LucideIcon icon={Folder} size="1.3rem" /></button>
        <button class="section-header-button"><LucideIcon icon={SquareCheckBig} size="1.3rem" /></button>
        <div class="section-header-separator"></div>
        <button
          class="section-header-button section-header-button-red"
          onClick$={() => {
            openConfirmDialog({
              description: `Deleting tab \`${tabName.value}\``,
              yes_red: true,
              yes_button: "Delete",
              no_button: "Cancel",
              action: deleteTab,
            });
          }}
        >
          <LucideIcon icon={Trash2} size="1.3rem" />
        </button>
      </div>
      <div class={["document-container", {["activated"]: files.length > 0}]}>
        {files.map(file => (
          <Document doc={file} onRemove={$(() => { file.id && deleteDoc(file.id); })} />
        ))}
        <form style:view-transition-name="document-form" class="file-upload-form">
          <input type="file" multiple onChange$={(_event, el) => {
            createAndUploadFiles([...(el.files ?? [])]);
          }} />
          {files.length > 0 ? `Select new files` : `Select or drop files`}
        </form>
      </div>
    </div>
  );
})
