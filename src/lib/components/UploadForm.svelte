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

	// TODO: add drag and drop support
	// const dragenter
	let dragState = $state<'dragenter' | 'dragleave' | 'drop'>('dragenter');
	let showDragAndDrop = $derived(dragState === 'dragenter');

	const onDrag = (e: DragEvent, state: 'dragenter' | 'dragleave' | 'drop') => {
		if (enableDragAndDrop === false) {
			return;
		}

		const targetIsBody = e.target === document.body;
		if (!targetIsBody) {
			console.log('not body', { state, e });
			return;
		}
		console.log('body', { state, e });

		e.preventDefault();
		if (state === 'dragenter' && dragState !== 'dragenter') {
			e.preventDefault();
			console.info('entering');
			dragState = state;
			document.body.style.overflow = 'hidden';
		} else if (state === 'dragleave' && dragState !== 'dragleave') {
			e.preventDefault();
			console.info('exitting');
			dragState = state;
			document.body.style.overflow = '';
		} else if (state === 'drop') {
			let files = Array.from(e.dataTransfer?.items ?? [])
				.filter((it) => it.kind === 'file')
				.map((item) => item.getAsFile()!);
			document.body.style.overflow = '';

			// TODO: handle drop
			// e.
		}

		if (e.dataTransfer) {
			// e.dataTransfer.dropEffect = 'copy';
		}
	};
</script>

<svelte:window
	ondragenter={(e) => onDrag(e, 'dragenter')}
	ondragleave={(e) => onDrag(e, 'dragleave')}
	ondrop={(e) => onDrag(e, 'drop')}
/>

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

{#if enableDragAndDrop && showDragAndDrop}
	<div
		id="drag-and-drop"
		class="absolute left-0 top-0 z-10 flex h-full w-full
		select-none items-center justify-center border-8 border-black/75 font-mono
		text-black
		backdrop-blur"
	>
		<p>[Drag & Drop]</p>
	</div>
{/if}

<style lang="postcss">
	input[type='file']::file-selector-button {
		@apply hidden;
	}
</style>
