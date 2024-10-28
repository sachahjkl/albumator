<script lang="ts">
	type ImageGridProps = {
		images: string[];
		displayMode: 'grid' | 'list';
		groupMode: 'month' | 'all';
	};
	const { images, displayMode, groupMode }: ImageGridProps = $props();
</script>
