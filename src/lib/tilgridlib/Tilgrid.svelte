<script lang="ts">
	import type { ITilgridConfig } from './types/config.ts';
	import type { IWidget, ISize, IFuncs } from './types/widget';
	import type { Snippet } from 'svelte';
	import Widget from './Widget.svelte';

	const DEFAULT: ITilgridConfig = {
		width: '100%',
		height: '100%',
		editing: true,
		snappingArea: 50,
		snappingAnimTime: 200,
		horizontallyDynamic: true,
		widgetSpace: 5
	};

	interface Props extends ITilgridConfig {
		containerSize: ISize;
		widgets: IWidget[];
		widget: Snippet<[IWidget]>;
		funcs?: IFuncs;
	}

	let {
		containerSize = $bindable(),
		widgets = $bindable(),
		widget,
		width = DEFAULT.width,
		height = DEFAULT.height,
		editing = DEFAULT.editing,
		snappingArea = DEFAULT.snappingArea,
		snappingAnimTime = DEFAULT.snappingAnimTime,
		horizontallyDynamic = DEFAULT.horizontallyDynamic,
		widgetSpace = DEFAULT.widgetSpace,
		funcs
	}: Props = $props();

	let moving: boolean = $state(false);
	let resizing: boolean = $state(false);

	let fixSnappingGridAlignment: string = $derived(
		(snappingArea! / 2).toFixed()
	);
</script>

<div
	bind:clientWidth={containerSize.w}
	bind:clientHeight={containerSize.h}
	class:snapp-hints={editing || moving || resizing}
	style:width
	style:height
	style="
		--snapping-area: {snappingArea}px;
		--snapping-grid-alignment-fix: {fixSnappingGridAlignment}px;
	"
>
	{#each widgets as w, i (w.id)}
		<Widget
			bind:spec={widgets[i]}
			bind:moving
			bind:resizing
			{containerSize}
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
		background-position: var(--snapping-grid-alignment-fix)
			var(--snapping-grid-alignment-fix);
	}
</style>
