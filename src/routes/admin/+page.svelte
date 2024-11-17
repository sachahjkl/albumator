<script lang="ts">
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

<div class="my-2">
	<h1 class="my-4 text-xl font-bold">Admin</h1>

	<div class="flex flex-col gap-4">
		<div class="flex flex-col gap-1">
			<h2 class="font-bold">## All roles</h2>
			<div class="flex flex-wrap gap-2">
				{#each data.userRoles as role}
					<div class="fat-shadow border-2 border-black bg-white px-2 py-1 font-bold text-black">
						{role}
					</div>
				{/each}
			</div>
			<h2 class="font-bold">## Your roles</h2>
			<div class="flex flex-wrap gap-2">
				<ul class="list-inside list-disc p-2 text-black">
					{#each data.roles as role}
						<li>
							{role.name}
						</li>
					{/each}
				</ul>
			</div>
			<div class="flex flex-col gap-1">
				<h2 class="font-bold">## Invite codes</h2>
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
</div>
