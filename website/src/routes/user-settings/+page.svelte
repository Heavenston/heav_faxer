<script lang="ts">
  import { UserRoundX } from "@lucide/svelte";
  import { openConfirmDialog } from "$lib/modal_helpers";
  import SignInWithGoogle from "$lib/components/sign-in-with-google.svelte";
  import { getContext, signOut, signInGithub, signInGoogle } from "$lib/state.svelte";

  const ctx = getContext();
</script>

<div class="outer-container">
  <div class="container">
    <div class="header">
      <h1 class="title">
        User Settings
      </h1>
      <div class="header-separator"></div>
      {#if ctx.user != null && !ctx.user.isAnonymous}
      <button
        class="log-off-button"
        onclick={() => {
          openConfirmDialog({
            action: async () => { await signOut(ctx); },
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
    <div class="content">
      {#if ctx.user == null || ctx.user.isAnonymous}
        <div>
          <div>You are not logged in</div>
          <div>Log in to never lose access to your uploaded files</div>
        </div>
        <div class="signin-buttons">
          <SignInWithGoogle class="signin signin-google" onclick={() => { signInGoogle(ctx); }} />
          <button class="signin signin-github" onclick={() => { signInGithub(ctx); }}>
            Sign in with Github
          </button>
        </div>
      {:else}
        <div>
          You are logged in as {ctx.user.email}
        </div>
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

  .content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .signin-buttons {
    display: flex;
    flex-direction: row;

    gap: 1rem;

    .signin {
      background: var(--gray-light);
      padding: .5rem 1rem;
      border-radius: var(--border-radius);
    }
  }
</style>
