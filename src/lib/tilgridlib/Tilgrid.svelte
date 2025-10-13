<script module lang="ts">
	import { type IWidget } from './Widget.svelte';

	export interface IFuncs {
		add?: () => void;
		remove?: (id: Pick<IWidget, 'id'>) => void;
		move?: (id: Pick<IWidget, 'id'>) => void;
		size?: (id: Pick<IWidget, 'id'>) => void;
	}
</script>

<script lang="ts">
	import Widget from './Widget.svelte';

	const DEFAULT_WIDTH: string = '100%';
	const DEFAULT_HEIGHT: string = '100%';
	const DEFAULT_WIDGETS: IWidget[] = [];

	// The surrounding area steps where the ghost will snapp.
	const DEFAULT_SNAPPING_AREA: number = 50;

	interface Props {
		w?: string;
		h?: string;
		snappingArea?: number;
		widgets?: IWidget[];
		funcs?: IFuncs;
	}

	let {
		w = DEFAULT_WIDTH,
		h = DEFAULT_HEIGHT,
		snappingArea = DEFAULT_SNAPPING_AREA,
		widgets = $bindable(DEFAULT_WIDGETS),
		funcs
	}: Props = $props();

	// Compansate the snapping area in order to align the "grid".
	let snappingAlignComp: string = $derived((snappingArea / 2).toFixed());

	let moving: boolean = $state(true);
</script>

<div
	class="wrapper"
	class:snapp-hints={moving}
	style:width={w}
	style:height={h}
	style="
		--snapping-area: {snappingArea}px;
		--snapping-align-comp: {snappingAlignComp}px;
	"
>
	{#each widgets as spec, i}
		<Widget bind:spec={widgets[i]} {snappingArea} />
	{/each}
</div>

<style>
	.snapp-hints {
		background-color: lightgray;
		background-image: radial-gradient(black 1px, transparent 0);
		background-size: var(--snapping-area) var(--snapping-area);
		background-position: var(--snapping-align-comp) var(--snapping-align-comp);
	}
</style>
