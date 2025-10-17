<script lang="ts">
	import type { IFuncs, IWidget } from './types/widget.ts';
	import Widget from './Widget.svelte';

	const DEFAULT_WIDTH: string = '100%'; // css size
	const DEFAULT_HEIGHT: string = '100%'; // css size
	const DEFAULT_SNAPPING_AREA: number = 50; // px
	const DEFAULT_SNAPPING_ANIM: number = 200; // ms

	interface Props {
		w?: string;
		h?: string;
		snappingArea?: number;
		snappingAnimTime?: number;
		locked?: boolean;
		verticallyDynamic?: boolean;
		widgets: IWidget[];
		funcs?: IFuncs;
	}

	let {
		w = DEFAULT_WIDTH,
		h = DEFAULT_HEIGHT,
		snappingArea = DEFAULT_SNAPPING_AREA,
		snappingAnimTime = DEFAULT_SNAPPING_ANIM,
		locked = false,
		verticallyDynamic = true,
		widgets = $bindable(),
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
	class:snapp-hints={moving || resizing}
	style:width={w}
	style:height={h}
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
