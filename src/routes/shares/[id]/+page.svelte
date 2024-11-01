<script lang="ts">
	import { APP_NAME } from '$lib/constants';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>{APP_NAME} / Share {data.share.name}</title>
</svelte:head>

<h1>Share "{data.share.name}"</h1>
