<script lang="ts">
	import { enhance } from '$app/forms';
	import BlockButton from '$lib/components/BlockButton.svelte';
	import Box from '$lib/components/Box.svelte';
	import Delimiter from '$lib/components/Delimiter.svelte';
	import { APP_NAME } from '$lib/constants';
	import LoadingDots from '$lib/icons/LoadingDots.svelte';
	import { fly } from 'svelte/transition';
	import type { ActionData, PageData, SubmitFunction } from './$types';

	let { form, data }: { data: PageData; form: ActionData } = $props();

	let confirmOne = $state(false);
	let confirmTwo = $state(false);

	let isChangingPassword = $state(false);
	const onChangePassword: SubmitFunction = () => {
		isChangingPassword = true;
		return async ({ update }) => {
			isChangingPassword = false;
			await update();
		};
	};

	let rainbowMode = $state(false);
</script>

<svelte:head>
	<title>{APP_NAME} / Settings</title>
</svelte:head>

<Box mode={rainbowMode ? 'rainbow' : 'regular'}>
	<h1 class="mb-4 text-xl font-bold">⚙ Settings (WIP)</h1>

	<h2 class="mb-4 text-lg font-bold">Change Password</h2>

	<form
		action="?/changepassword"
		method="POST"
		class="mb-4 flex flex-col gap-4"
		use:enhance={onChangePassword}
		inert={isChangingPassword}
	>
		{#if form?.message}
			<p
				class="fat-shadow my-2 border-2 {form?.success
					? 'border-green-900 bg-green-500'
					: 'border-red-900 bg-red-500'}  px-2 font-bold text-white"
			>
				{form.message}
			</p>
		{/if}
		<label for="old-password" class="block"> Old password </label>
		<input
			class="fat-shadow block border-2 border-black bg-white"
			type="password"
			name="old-password"
			id="old-password"
			placeholder="Old password"
			autocomplete="current-password"
		/>
		<label for="new-password" class="block"> New password </label>
		<input
			class="fat-shadow block border-2 border-black bg-white"
			type="password"
			name="new-password"
			id="new-password"
			placeholder="Confirm new password"
			autocomplete="new-password"
		/>
		<label for="new-password" class="block"> Confirm password </label>
		<input
			class="fat-shadow block border-2 border-black bg-white"
			type="password"
			name="new-password-confirm"
			id="new-password-confirm"
			placeholder="Confirm new password"
			autocomplete="new-password"
		/>
		<div>
			<BlockButton
				type="submit"
				classname="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white"
			>
				{#if isChangingPassword}
					Updating password
					<LoadingDots classname="inline-block fill-white" />
				{:else}
					Submit
				{/if}
			</BlockButton>
		</div>
	</form>

	<h2 class="mb-4 text-lg font-bold">Recap on your limits</h2>

	<ul class="list-inside list-disc p-2 text-black">
		{#snippet counts(counts: unknown[] = [0, 0, 0])}
			<li>Images: {counts[0]} used out of {data.userLimits.images} available</li>
			<li>Shares: {counts[1]} used out of {data.userLimits.shares} available</li>
			<li>Invites: {counts[2]} used out of {data.userLimits.invites} available</li>
		{/snippet}
		{#await Promise.all([data.imageCount, data.shareCount, data.inviteCount])}
			{@render counts(['loading', 'loading', 'loading'])}
		{:then resolvedCounts}
			{@render counts(resolvedCounts)}
		{/await}
	</ul>

	<Delimiter text="Danger zone !" classnameText="text-red-500" classnameLine="border-red-600" />
	<form action="?/deleteme" method="POST" class="flex flex-col gap-4">
		<label for="confirm-one" class="block">
			<input
				class="mr-2"
				type="checkbox"
				name="confirm-one"
				id="confirm-one"
				bind:checked={confirmOne}
			/>
			DO YOU WANT TO DELETE YOUR ACCOUNT ? (CHECK IF YES) (THIS WILL DELETE ALL YOUR DATA)
		</label>
		{#if confirmOne}
			<label transition:fly={{ y: -20, duration: 100 }} for="confirm-two" class="block">
				<input
					id="confirm-two"
					type="checkbox"
					name="confirm-two"
					class="mr-2"
					bind:checked={confirmTwo}
				/>
				CHECK THIS TOO TO **REALLY** CONFIRM YOU WANT TO DELETE YOUR ACCOUNT (IRREVERSIBLE)
			</label>
			{#if confirmTwo && confirmOne}
				<button
					transition:fly={{ y: -20, duration: 100 }}
					class="group fat-shadow block border-2 border-red-800 bg-red-500 p-4 px-8 font-bold text-white disabled:brightness-50"
					disabled={!confirmOne || !confirmTwo}
					type="submit"
				>
					<div>
						<p class="text-2xl text-white">🔥 DELETE MY ACCOUNT PLEEEEASSSSEEE !!!!!!!!!!</p>
						<p class="font-normal text-red-200 italic">
							(I'm not responsible if you lose important data btw)
						</p>
					</div>
				</button>
			{/if}
		{/if}
	</form>
	<Delimiter text="Secret zone !" classnameText="text-blue-500" classnameLine="border-blue-600" />
	<div class="space-x-2">
		<input type="checkbox" name="rainbow mode" id="rainbow-mode" bind:checked={rainbowMode} />
		<label for="rainbow-mode" class="inline-block">Rainbow mode</label>
	</div>
</Box>
