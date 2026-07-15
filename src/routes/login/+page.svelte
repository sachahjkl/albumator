<script lang="ts">
	import { enhance } from '$app/forms';
	import Box from '$lib/components/Box.svelte';
	import { APP_NAME } from '$lib/constants';
	import LoadingDots from '$lib/icons/LoadingDots.svelte';
	import { fly } from 'svelte/transition';
	import type { ActionData, PageData, SubmitFunction } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	let loading = $state(false);
	const onSubmit: SubmitFunction = () => {
		loading = true;
		return async ({ update }) => {
			loading = false;
			await update();
		};
	};
</script>

<svelte:head>
	<title>{APP_NAME} / Login</title>
</svelte:head>

<Box>
	<hgroup class="mb-4 flex flex-col gap-2">
		<h1 class=" text-xl font-bold">Login/Register</h1>
		<h2 class="text-sm text-black/50 italic">
			Sacha's tech tip: {data.techTip}
		</h2>
	</hgroup>
	<form
		class="flex flex-col gap-4"
		method="post"
		action="?/login"
		use:enhance={onSubmit}
		inert={loading}
	>
		<label class="block" for="username">Username</label>
		<input
			class="fat-shadow block border-2 border-black bg-white"
			name="username"
			id="username"
			placeholder="Name yourself !"
			autocomplete="username"
		/>
		<label for="password">Password</label>
		<input
			class="fat-shadow block border-2 border-black bg-white"
			type="password"
			name="password"
			id="password"
			placeholder="Password (Keep it safe)"
			autocomplete="current-password"
		/>
		<label for="invite">Invite code (required to register only, to avoid spam :D)</label>
		<input
			class="fat-shadow block border-2 border-black bg-white"
			type="text"
			name="invite"
			id="invite"
			placeholder="Invite code"
			autocomplete="off"
		/>
		{#if loading}
			<div transition:fly={{ y: -20, duration: 100 }}>
				Loading <LoadingDots />
			</div>
		{/if}
		<button
			class="fat-shadow border-2 border-black bg-emerald-500 py-1 font-bold text-white"
			type="submit">Login</button
		>
		<button
			class="fat-shadow border-2 border-black bg-amber-500 py-1 font-bold"
			formaction="?/register">Register</button
		>
	</form>

	{#if data.demoEnabled}
		<!-- Demo login form -->
		<form class="mt-4" method="post" action="?/login" use:enhance={onSubmit} inert={loading}>
			<input type="hidden" value="demo" name="username" />
			<input type="hidden" value="demo" name="password" />
			<button class="fat-shadow w-full border-2 border-black bg-blue-500 py-1 font-bold text-white"
				>Try the demo !</button
			>
		</form>
	{/if}

	{#if form?.message}
		<p
			role="alert"
			class="fat-shadow my-2 border-2 border-red-900 bg-red-500 px-2 font-bold text-white"
		>
			{form?.message ?? ''}
		</p>
	{/if}
</Box>
