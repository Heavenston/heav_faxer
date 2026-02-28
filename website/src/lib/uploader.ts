
type UploadTask = {
  id: string,
};

const upload_tasks = new Map<string, UploadTask>();

export function startUploadTask(path: string, blob: Blob): UploadTask {
  const task: UploadTask = {
    id: crypto.randomUUID(),
  };
  upload_tasks.set(task.id, task);

  (async () => {
    const body = new FormData();
    body.append("file", blob);
    await fetch(path, {
      method: "PUT",
      body,
      // headers: {
      //   "Content-Type": "multipart/form-data",
      // },
    });
  })();

  return task;
}
