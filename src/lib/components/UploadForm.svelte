<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import type { InsertedImage } from '$lib/server/db/queries';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData } from '../../routes/home/$types';
	import BlockButton from './BlockButton.svelte';

	type UploadFormProps = {
		enableDragAndDrop?: boolean;
		multiple?: boolean;
		form: ActionData;
		onSuccessfulUpload?: (uploadedImages: InsertedImage[]) => void;
	};

	// TODO: add drag and drop support
	const {
		enableDragAndDrop = true,
		form,
		multiple = false,
		onSuccessfulUpload = () => {}
	}: UploadFormProps = $props();

	let filesRef = $state<HTMLInputElement>();
	let files = $state<FileList>() as FileList;
	let uploading = $state(false);

	const resetFiles = () => {
		if (filesRef) {
			filesRef.value = '';
		}
	};

	let showImageProperties = $state(true);

	const uploadImages: SubmitFunction = () => {
		uploading = true;
		return async ({ result }) => {
			uploading = false;
			// TODO: finish handling action result and push new images to the image list
			await applyAction(result);
			resetFiles();
			showImageProperties = false;
			if (result.type === 'success') {
				if (form?.uploadedImages) {
					onSuccessfulUpload(form.uploadedImages);
				}
			}
		};
	};

	// const dragenter
</script>

<fieldset class="fat-shadow my-2 border-2 border-black bg-white p-2">
	<legend class="ms-4 px-2 font-bold">Upload your images</legend>
	<form
		class="flex flex-col gap-4"
		method="post"
		action="?/uploadImage"
		enctype="multipart/form-data"
		use:enhance={uploadImages}
	>
		<div class="flex flex-wrap items-center gap-4">
			<label
				for="file"
				class=" fat-shadow block flex-[200px] cursor-pointer border-2 border-black bg-indigo-500 text-center font-bold text-white hover:bg-indigo-700"
			>
				🖼 Choose your images
			</label>

			<input
				id="file"
				class="fat-shadow block flex-[200px] cursor-pointer border-2 px-2"
				type="file"
				name="file"
				bind:this={filesRef}
				bind:files
				oninput={() => {
					showImageProperties = true;
				}}
				{multiple}
			/>
		</div>
		<div class="flex flex-wrap items-center gap-4">
			<BlockButton
				type="submit"
				text={uploading ? 'Uploading...' : 'Upload'}
				classname="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white"
			/>
			<BlockButton
				type="reset"
				text="Clear"
				title="Click to clear form"
				onclick={resetFiles}
				classname="bg-red-500 hover:bg-red-600 active:bg-red-700  text-white"
			/>
		</div>
		<p class="text-sm text-red-500 hover:text-red-600">
			{form?.message ?? ' '}
		</p>
		{#if files}
			{#each files as file (file.name)}
				<details class="flex flex-col gap-1" open={showImageProperties}>
					<summary class="">
						Properties for file "{file.name}"
					</summary>
					<div class="flex w-full flex-col gap-1">
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
				</details>
			{/each}
		{/if}
	</form>
</fieldset>

<div id="drag-and-drop"></div>

<style lang="postcss">
	input[type='file']::file-selector-button {
		@apply hidden;
	}
</style>
