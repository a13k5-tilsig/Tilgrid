<script lang="ts">
	import ResizeIcon from './ResizeIcon.svelte';
	import MoveIcon from './MoveIcon.svelte';

	interface Props {
		type: 'move' | 'resize';
	}

	let { type }: Props = $props();
</script>

<div class="wrapper">
	<div class="icon-wrapper">
		{#if type === 'move'}
			<MoveIcon />
		{:else if type === 'resize'}
			<ResizeIcon />
		{/if}
	</div>
</div>

<style>
	.wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
		background-color: blue;
	}

	.icon-wrapper {
		/* TODO: Does not scale with the other axis... fix...*/
		height: 50%;
		aspect-ratio: 1 / 1;
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
