import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import c from "./index.module.scss";

export default component$(() => {
  function createTab() {
    
  }

  return (
    <div class={c["empty-section"]}>
      <form style:view-transition-name="document-form" class={c["file-upload-form"]}>
        <input type="file" multiple onChange$={(_event) => {
          createTab();
          // TODO: Upload the files
        }} />
        Select or drop new files
      </form>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Heav Faxer",
};
