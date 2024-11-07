<script lang="ts">
	import { APP_NAME } from "$lib/constants";
	import type { PageData } from "./$types";

    
    
    let data: PageData = $props();
</script>


<svelte:head>
	<title>{APP_NAME} / Admin</title>
</svelte:head>


<!-- TODO:
- manage invite codes
- 
-->