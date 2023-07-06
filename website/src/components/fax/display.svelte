
<script lang="ts">
    import { onDestroy } from "svelte";

    export let text: string;

    let element: HTMLDivElement | null = null;

    let display_length = 25;
    let text_to_display = "!";
    let current_index = 0;

    let interval: NodeJS.Timer | null = null;

    $: {
        if (interval !== null)
            clearInterval(interval);

        if (text.length > display_length) {
            interval = setInterval(() => {
                let offset = current_index % (length + 5);
                text_to_display = (text + "     " + text)
                    .substring(offset, offset + display_length);

                current_index++;
            }, 150);

            onDestroy(() => {
                if (interval !== null)
                    clearInterval(interval);
            });
        }
        else
            text_to_display = text;
    }

    const observer = new ResizeObserver(() => {
        if (element === null)
            return;

        const cl = getComputedStyle(element);

        const c: HTMLCanvasElement = document.createElement("canvas");
        const ctx = c.getContext("2d");
        if (ctx == null) {
            console.error("Unsuported");
              return;
        }
        ctx.font = `${cl.fontSize} ${cl.fontFamily}`;
        const text = ctx.measureText("~");

        const actual_width = element.getBoundingClientRect().width -
            parseInt(cl.paddingLeft) -
            parseInt(cl.paddingRight); 
        const n = Math.floor(actual_width / text.width);

        display_length = n;
    });

    $: if (element !== null)
        observer.observe(element);

    onDestroy(() => {
        observer.disconnect();
    });
</script>

<div
    bind:this={element}
    class="display"
    style:placeholder={"~".repeat(display_length ?? 0)}
>
    {text_to_display.replace(/ /g, "!")}
</div>
