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

    /*
        FLOATING PAPER
    */

    @keyframes floating-paper-showup {
        from {
            height: 0px;
        }
        to {
            height: 200px;
        }
    }

    .floating-paper {
        position: absolute;
        pointer-events: none;

        transform: translateY(calc(-100% + 20px)) rotateZ(var(--rot));
        clip-path: inset(-50px -50px 18px -50px);
        background: white;

        box-shadow: 0 0 3px 3px rgba(0, 0, 0, 0.3);

        animation-name: floating-paper-showup;
        animation-duration: 300ms;
        animation-timing-function: linear;
        animation-fill-mode: both;

        &.hide {
            animation-name: floating-paper-showup;
            animation-direction: reverse;
            animation-duration: 300ms;
            animation-delay: 200ms;
            animation-timing-function: linear;
            animation-fill-mode: both;
        }
    }
</style>

<script lang="ts">
    import { usePreventDrawerOpen } from "./cabinet.svelte";
    import { mountOnBody } from "~/utils/mountOnBody";
    export function trunc(x: number): number {
        return Math.trunc(x * 10000) / 10000;
    }

    let paper: HTMLDivElement | null = null;
    let floatingPaper: HTMLDivElement | null = null;

    const prevent_drawer_open = usePreventDrawerOpen();

    let opened = false;
    const rotation = Math.random() * 1 - 0.5;
    const move = Math.random() * 8 - 4;

    const updateFloatingPaper = () => {
        if (!paper || !floatingPaper)
            return;
        const bcr = paper.getBoundingClientRect();
        floatingPaper.style.left = `${bcr.left}px`;
        floatingPaper.style.top = `${bcr.top}px`;
        floatingPaper.style.width = `${bcr.width}px`;
        floatingPaper.style.setProperty("--rot", paper.style.getPropertyValue("--rot"))
        floatingPaper.style.zIndex = `${Math.trunc(bcr.y / 10)}`;
    };

    const onMouseEnter = () => {
        opened = true;
        prevent_drawer_open.update(i => i+1);
        updateFloatingPaper();
    };
    const onMouseLeave = () => {
        setTimeout(() => {
            opened = false;
            prevent_drawer_open.update(i => i-1);
        }, 300);
    };
</script>

<div
    class="paper"
    bind:this={paper}
    on:mouseenter={onMouseEnter}
    on:mouseleave={onMouseLeave}
    style={ `--rot: ${trunc(rotation)}deg; --move: ${trunc(move)}px;` }
/>

{#if opened}
<div
    class="floating-paper" 
    use:mountOnBody
    bind:this={floatingPaper}
>
    Test
</div>
{/if}
