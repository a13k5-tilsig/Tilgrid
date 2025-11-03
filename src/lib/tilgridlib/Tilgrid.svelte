<script lang="ts">
	import type { IContainerConfig } from './types/config.ts';
	import type { IWidget, ISize, IFuncs } from './types/widget';
	import type { Snippet } from 'svelte';
	import Widget from './Widget.svelte';

	const DEFAULT: IContainerConfig = {
		width: '100%',
		height: '100%',
		editing: true,
		snappingArea: 50,
		snappingAnimTime: 200,
		horizontallyDynamic: true,
		widgetSpace: 5,
	};

	interface Props extends IContainerConfig {
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
		// Scales widgets horizontaly to fit the container.
		horizontallyDynamic = DEFAULT.horizontallyDynamic,
		// Scales the CONTAINER vertically to fit moving and new widgets.
		//verticallyDynamic = DEFAULT.verticallyDynamic,
		// Wrap icons to fit in the container, this requires the vertical axis to be dynamic.
		//wrapWidgets = false,
		widgetSpace = DEFAULT.widgetSpace,
		funcs,
	}: Props = $props();

	let moving: boolean = $state(false);
	let resizing: boolean = $state(false);

	let fixSnappingGridAlignment: string = $derived(
		(snappingArea! / 2).toFixed(),
	);

	const SNAPP_HINT_OVERFLOW_COMPANSATION = 2;

	// FIX: snapping container sometimes not centering inside parent.

	const crimpedContainerSize: ISize = $derived({
		width:
			containerSize.width -
			(containerSize.width % snappingArea!) +
			SNAPP_HINT_OVERFLOW_COMPANSATION,
		height: containerSize.height - (containerSize.height % snappingArea!),
	});
</script>

<div
	id="container-wrapper"
	bind:clientWidth={containerSize.width}
	bind:clientHeight={containerSize.height}
	style:width
	style:height
>
	<div
		id="container-snappable-limit"
		class:snapp-hints={editing || moving || resizing}
		style:width="{crimpedContainerSize.width}px"
		style:height="{crimpedContainerSize.height}px"
		style="
			--snapping-area: {snappingArea}px;
			--snapping-anim-time: {snappingAnimTime}ms;
			--fix-snapping-grid-elignment: {fixSnappingGridAlignment}px;
		"
	>
		{#each widgets as w, i (w.id)}
			<Widget
				bind:widgets
				bind:widget={widgets[i]}
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
</div>

<style>
	#container-wrapper {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		border: 1px solid transparent;
	}

	#container-snappable-limit {
		border: 1px solid transparent;
		transition: width var(--snapping-anim-time) ease-in-out;
	}

	.snapp-hints {
		background-image: radial-gradient(black 1px, transparent 0);
		background-size: var(--snapping-area) var(--snapping-area);
		background-position: var(--fix-snapping-grid-elignment)
			var(--fix-snapping-grid-elignment);
	}
</style>
