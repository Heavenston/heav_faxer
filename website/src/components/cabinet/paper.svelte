<style lang="scss">
    .paper {
        width: 100%;
        height: 2px;

        &:not(:last-child) {
            margin-bottom: 5px;
        }

        box-shadow: 0 0 3px 3px rgba(0, 0, 0, 0.3);
        transform: rotateZ(var(--rot)) translateX(var(--move)) translateY(-50%) rotateX(-25deg) translateY(50%);

        &::after {
            content: "";
            display: block;

            background: white;
            width: 100%;
            height: 100px;
        }
    }
</style>

<script lang="ts">
    import { usePreventDrawerOpen } from "./cabinet.svelte";
    export function trunc(x: number): number {
        return Math.trunc(x * 10000) / 10000;
    }

    const prevent_drawer_open = usePreventDrawerOpen();

    let opened = false;
    let rotation = Math.random() * 1 - 0.5;
    let move = Math.random() * 8 - 4;
</script>

<div
    class="paper"
    on:mouseenter={() => prevent_drawer_open.update(i => i+1)}
    on:mouseleave={() => prevent_drawer_open.update(i => i-1)}
    style={ `--rot: ${trunc(rotation)}deg; --move: ${trunc(move)}px;` }
/>
