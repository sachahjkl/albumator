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

	const {
		enableDragAndDrop = true,
		form,
		multiple = false,
		onSuccessfulUpload = () => {}
	}: UploadFormProps = $props();

	let filesRef = $state<HTMLInputElement>();
	let files = $state<FileList | undefined>();
	let uploading = $state(false);
	let buttonsShouldBeDisabled = $derived(!files || files?.length === 0 || uploading);

	const resetFiles = () => {
		if (filesRef) {
			filesRef.value = '';
			files = undefined;
		}
	};

	let showImageProperties = $state(true);

	const uploadImages: SubmitFunction = () => {
		uploading = true;
		return async ({ result }) => {
			uploading = false;
			await applyAction(result);
			resetFiles();
			if (result.type === 'success' && form?.uploadedImages) {
				onSuccessfulUpload(form.uploadedImages);
			}
		};
	};

	let dragState = $state('inactive');
	let showDragAndDrop = $derived(dragState === 'active');

	const dragcheck = (e: DragEvent) => {
		if (enableDragAndDrop === false) {
			return;
		}

		if (!(e.dataTransfer?.files instanceof FileList) || e.dataTransfer.files.length === 0) {
			return;
		}
		return e.dataTransfer.files;
	};

	const ondragenter = (e: DragEvent) => {
		if (e.dataTransfer?.types.includes('Files') === false) {
			return;
		}
		lastTarget = e.target as HTMLElement;
		dragState = 'active';
		// document.body.style.overflow = 'hidden';
	};

	let lastTarget: HTMLElement | null = null;

	const ondragleave = (e: DragEvent) => {
		if (enableDragAndDrop === false) {
			return;
		}
		if (lastTarget === e.target || e.target === document) {
			dragState = 'inactive';
		}
	};

	const ondrop = (e: DragEvent) => {
		// we don't want to show the image on the current tab
		e.preventDefault();
		dragState = 'dropped';
		const droppedFiles = dragcheck(e);
		if (!droppedFiles) {
			return;
		}
		files = droppedFiles;
	};
</script>

<svelte:window {ondragenter} {ondragleave} {ondrop} on:dragover={(e) => e.preventDefault()} />

<fieldset class="fat-shadow mb-4 border-2 border-black bg-white p-2">
	<legend class="text-sharp ms-4 px-2 font-bold">Upload your images</legend>
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
				class=" fat-shadow text-sharp block flex-[200px] cursor-pointer border-2 border-black bg-indigo-500 text-center font-bold text-white hover:bg-indigo-700"
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
				{multiple}
			/>
		</div>
		<div class="flex flex-wrap items-center gap-4">
			<BlockButton
				type="submit"
				text={uploading ? 'Uploading...' : 'Upload'}
				disabled={buttonsShouldBeDisabled}
				classname="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white"
			/>
			<BlockButton
				type="reset"
				text="Clear"
				title="Click to clear form"
				onclick={resetFiles}
				disabled={buttonsShouldBeDisabled}
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

{#if enableDragAndDrop}
	<div
		id="drag-and-drop"
		class:visible={showDragAndDrop}
		class:invisible={!showDragAndDrop}
		class="pointer-events-none fixed left-0 top-0 z-10 flex h-full
		w-full select-none items-center justify-center border-8 border-black/75
		font-mono
		backdrop-blur"
	>
		<p class="rounded-sm bg-black px-2 py-1 font-bold text-white drop-shadow">[Drag & Drop]</p>
	</div>
{/if}

<style lang="postcss">
	input[type='file']::file-selector-button {
		@apply hidden;
	}
</style>
