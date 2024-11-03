<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from '../../routes/home/$types';
	import BlockButton from './BlockButton.svelte';

	type UploadFormProps = {
		enableDragAndDrop?: boolean;
		multiple?: boolean;
		form: ActionData;
	};

	const { enableDragAndDrop = true, form, multiple = false }: UploadFormProps = $props();

	let nameInput = $state<HTMLInputElement>() as HTMLInputElement;

	let files = $state<FileList>();
</script>

<fieldset class="fat-shadow my-2 border-2 border-black bg-white p-2">
	<legend class="ms-4 px-2 font-bold">Upload an image</legend>
	<form
		class="flex flex-col gap-4"
		method="post"
		action="?/uploadImage"
		enctype="multipart/form-data"
		use:enhance
	>
		<div class="flex flex-wrap items-center gap-4">
			<label
				for="file"
				class=" fat-shadow block flex-[200px] cursor-pointer border-2 border-black bg-indigo-500 text-center font-bold text-white hover:bg-indigo-700"
			>
				🖼 Choose your image
			</label>

			<input
				class="fat-shadow block flex-[200px] cursor-pointer border-2 px-2"
				type="file"
				name="file"
				id="file"
				bind:files
				{multiple}
			/>
		</div>
		<div class="flex flex-wrap items-center gap-4">
			<BlockButton
				type="submit"
				text="Upload"
				classname="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white"
			/>
			<BlockButton
				type="reset"
				text="Clear"
				title="Click to clear form"
				classname="bg-red-500 hover:bg-red-600 active:bg-red-700  text-white"
			/>
		</div>
		<p class="cursor-pointer text-sm text-red-500 hover:text-red-600">
			{form?.message ?? ' '}
		</p>
		{#if files}
			{#each files as file (file.name)}
				<div class="flex w-full flex-col gap-1 mb-2">
					<label for="name">Name for file "{file.name}"</label>
					<input
						placeholder="Name of image {file.name}"
						class="flex-grow border-2 border-black/50 bg-white"
						type="text"
						name="name-file-{file.name}"
						id="name-file-{file.name}"
						value={file.name}
					/>
				</div>
			{/each}
		{/if}
	</form>
</fieldset>

<style lang="postcss">
	#file::file-selector-button {
		@apply hidden;
	}
</style>
