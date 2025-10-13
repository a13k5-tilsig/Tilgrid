<script lang="ts">
	import type { IWidget, IFuncs } from './Widget.svelte';
	import Widget from './Widget.svelte';

	const DEFAULT_WIDTH: string = '100%';
	const DEFAULT_HEIGHT: string = '100%';
	const DEFAULT_SNAPPING_AREA: number = 50;

	interface Props {
		w?: string;
		h?: string;
		snappingArea?: number;
		widgets: IWidget[];
		funcs?: IFuncs;
	}

	let {
		w = DEFAULT_WIDTH,
		h = DEFAULT_HEIGHT,
		snappingArea = DEFAULT_SNAPPING_AREA,
		widgets = $bindable(),
		funcs
	}: Props = $props();

	// Fix the alignment of the snapping-points to start from 0.0.
	let snappingAlignComp: string = $derived((snappingArea / 2).toFixed());

	let moving: boolean = $state(true);
</script>

<div
	class:snapp-hints={moving}
	style:width={w}
	style:height={h}
	style="
		--snapping-area: {snappingArea}px;
		--snapping-align-comp: {snappingAlignComp}px;
	"
>
	{#each widgets as _, i}
		<Widget bind:spec={widgets[i]} {snappingArea} {funcs} />
	{/each}
</div>

<style>
	.snapp-hints {
		background-image: radial-gradient(black 1px, transparent 0);
		background-size: var(--snapping-area) var(--snapping-area);
		background-position: var(--snapping-align-comp) var(--snapping-align-comp);
	}
</style>
