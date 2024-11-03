<script lang="ts">
	import { page } from '$app/stores';

	type HeaderProps = {
		username?: string;
		userId?: string;
		mode: 'loggedin' | 'guest';
		navItems: { name: string; href: string }[];
	};

	const { username, userId, mode, navItems }: HeaderProps = $props();
</script>

<header
	class="fat-shadow sticky top-2 z-10 mt-2 flex flex-wrap justify-between gap-2 border-2 border-black bg-white p-2 px-4"
>
	<section class="flex items-center gap-6">
		<a class="flex items-center gap-2 font-bold" href="/">
			<img src="/camera_with_flash.png" alt="Albumator logo" class="inline-block h-6 w-6" /> Albumator
		</a>

		<nav class="flex flex-wrap items-center gap-2">
			{#each navItems as navItem, i (navItem.href)}
				{#if i > 0}
					<span class="text-sm text-black/50">|</span>
				{/if}
				<a
					class:font-bold={navItem.href === $page.url.pathname}
					class="underline"
					href={navItem.href}
				>
					{navItem.name}
				</a>
			{/each}
		</nav>
	</section>
	{#if mode === 'guest'}
		<button disabled class="fat-shadow border-2 border-dashed border-black px-2 font-mono font-bold"
			>[GUEST MODE]</button
		>
	{/if}
	{#if mode === 'loggedin'}
		<form
			method="post"
			action="/login?/logout"
		>
			<button
				class="fat-shadow border-2 border-dashed border-red-900 bg-red-500 px-2 font-bold text-white hover:bg-red-700"
				type="submit">Sign out</button
			>
		</form>
	{/if}
</header>
