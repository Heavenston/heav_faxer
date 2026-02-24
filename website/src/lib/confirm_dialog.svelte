<script lang="ts">
  const {
    isOpen, close,

    description, action,
    yes_red = false,
    yes_button = "yes",
    no_red = false,
    no_button = "no",
  }: {
    isOpen: boolean, close: () => void,

    description?: string,
    yes_red?: boolean,
    yes_button?: string,
    no_red?: boolean,
    no_button?: string,
    action: () => void,
  } = $props()
</script>

{#if isOpen}
  <div role="dialog" class="modal">
    <div class="container">
      <h1 class="title">
        Are you sure ?
      </h1>
      {#if description}
      <div class="description">
        {description}
      </div>
      {/if}
      <div class="buttons">
        <button class={["yes", { "red": yes_red }]} onclick={() => {
          action();
          close();
        }}>
          {yes_button}
        </button>
        <button class={["no", { "red": no_red }]} onclick={() => {
          close();
        }}>
          {no_button}
        </button>
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  .modal {
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;

    /* allow click-through to backdrop */
    pointer-events: none;
  }

  .container {
    min-width: 16rem;
    padding: 1rem;
    gap: 1rem;
    background: var(--gray-light);
    border-radius: var(--border-radius);

    display: flex;
    flex-direction: column;
    justify-content: space-between;
    pointer-events: auto;
  }

  .title {
    font-weight: bold;
  }

  .buttons {
    display: flex;
    justify-content: end;
    align-items: stretch;

    gap: 1rem;
  }

  button {
    border-radius: var(--border-radius);

    transition: color var(--transition);
    color: var(--text-color-gray);

    &.red {
      color: var(--text-color-red);
    }

    &:hover {
      color: var(--text-color);
      &.red {
        color: var(--text-color-red-light);
      }
    }
  }
</style>

