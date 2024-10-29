<script lang="ts">
	import { enhance } from '$app/forms';

	type HeaderProps = {
		username: string;
		userId: string;
	};

	const props: HeaderProps = $props();
</script>

<header
	class="fat-shadow sticky top-2 mt-2 flex flex-wrap justify-between gap-2 border-2 border-black bg-white p-2 px-4"
>
	<h1>Hi, <span class="font-bold">{props.username}</span> (ID={props.userId})!</h1>
	<form method="post" action="?/logout" use:enhance>
		<button
			class="fat-shadow border-2 border-dashed border-red-900 bg-red-500 px-2 font-bold text-white hover:bg-red-700"
			type="submit">Sign out</button
		>
	</form>
</header>
