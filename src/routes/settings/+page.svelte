<script lang="ts">
	import { APP_NAME } from '$lib/constants';
	import type { PageData } from './$types';
    
    let props: PageData = $props();
</script>


<svelte:head>
	<title>{APP_NAME} / Settings</title>
</svelte:head>


<!-- TODO:
- delete account
- change password
- delete sessions
-->