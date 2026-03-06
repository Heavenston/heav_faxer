import { createNanoEvents, type EmitterMixin, type Unsubscribe } from "nanoevents";
import { browser } from "$app/environment";
import type { GetTabFilesResponse } from "../routes/api/tabs/[tab_id=uuid]/files/+server";

// TODO: Tweak, maybe decide at runtime
const MAX_ACTIVE_TASKS = 10;

if (browser) {
  window.onbeforeunload = () => {
    if (UploadTask.hasActiveTasks())
      return "Reloading will stop the current uploads";
  };
}

type Events = {
  started: () => void,
  uploadProgress: (progress: number) => void,
  finishedSuccess: () => void,
  finishedError: () => void,
};

export class UploadTask implements EmitterMixin<Events> {
  static #tasks = new Map<string, UploadTask>;
  static #active_tasks = new Set<UploadTask>;
  static #task_queue: UploadTask[] = [];

  public readonly id: string = crypto.randomUUID();

  #emitter = createNanoEvents<Events>();
  #xhr: XMLHttpRequest = new XMLHttpRequest();

  constructor(public readonly path: string, public readonly blob: Blob, public readonly file: GetTabFilesResponse["files"][number]) {
    UploadTask.#tasks.set(this.id, this);

    this.#xhr.upload.addEventListener("progress", e => {
      this.#setProgress(e.loaded / e.total);
    });
    this.#xhr.addEventListener("loadend", () => {
      UploadTask.#active_tasks.delete(this);
      console.log("Task", this.id, "ended");
      if (this.#xhr.status < 200 || this.#xhr.status > 299) {
        this.#emitter.emit("finishedError");
      }
      else {
        this.#emitter.emit("finishedSuccess");
      }
      UploadTask.#startFromQueue();
    });

    this.#xhr.open("PUT", this.path);

    UploadTask.#task_queue.push(this);
    UploadTask.#startFromQueue();
  }

  #setProgress(progress: number) {
    this.#emitter.emit("uploadProgress", progress);
  }

  #start() {
    this.#setProgress(0.01);
    this.#xhr.setRequestHeader("Content-Type", "application/octet-stream");
    this.#xhr.send(this.blob);
  }

  /**
   * Starts tasks still in the task_queue if possible
   */
  static #startFromQueue() {
    while (this.#active_tasks.size < MAX_ACTIVE_TASKS) {
      const task = UploadTask.#task_queue.shift();
      if (!task) break;
      UploadTask.#active_tasks.add(task);
      task.#start();
    }
  }

  static get tasks() {
    return this.#tasks.values();
  }

  static hasActiveTasks(): boolean {
    return this.#active_tasks.size > 0;
  }

  public on<K extends keyof Events>(event: K, cb: Events[K]): Unsubscribe {
    return this.#emitter.on(event, cb);
  }

  /**
   * Cancels the upload
   */
  public abort() {
    console.log("Canceling task", this.id);
    this.#xhr.abort();
  }
}
