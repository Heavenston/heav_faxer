import { $, QRL, component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import classes from "./index.module.scss";

type FileDocument = {
  id: string,
  file: File,
};

const Document = component$<{
  doc: FileDocument,
  onDelete?: QRL<() => void>,
}>((props) => {
  return <div
    style={{ viewTransitionName: props.doc.id }}
    class={[classes["fafa"], classes["document"]]}
    onQviewTransition$={e => {
      console.log("TOTOTO");
    }}
  >
    <div class={classes["document-title"]}>
      {props.doc.file.name}
    </div>
    <button class={[classes["delete-btn"]]} onClick$={() => props.onDelete?.()}>
      x
    </button>
  </div>;
});

export default component$(() => {
  const documents = useSignal<FileDocument[]>([]);

  document.startViewTransition({
  })
  
  return <>
    <div class={[classes["container"], {[classes["activated"]]: documents.value.length > 0}]}>
      {documents.value.map((doc) => {
        return <Document doc={doc} key={doc.id} onDelete={$(() => {
          document.startViewTransition(() => {
            documents.value = documents.value.filter(doc_ => doc_.id != doc.id)
          });
        })} />;
      })}
      <form class={[classes["document"], classes["file-upload-form"]]} onQviewTransition$={e => {
        console.log("TATAT");
      }}>
        <input type="file" multiple onChange$={(_event, el) => {
          const newDocs: FileDocument[] = [];
          for (const file of el.files ?? []) {
            newDocs.push({ file, id: crypto.randomUUID() });
          }
          document.startViewTransition(() => {
            documents.value = [...documents.value, ...newDocs];
          });
        }} />
        Select Files
      </form>
    </div>
  </>;
});

export const head: DocumentHead = {
  title: "Heav Faxer",
};
