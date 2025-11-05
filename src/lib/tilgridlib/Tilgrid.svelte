<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { IContainerConfig } from './types/config';
	import type { IWidget, ISize, IFuncs } from './types/widget';
	import Widget from './Widget.svelte';

	const DEFAULT: IContainerConfig = {
		editing: true,
		snappingArea: 50,
		hints: true,
		centerSnappableLimit: true,
		useDefaultResizeMask: false,
		useDefaultMoveMask: false,
		verticallyDynamic: false,
		horizontallyDynamic: false,
		widgetSpace: 5
	};

	interface Props extends IContainerConfig {
		containerSize: ISize;
		widgets: IWidget[];
		widget: Snippet<[IWidget]>;
		movingMask?: Snippet;
		resizingMask?: Snippet;
		funcs?: IFuncs;
	}

	let {
		containerSize = $bindable(),
		widgets = $bindable(),
		widget,
		movingMask,
		resizingMask,
		useDefaultMoveMask,
		useDefaultResizeMask,
		funcs,
		verticallyDynamic = DEFAULT.verticallyDynamic,
		horizontallyDynamic = DEFAULT.horizontallyDynamic,
		editing = DEFAULT.editing,
		snappingArea = DEFAULT.snappingArea,
		hints = DEFAULT.hints,
		centerSnappableLimit = DEFAULT.centerSnappableLimit,
		widgetSpace = DEFAULT.widgetSpace
	}: Props = $props();

	let moving: boolean = $state(false);
	let resizing: boolean = $state(false);

	let fixSnappingGridAlignment: string = $derived(
		(snappingArea! / 2).toFixed()
	);

	const SNAPP_HINT_OVERFLOW_COMPANSATION = 2;

	const crimpedContainerSize: ISize = $derived({
		width:
			containerSize.width -
			(containerSize.width % snappingArea!) +
			SNAPP_HINT_OVERFLOW_COMPANSATION,
		height: containerSize.height - (containerSize.height % snappingArea!)
	});
</script>

<div
	id="container-wrapper"
	class:center={centerSnappableLimit}
	bind:clientWidth={containerSize.width}
	bind:clientHeight={containerSize.height}
>
	<div
		id="container-snappable-limit"
		class:snapp-hints={hints && (editing || moving || resizing)}
		style:width="{crimpedContainerSize.width}px"
		style:height="{crimpedContainerSize.height}px"
		style="
			--snapping-area: {snappingArea}px;
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
				{editing}
				{widgetSpace}
				{funcs}
				{verticallyDynamic}
				{horizontallyDynamic}
				{useDefaultMoveMask}
				{useDefaultResizeMask}
				{movingMask}
				{resizingMask}
			>
				{@render widget?.(w)}
			</Widget>
		{/each}
	</div>
</div>

<style>
	/*
	:global(:root) {
		--tg-container-bg: unset;
		--tg-container-width: 100%;
		--tg-container-height: 100%;
		
		--tg-snappable-container-bg: unset;
		--tg-snappable-container-hints: black;
		--tg-snapping-anim-time: 200ms;
		--tg-snapping-hint-bg: gray;

		--tg-widget-border-radius: 3px;
		--tg-widget-editing-border-color: lightgray;
		--tg-widget-editing-border-radius: 10px 10px 3px 10px;

		--tg-delete-button-size: 25px;
		--tg-delete-button-border-radius: 6px;
		--tg-delete-button-init-bg: pink;
		--tg-delete-button-hover-bg: red;
	}
	*/

	#container-wrapper {
		width: var(--tg-container-width, 100%);
		height: var(--tg-container-height, 100%);
		background-color: var(--tg-container-bg, unset);
		position: relative;
		border: 1px solid transparent;
	}

	#container-snappable-limit {
		border: 1px solid transparent;
		transition: width var(--tg-snapping-anim-time, 200ms) ease-in-out;
		background-color: var(--tg-snappable-container-bg, unset);
	}

	.center {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.snapp-hints {
		background-image: radial-gradient(
			var(--tg-snappable-container-hints, black) 1px,
			transparent 0
		);
		background-size: var(--snapping-area) var(--snapping-area);
		background-position: var(--fix-snapping-grid-elignment)
			var(--fix-snapping-grid-elignment);
	}
</style>
