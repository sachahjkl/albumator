<script lang="ts">
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import { APP_NAME } from '$lib/constants';
	import '../app.css';
	let { children, data } = $props();

	let mode = $derived(data.isLoggedIn ? ('loggedin' as const) : ('guest' as const));
	let navItems = $derived(data.navItems);
	let username = $derived(data.username);
	$inspect(data.isLoggedIn);
</script>

<svelte:head>
	<title>{APP_NAME}</title>
</svelte:head>

<div class="content container mx-auto px-1 mt-2 flex-1">
	<Header {mode} {navItems} {username} />
	<main class="mt-2">
		{@render children()}
	</main>
</div>
<Footer commitHash={data.commitHash} />