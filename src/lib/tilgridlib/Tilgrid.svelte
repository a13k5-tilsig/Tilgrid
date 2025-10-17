<script lang="ts">
	import type { IFuncs, IWidget } from './types/widget.ts';
	import Widget from './Widget.svelte';

	const DEFAULT_WIDTH: string = '100%'; // css size
	const DEFAULT_HEIGHT: string = '100%'; // css size
	const DEFAULT_SNAPPING_AREA: number = 50; // px
	const DEFAULT_SNAPPING_ANIM: number = 200; // ms

	interface Props {
		container: HTMLDivElement | undefined;
		widgets: IWidget[];
		width?: string;
		height?: string;
		snappingArea?: number;
		snappingAnimTime?: number;
		editing?: boolean;
		verticallyDynamic?: boolean;
		funcs?: IFuncs;
	}

	let {
		container = $bindable(),
		widgets = $bindable(),
		width = DEFAULT_WIDTH,
		height = DEFAULT_HEIGHT,
		snappingArea = DEFAULT_SNAPPING_AREA,
		snappingAnimTime = DEFAULT_SNAPPING_ANIM,
		editing = true,
		verticallyDynamic = true,
		funcs
	}: Props = $props();

	/**
	 * Fix the alignment of the snapping-points to start from 0.0.
	 */
	let alignSnappingGrid: string = $derived((snappingArea / 2).toFixed());

	let moving: boolean = $state(false);
	let resizing: boolean = $state(false);
</script>

<div
	bind:this={container}
	class:snapp-hints={moving || resizing}
	style:width
	style:height
	style="
		--snapping-area: {snappingArea}px;
		--snapping-align-comp: {alignSnappingGrid}px;
	"
>
	{#each widgets as _, i}
		<Widget
			bind:spec={widgets[i]}
			bind:moving
			bind:resizing
			{snappingArea}
			{snappingAnimTime}
			{funcs}
		/>
	{/each}
</div>

<style>
	.snapp-hints {
		background-image: radial-gradient(black 1px, transparent 0);
		background-size: var(--snapping-area) var(--snapping-area);
		background-position: var(--snapping-align-comp) var(--snapping-align-comp);
	}
</style>
