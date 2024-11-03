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

<fieldset class="fat-shadow my-2 border-2 border-black p-2 bg-white">
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
		{#if files}
			<div id="files" class="flex flex-wrap items-center gap-4">
				{#each files as file (file.name)}
                <div class="w-full">

                    <label for="name">{file.name}</label>
					<input
                    placeholder="Name of image {file.name}"
                    class="border-2 border-black/50 bg-white"
                    type="text"
                    name="name"
                    id="name"
                    value={file.name}
					/>
                </div>
                    {/each}
			</div>
		{/if}
		<div class="flex flex-wrap items-center gap-4">
			<BlockButton
				type="submit"
				text="Upload"
				classname="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white"
			/>
			<BlockButton
				type="reset"
				text="Clear"
				classname="bg-red-500 hover:bg-red-600 active:bg-red-700  text-white"
			/>
		</div>
		<p title="Click to clear form" class="cursor-pointer text-sm text-red-500 hover:text-red-600">
			{form?.message ?? ' '}
		</p>
	</form>
</fieldset>

<style lang="postcss">
	#file::file-selector-button {
		@apply hidden;
	}
</style>
