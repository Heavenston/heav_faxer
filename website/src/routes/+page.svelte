<script lang="ts">
  import { goto } from "$app/navigation";
  import { createTab, tabs } from "./tab_state.svelte";

  $effect(() => {
    if (tabs.length === 0)
      createTab();

    goto(`/tab/${tabs[0].uuid}`);
  });
</script>
