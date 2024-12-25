<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import LoadingDots from '$lib/icons/LoadingDots.svelte';
	import type { SubmitFunction } from '@sveltejs/kit';

	type HeaderProps = {
		username?: string;
		userId?: string;
		mode: 'loggedin' | 'guest';
		navItems: { name: string; href: string }[];
		openNav?: boolean;
	};

	let { username, mode, navItems, openNav = $bindable(false) }: HeaderProps = $props();

	let isLoggingOut = $state(false);

	const onLogout: SubmitFunction = () => {
		isLoggingOut = true;
		return async ({ update }) => {
			isLoggingOut = false;
			await update();
		};
	};
</script>

{#snippet loginButton()}
	{#if mode === 'guest'}
		<button disabled class="fat-shadow border-2 border-dashed border-black px-2 font-mono font-bold"
			>[GUEST MODE]</button
		>
	{/if}
	{#if mode === 'loggedin'}
		<div class="flex items-center gap-2">
			<span class="italic text-neutral-800">(you is {username})</span>
			<form method="post" action="/login?/logout" use:enhance={onLogout} inert={isLoggingOut}>
				<button
					class="fat-shadow text-sharp border-2 border-dashed border-red-900 bg-red-500 px-2 font-bold text-white hover:bg-red-700"
					type="submit"
				>
					{#if isLoggingOut}
						Signing out
						<LoadingDots classname="inline-block fill-white" />
					{:else}
						Sign out
					{/if}
				</button>
			</form>
		</div>
	{/if}
{/snippet}

{#snippet navItem(navItem: { name: string; href: string }, onclick : () => void = () => {})}
	<a class:font-bold={navItem.href === page.url.pathname} class="underline" href={navItem.href} {onclick}>
		{navItem.name}
	</a>
{/snippet}

{#snippet title()}
	<a class="text-sharp flex items-center gap-2 font-bold" href="/">
		<img src="/camera_with_flash.png" alt="Albumator logo" class="inline-block h-6 w-6" /> Albumator
	</a>
{/snippet}

<header
	class="fat-shadow sticky z-10 flex flex-wrap justify-between gap-2 border-2 border-black bg-white p-2 px-4"
>
	<div class="hidden md:contents">
		<section class="flex flex-wrap items-center gap-2">
			{@render title()}
			<nav data-sveltekit-preload-data class="flex flex-wrap items-center gap-2">
				{#each navItems as item, i (item.href)}
					{#if i > 0}
						<span class="text-sm text-black/50">|</span>
					{/if}
					{@render navItem(item)}
				{/each}
			</nav>
		</section>
		{@render loginButton()}
	</div>

	<div class="block w-full md:hidden">
		<div class="flex justify-between gap-2 flex-wrap">
			{@render title()}
			{@render loginButton()}
		</div>
		<hr class="border-1 border-dashed border-black my-2" />
		<details bind:open={openNav}>
			<summary class="mb-1"> {openNav ? 'menu open' : 'menu closed'}</summary>
			<ul class="flex flex-wrap gap-3 whitespace-nowrap">
				{#each navItems as item, i (item.href)}
					<li class="flex-[100%] sm:flex-none">
						{@render navItem(item, () => openNav = false)}
					</li>
					{#if i != navItems.length - 1}
						<li class="border-textColor hidden border-r-2 sm:inline-block"></li>
					{/if}
				{/each}
				<li class="flex-[100%] sm:flex-none"></li>
			</ul>
		</details>
	</div>
</header>
