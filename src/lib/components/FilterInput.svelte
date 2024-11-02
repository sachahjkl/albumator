<script lang="ts" generics="Item extends {}">
	type FilterInputProps = {
		items: Item[];
		filtered?: Item[];
		filterValue: string;
		filterLogic: (value: Item) => boolean;
		oninput?: (e: Event) => void;
		placeholder?: string;
	};

	let {
		filterValue = $bindable<string>(),
		placeholder = 'Type your filter here'
	}: FilterInputProps = $props();
</script>

<div class="group relative">
	<input
		class="inline-block border-2 bg-white"
		type="text"
		id="filter"
		bind:value={filterValue}
		{placeholder}
	/>

	<button
		onclick={() => {
			filterValue = '';
		}}
		class="absolute -top-2 right-2 hidden bg-white px-1 text-xs font-bold text-red-600 hover:block group-hover:block"
		type="button"
	>
		Clear
	</button>
</div>
