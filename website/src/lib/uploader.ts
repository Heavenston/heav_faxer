import { readable, type Readable } from "svelte/store";

// TODO: Tweak, maybe decide at runtime
const MAX_ACTIVE_TASKS = 20;

export class UploadTask {
  static #tasks = new Map<string, UploadTask>;
  static #active_tasks = new Set<UploadTask>;
  static #task_queue: UploadTask[] = [];

  public readonly id: string = crypto.randomUUID();
  public readonly progress: Readable<number>;

  #cbs = new Set<((val: number) => void)>;
  #xhr: XMLHttpRequest = new XMLHttpRequest();

  constructor(public readonly path: string, public readonly blob: Blob) {
    UploadTask.#tasks.set(this.id, this);

    this.progress = readable(0, (set) => {
      this.#cbs.add(set);
      return () => this.#cbs.delete(set);
    });

    this.#xhr.upload.addEventListener("progress", e => {
      const progress = (e.loaded / e.total) * 0.98 + 0.01;
      this.#setProgress(progress);
    });
    this.#xhr.addEventListener("loadend", () => {
      UploadTask.#active_tasks.delete(this);
      this.#setProgress(1);
      UploadTask.#startFromQueue();
    });

    this.#xhr.open("PUT", this.path);

    UploadTask.#task_queue.push(this);
    UploadTask.#startFromQueue();
  }

  #setProgress(progress: number) {
    this.#cbs.forEach(cb => cb(progress));
  }

  #start() {
    this.#setProgress(0.01);
    this.#xhr.setRequestHeader("Content-Type", "application/octet-stream");
    this.#xhr.send(this.blob);
  }

  static #startFromQueue() {
    while (this.#active_tasks.size < MAX_ACTIVE_TASKS) {
      const task = UploadTask.#task_queue.shift();
      if (!task) break;
      UploadTask.#active_tasks.add(task);
      task.#start();
    }
  }
}
