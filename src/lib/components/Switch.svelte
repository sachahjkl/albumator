<script lang="ts">
	type SwitchProps = {
		checked?: boolean;
		onChange?: (e: Event) => void;
		label?: string;
	};

	let { checked = $bindable(false), onChange: onchange, label }: SwitchProps = $props();
</script>

<label class="inline-flex cursor-pointer items-center">
	{#if label}
		<span class="me-3 text-sm font-medium text-black">{label}</span>
	{/if}
	<input type="checkbox" {onchange} bind:checked class="peer sr-only" />
	<div
		class=" peer fat-shadow relative h-7 w-12 border-2 border-black bg-red-500 after:fat-shadow after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5
        after:border-2 after:border-black after:bg-white after:content-[''] peer-checked:bg-green-500 after:peer-checked:left-auto after:peer-checked:right-0.5"
	></div>
</label>
