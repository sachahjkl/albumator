<script lang="ts">
	interface DelimiterProps {
		classnameText?: string;
		classnameLine?: string;
		text?: string;
	}

	const { text, classnameText, classnameLine }: DelimiterProps = $props();
</script>

<div class="relative">
	<div
		class="absolute left-0 right-0 flex -translate-y-1/2 transform justify-center font-bold {classnameText ??
			'text-red-500'}"
	>
		{#if text}
			<span class="text-sharp inline-block bg-white px-2 text-center text-sm">{text}</span>
		{/if}
	</div>
	<hr
		class="drop-shadow-[2px 2px 0px #000] my-6 border-2 border-dashed {classnameLine ??
			'border-red-600'}"
	/>
</div>
