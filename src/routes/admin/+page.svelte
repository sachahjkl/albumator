<script lang="ts">
	import Box from '$lib/components/Box.svelte';
	import { APP_NAME } from '$lib/constants';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{APP_NAME} / Admin</title>
</svelte:head>

<!-- TODO:
- manage invite codes
- 
-->

<Box>
	<h1 class="mb-4 text-xl font-bold">Admin</h1>

	<div class="flex flex-col gap-4">
		<div class="flex flex-col gap-1">
			<h2 class="font-bold text-lg">All roles</h2>
			{#if data.roles.length === 0}
				<p class="text-black">No roles exist</p>
			{:else}
				<ul class="list-inside list-disc p-2 text-black">
					{#each data.roles as role}
						<li>
							{role}
						</li>
					{/each}
				</ul>
			{/if}
			<h2 class="font-bold text-lg">Your roles</h2>
			<div class="flex flex-wrap gap-2">
				{#if data.userRoles.length === 0}
					<p class="text-black">You have no roles</p>
				{:else}
					<ul class="list-inside list-disc p-2 text-black">
						{#each data.userRoles as role}
							<li>
								{role}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
			<div class="flex flex-col gap-1">
				<h2 class="font-bold text-lg">Invite codes</h2>
				<ul class="list-inside list-disc p-2 text-black">
					{#each data.inviteCodes as inviteCode}
						<li class="">
							{inviteCode.code} (expires at {new Date(inviteCode.expiresAt).toLocaleString()})
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</Box>
