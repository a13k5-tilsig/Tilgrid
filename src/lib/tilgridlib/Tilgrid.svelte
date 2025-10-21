<script lang="ts">
	import type { ITilgridConfig } from './types/config.ts';
	import type { IWidget, IFuncs } from './types/widget';
	import type { Snippet } from 'svelte';
	import Widget from './Widget.svelte';

	interface Props extends ITilgridConfig {
		container: HTMLDivElement | undefined;
		widgets: IWidget[];
		widget: Snippet<[IWidget]>;
		funcs?: IFuncs;
	}

	const DEFAULT: ITilgridConfig = {
		width: '100%', // css size
		height: '100%', // css size
		editing: true,
		snappingArea: 50, // px
		snappingAnimTime: 200, // ms
		verticallyDynamic: true,
		widgetInitialSize: { w: 300, h: 200 },
		widgetSpace: 5
	};

	let {
		container = $bindable(),
		widgets = $bindable(),
		widget,
		width = DEFAULT.width,
		height = DEFAULT.height,
		editing = DEFAULT.editing,
		snappingArea = DEFAULT.snappingArea,
		snappingAnimTime = DEFAULT.snappingAnimTime,
		verticallyDynamic = DEFAULT.verticallyDynamic,
		widgetInitialSize = DEFAULT.widgetInitialSize,
		widgetSpace = DEFAULT.widgetSpace,
		funcs
	}: Props = $props();

	let moving: boolean = $state(false);
	let resizing: boolean = $state(false);

	// Fixes the alignment of the snapping-points to start from 0.0.
	let alignSnappingGrid: string = $derived((snappingArea! / 2).toFixed());
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
	{#each widgets as w, i}
		<Widget
			bind:spec={widgets[i]}
			bind:moving
			bind:resizing
			{snappingArea}
			{snappingAnimTime}
			{editing}
			{widgetSpace}
			{funcs}
		>
			{@render widget?.(w)}
		</Widget>
	{/each}
</div>

<style>
	.snapp-hints {
		background-image: radial-gradient(black 1px, transparent 0);
		background-size: var(--snapping-area) var(--snapping-area);
		background-position: var(--snapping-align-comp) var(--snapping-align-comp);
	}
</style>
