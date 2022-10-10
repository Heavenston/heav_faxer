<style lang="scss">
    .cabinet {
        * {
            transform-style:flat;
            perspective: 1000px;
            perspective-origin: center -1000px;
        }

        display: flex;
        flex-direction: column-reverse;
        width: 350px;

        background-color: var(--main-9);
        padding: 10px;
        /*padding: 25px;
          padding-top: 30px;
          padding-bottom: 30px;*/
        gap: 30px;

        border-radius: 10px;
        height: calc(min(100%, 670px));
    }
</style>

<script lang="ts" context="module">
    import type { Writable } from "svelte/store";
    import { useTypedContext } from "~/utils/useTypedContext";

    const {
        get: usePreventDrawerOpen,
        set: setPreventDrawerOpen,
    } = useTypedContext<Writable<number>>("prevent_drawer_open");
    export { usePreventDrawerOpen };
</script>

<script lang="ts">
    import { default as Drawer } from "./drawer.svelte";
    import { writable } from "svelte/store";

    setPreventDrawerOpen(writable(-1));
</script>

<div class="cabinet">
    <Drawer label="Files" index={2} />
    <Drawer label="Links" index={1} />
</div>
