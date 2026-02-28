import { modals } from "svelte-modals";
import ConfirmDialog from "$lib/confirm_dialog.svelte";

export function openConfirmDialog(cfg: {
  description?: string,
  yes_red?: boolean,
  yes_button?: string,
  no_red?: boolean,
  no_button?: string,
  action: () => (void | Promise<void>),
}) {
  modals.open(ConfirmDialog as any, cfg);
}
