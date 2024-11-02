<script lang="ts">
	import { enhance } from '$app/forms';

	type HeaderProps = {
		username?: string;
		userId?: string;
		mode?: 'loggedin' | 'guest';
	};

	const { username, userId, mode = 'loggedin' }: HeaderProps = $props();
</script>

<header
	class="fat-shadow sticky top-2 z-10 mt-2 flex flex-wrap justify-between gap-2 border-2 border-black bg-white p-2 px-4"
>
	<a class="flex items-center gap-2 font-bold" href="/">
		<img src="/camera_with_flash.png" alt="Albumator logo" class="inline-block h-6 w-6" /> Albumator
	</a>
	{#if mode === 'guest'}
		<button disabled class="font-mono font-bold border-2 border-dashed px-2 fat-shadow border-black">[GUEST MODE]</button>
	{/if}
	{#if mode === 'loggedin'}
		<form method="post" action="?/logout" use:enhance>
			<button
				class="fat-shadow border-2 border-dashed border-red-900 bg-red-500 px-2 font-bold text-white hover:bg-red-700"
				type="submit">Sign out</button
			>
		</form>
	{/if}
</header>
