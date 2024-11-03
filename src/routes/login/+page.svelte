<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	$inspect(form);
</script>

<div class="my-4">
	<h1 class="mb-4 text-xl font-bold">Login/Register</h1>
	<form class="flex flex-col gap-4" method="post" action="?/login">
		<label class="block" for="username">Username</label>
		<input
			class="fat-shadow block border-2 border-black bg-white"
			name="username"
			id="username"
			placeholder="Name yourself !"
		/>
		<label for="password">Password</label>
		<input
			class="fat-shadow block border-2 border-black bg-white"
			type="password"
			name="password"
			placeholder="Password (Keep it safe)"
		/>
		<label for="password">Invite code (required to register only, to avoid spam :D)</label>
		<input
			class="fat-shadow block border-2 border-black bg-white"
			type="password"
			name="invite"
			placeholder="Invite code"
		/>
		<button
			class="fat-shadow border-2 border-black bg-emerald-500 py-1 font-bold text-white"
			type="submit">Login</button
		>
		<button
			class="fat-shadow border-2 border-black bg-amber-500 py-1 font-bold"
			formaction="?/register">Register</button
		>
	</form>
	{#if form?.message}
		<p class="fat-shadow my-2 border-2 border-red-900 bg-red-500 px-2 font-bold text-white">
			{form?.message ?? ''}
		</p>
	{/if}
</div>
