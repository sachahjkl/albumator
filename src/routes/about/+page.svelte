<script lang="ts">
	import Box from '$lib/components/Box.svelte';
	import { APP_NAME } from '$lib/constants';
</script>

<svelte:head>
	<title>{APP_NAME} / About</title>
</svelte:head>

<Box mode="rainbow">
	<h1 class="mb-4 text-xl font-bold">📖 About</h1>

	<h2 id="privacy" class="mb-2 text-lg font-bold">Privacy Notice</h2>
	<p>
		I won't use your username or images for anything. <b>You can use wathever username you want.</b>
	</p>
	<p>
		Do be aware that your account <b>might be removed</b> if you use any username that I find offensive
		or that might reflect badly on the website.
	</p>
	<p>
		Same thing applies for your images, I won't use them for anything but if I get any reports about
		innapropriate content, <b>I'll remove them</b>.
	</p>

	<h2 id="terms" class="mb-2 text-lg font-bold">Terms of Service</h2>
	<p>
		This is a training website, there are no terms of service. Don't be surprised if your data
		dissapears.
	</p>
	<h2 id="cookies" class="mb-2 text-lg font-bold">Cookies and local storage</h2>

	<p>
		This webite only uses cookies to authenticate you. It also uses local storage to store your
		preferences.
	</p>

	<!-- You can delete your preferences at any time by clicking on the "Settings" button in the
header. This app -->
</Box>

<style lang="postcss">
	p {
		@apply mb-2;
	}
</style>
