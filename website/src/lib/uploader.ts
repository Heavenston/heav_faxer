import { createNanoEvents, type EmitterMixin, type Unsubscribe } from "nanoevents";

// TODO: Tweak, maybe decide at runtime
const MAX_ACTIVE_TASKS = 10;

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

  constructor(public readonly path: string, public readonly blob: Blob) {
    UploadTask.#tasks.set(this.id, this);

    this.#xhr.upload.addEventListener("progress", e => {
      this.#setProgress(e.loaded / e.total);
    });
    this.#xhr.addEventListener("loadend", e => {
      UploadTask.#active_tasks.delete(this);
      console.log(e);
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

  on<K extends keyof Events>(event: K, cb: Events[K]): Unsubscribe {
    return this.#emitter.on(event, cb);
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
}
