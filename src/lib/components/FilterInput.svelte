<script lang="ts" generics="Item extends {}">
	import { onMount } from 'svelte';

	type FilterInputProps = {
		items: Item[];
		filtered?: Item[];
		filterValue: string;
		filterLogic: (value: Item) => boolean;
		oninput?: (e: Event) => void;
		placeholder?: string;
	};

	let {
		items,
		filterValue = $bindable<string>(),
		filterLogic,
		filtered = $bindable<Item[]>(),
		oninput,
		placeholder = 'Type your filter here'
	}: FilterInputProps = $props();

	onMount(() => {
		filtered = items.filter(filterLogic);
	});

	const input = (e: Event) => {
		filtered = items.filter(filterLogic);
		oninput?.call(null, e);
	};

	let showClear = $state(false);
</script>

<div class="group relative">
	<input
		class="form-input inline-block border-2 bg-white py-2"
		type="text"
		id="filter"
		bind:value={filterValue}
		oninput={input}
		{placeholder}
	/>

	<button
		onclick={() => {
			filterValue = '';
			input(new Event('input'));
		}}
		class="absolute -top-2 right-2 hidden bg-white px-1 text-xs font-bold text-red-600 group-hover:block hover:block"
		type="button"
	>
		Clear
	</button>
</div>
