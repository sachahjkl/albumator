<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import '../app.css';
	let { children, data } = $props();

	let mode = $state(data.isLoggedIn ? ('loggedin' as const) : ('guest' as const));
	let navItems = $state(data.navItems);

	$inspect(mode);
</script>

<main class="container mx-auto px-1">
	<Header {mode} {navItems} />
	{@render children()}
</main>
