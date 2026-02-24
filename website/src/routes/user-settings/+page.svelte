<script lang="ts">
  import type { PageProps } from "./$types";
  import { useUser } from "$lib/auth-state.svelte";
  import { UserRoundX } from "@lucide/svelte";
  import { openConfirmDialog } from "$lib/modal_helpers";

  const { data }: PageProps = $props();
  // svelte-ignore state_referenced_locally
  const { signOut, signInAnonymous, signInGoogle, user: getUser } = useUser(data.user);
  const user = $derived(getUser());
</script>

<div class="outer-container">
  <div class="container">
    <div class="header">
      <h1 class="title">
        User Settings
      </h1>
      <div class="header-separator"></div>
      {#if user != null && !user.isAnonymous}
      <button
        class="log-off-button"
        onclick={() => {
          openConfirmDialog({
            action: async () => {
              await signOut();
              await signInAnonymous();
            },
            yes_red: true,
            yes_button: "Log Out",
            no_button: "Cancel",
          });
        }}
      >
        <UserRoundX size="1.3rem" />
      </button>
      {/if}
    </div>
    <div>
      {#if user == null}
        You are not logged in
      {:else if user.isAnonymous}
        You are logged in anonymously
        <div class="signin-buttons">
          <button class="signin signin-google" onclick={() => {
            signInGoogle();
          }}>
            Sign In With Google
          </button>
        </div>
      {:else}
        You are logged in as `{user.name}`
        <pre>{JSON.stringify(user, null, 2)}</pre>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  .outer-container {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .container {
    min-width: min(32rem, 100% - 2rem);
    border-radius: var(--border-radius);
    padding: 1rem;

    background: var(--gray-darker);

    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .header {
    display: flex;
    align-items: center;

    .title {
      font-weight: bold;
    }

    .header-separator {
      flex-grow: 1;
    }

    .log-off-button {
      transition: color var(--transition);
      color: var(--text-color-red);

      &:hover {
        color: var(--text-color-red-light);
      }
    }
  }

  .signin-buttons {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;;

    gap: 1rem;

    .signin {
      background: var(--gray-light);
      padding: .5rem 1rem;
      border-radius: var(--border-radius);
    }
  }
</style>
