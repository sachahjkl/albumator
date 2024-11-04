<script lang="ts">
	type FilterInputProps = {
		filterValue: string;
		oninput?: (value: string) => void;
		placeholder?: string;
	};

	let {
		filterValue = $bindable<string>(),
		placeholder = 'Type your filter here',
		oninput = () => {}
	}: FilterInputProps = $props();

	let inputRef = $state<HTMLInputElement>();
</script>

<div class="group relative">
	<input
		class="inline-block border-2 bg-white"
		type="text"
		id="filter"
		bind:value={filterValue}
		bind:this={inputRef}
		oninput={() => oninput(filterValue)}
		{placeholder}
	/>

	<button
		onclick={() => {
			if (inputRef) {
				inputRef.value = '';
				inputRef.dispatchEvent(new Event('input', { bubbles: true }));
			}
		}}
		class="absolute -top-2 right-2 hidden bg-white px-1 text-xs font-bold text-red-600 hover:block group-hover:block"
		type="button"
	>
		Clear
	</button>
</div>
