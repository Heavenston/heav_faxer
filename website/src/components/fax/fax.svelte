
<script lang="ts">
    import Display from "./display.svelte";

    const display_text = "bonjour";
</script>


<div class="machine">
    <div class="paper input-paper">
    </div>
    <div class="paper output-paper">
        <div>
            <div>Your shortened link is:</div>
        </div>
    </div>
    <Display text={display_text.toUpperCase()} />
    <div class="lower_part">
        <div class="keyboard">
        </div>
        <div>
        </div>
    </div>
</div>
