<script lang="ts">
	import { env } from '$env/dynamic/public';
	import ExternalLinkIcon from '$lib/icons/ExternalLinkIcon.svelte';
	import type { Snippet } from 'svelte';

	interface FooterProps {
		commitHash?: string;
		children?: Snippet;
	}

	let { commitHash }: FooterProps = $props();

	let commitUrl = $derived(
		commitHash
			? `https://github.com/sachahjkl/albumator/commit/${commitHash}`
			: 'https://github.com/sachahjkl/albumator'
	);

	const year = new Date().getFullYear();
</script>

<footer
	class="mt-2 flex w-full flex-wrap items-center justify-between gap-2
     border-t-2 border-black bg-white px-2 py-1 text-xs font-bold text-black"
>
	<div class="flex flex-wrap items-center gap-2">
		<p>(C) {year} albumator</p>
		<p>-</p>
		<p>Made with 🧠 by <a href="https://sacha.house">sachahjkl</a></p>
		<p>-</p>
		<p class="underline opacity-75">
			<a href="/about#privacy">Privacy</a>, <a href="/about#terms">Terms</a> and
			<a href="/about#cookies">Cookies</a>
		</p>
	</div>
	<a class="flex items-center gap-1" href={commitUrl}>
		<div class="flex items-center gap-1">
			<img
				height="17px"
				src="https://github.com/{env.PUBLIC_GIT_REPO_ID}/actions/workflows/ci.yml/badge.svg?branch=main"
				alt="Deploy Status Badge"
			/>
			{commitHash?.substring(0, 8) ?? 'unknown'}
			<ExternalLinkIcon />
		</div>
	</a>
</footer>
