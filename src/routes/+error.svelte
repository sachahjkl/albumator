<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="fat-shadow mt-2 border-2 border-red-900 bg-red-500 px-2 font-bold text-white">
	<h1 class="mb-4 text-xl font-bold">An error occured</h1>

	<p class="font-bold">
        {#if page.status === 410}
            Resource expired
        {:else}
            An error occured
        {/if}
		
	</p>
    <p class=" font-bold text-sm mb-2 text-red-100">
        (HTTP code = {page.status})
    </p>
    <p class="mb-2 text-sm text-red-100">
        ← <a href="/" class="underline"> Go back home</a> 
    </p>
</div>

