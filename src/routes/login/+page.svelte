<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<h1 class="mb-4 text-xl font-bold">Login/Register</h1>
<form class="flex flex-col gap-4" method="post" action="?/login" use:enhance>
	<label class="block" for="username"> Username </label>
	<input class="fat-shadow block border-2 border-black bg-white" name="username" id="username" />
	<label class="" for="password"> Password </label>
	<input class="fat-shadow block border-2 border-black bg-white" type="password" name="password" />
	<button class="fat-shadow border-2 py-1 border-black bg-emerald-500 font-bold text-white" type="submit"
		>Login</button
	>
	<button class="fat-shadow border-2 py-1 border-black bg-amber-500 font-bold" formaction="?/register"
		>Register</button
	>
</form>
{#if form?.message}
	<p class="fat-shadow my-2 border-2 border-red-900 bg-red-500 px-2 font-bold text-white">
		{form?.message ?? ''}
	</p>
{/if}
