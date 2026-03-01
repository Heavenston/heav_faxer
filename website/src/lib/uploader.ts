import { readable, type Readable } from "svelte/store";

export class UploadTask {
  private static tasks = new Map<string, UploadTask>;

  public readonly id: string = crypto.randomUUID();
  $xhr: XMLHttpRequest = new XMLHttpRequest();

  public readonly progress: Readable<number>;

  constructor(public readonly path: string, public readonly blob: Blob) {
    UploadTask.tasks.set(this.id, this);

    const cbs = new Set<((val: number) => void)>;
    this.progress = readable(0, (set) => {
      cbs.add(set);
      return () => cbs.delete(set);
    });
    this.$xhr.upload.addEventListener("progress", e => {
      const progress = e.loaded / e.total;
      cbs.forEach(cb => cb(progress));
    });

    this.$xhr.open("PUT", path);
    this.$xhr.setRequestHeader("Content-Type", "application/octet-stream");
    this.$xhr.send(blob);
  }
}
