<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<h1 class="mb-4 text-xl font-bold">Login/Register</h1>
<form class="flex flex-col gap-4" method="post" action="?/login" use:enhance>
	<label class="block" for="username"> Username </label>
	<input name="username" id="username" />
	<label class="block" for="password"> Password </label>
	<input type="password" name="password" />
	<button class="border-2" type="submit">Login</button>
	<button class="border-2" formaction="?/register">Register</button>
</form>
<p style="color: red">{form?.message ?? ''}</p>
