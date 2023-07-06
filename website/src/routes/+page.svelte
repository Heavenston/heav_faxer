<style scoped lang="scss">
    .container {
        display: flex;
        flex-direction: row;

        padding: 15px;
        
        justify-content: space-evenly;
        align-items: flex-start;

        @media (min-height: 880px) {
            align-items: center;
        }

        height: 100vh;
    }
</style>

<script lang="ts">
    import Fax from "~/components/fax/fax.svelte";
</script>

<div class="container">
    <Fax />
</div>
