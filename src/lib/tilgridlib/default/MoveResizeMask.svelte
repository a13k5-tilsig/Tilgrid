<script lang="ts">
	import ResizeIcon from './ResizeIcon.svelte';
	import MoveIcon from './MoveIcon.svelte';

	interface Props {
		type: 'move' | 'resize';
	}

	let { type }: Props = $props();

	let clientWidth = $state<number>();
	let clientHeight = $state<number>();

	const axisFit = $derived(
		!!clientHeight && !!clientWidth && clientHeight < clientWidth
			? { height: '100%', width: 'auto' }
			: { width: '100%', height: 'auto' }
	);
</script>

<div class="wrapper" bind:clientHeight bind:clientWidth>
	<div
		class="icon-wrapper"
		style:width={axisFit.width}
		style:height={axisFit.height}
	>
		{#if type === 'move'}
			<MoveIcon />
		{:else if type === 'resize'}
			<ResizeIcon />
		{/if}
	</div>
</div>

<style>
	.wrapper {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: oldlace;
	}

	.icon-wrapper {
		aspect-ratio: 1 / 1;
	}
</style>
