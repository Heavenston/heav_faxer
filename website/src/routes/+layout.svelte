<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style lang="scss">
:global {
	:root {
	  --font-without-serif: Segoe,Segoe UI,Candara,Calibri,Arial,sans-serif; 

	  --gray-lightest: #fffcf2;
	  --gray-lighter: #ccc5b9;
	  --gray-light: #403d39;
	  --gray-dark: #252422;
	  --gray-darker: #151412;
	  --gray-darkest: #0b0a09;

	  --red: #c23b22;

	  --text-color: #fffcf2;
	  --text-color-gray: #a7a4a0;

	  --border-radius: 0.5rem;
	}

	* {
	  box-sizing: border-box;
	}

	html, body {
	  padding: 0;
	  margin: 0;

	  scroll-behavior: smooth;
	}

	html {
	  height: 100%;
	}

	body {
	  min-height: 100%;
	  line-height: inherit;
	  font-size: 1.1em;

	  margin: 0 auto;
	  background: var(--gray-dark);

	  color: var(--text-color);
	}

	.force-round-cursor {
	  cursor: url(/cursor.svg), default !important;
	  * {
	    cursor: url(/cursor.svg), default !important;
	  }
	}

	html {
	  -webkit-text-size-adjust: 100%;
	  -moz-tab-size: 4;
	  -o-tab-size: 4;
	  tab-size: 4;
		font-family: var(--font-without-serif); 
	}

	h1,
	h2,
	h3,
	h4,
	h5,
	h6,
	h7,
	h8,
	h9,
	p {
	  font-size: inherit;
	  font-weight: inherit;
	  line-height: inherit;
	  padding: 0;
	  margin: 0;
	}

	button {
	  background: transparent;
	  border: none;
	  padding: 0;
	  margin: 0;
	  cursor: pointer;
	  color: inherit;
	}

	a {
	  color: inherit;
	  text-decoration: none;
	}

	input, textarea {
	  border: none;
	  font-size: 1rem;
	  color: inherit;
	  background: initial;

	  outline: none;

	  &::placeholder {
	    font-size: 1rem;
	    color: inherit;
	  }
	}
}
</style>
