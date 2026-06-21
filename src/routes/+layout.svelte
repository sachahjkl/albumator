<script lang="ts">
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { APP_NAME } from '$lib/constants';
	import '../app.css';
	let { children, data } = $props();

	let mode = $derived(data.isLoggedIn ? ('loggedin' as const) : ('guest' as const));
	let navItems = $derived(data.navItems);
	let username = $derived(data.username);
</script>

<svelte:head>
	<title>{APP_NAME}</title>
	<SEO />
</svelte:head>

<div class="content container mx-auto mt-2 flex-1 px-1">
	<Header {mode} {navItems} {username} />
	<main class="mt-2">
		{@render children()}
	</main>
</div>
<Footer commitHash={data.commitHash} />
