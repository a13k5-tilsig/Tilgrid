<script lang="ts">
	import type { IContainerConfig } from './types/config.ts';
	import type { IWidget, ISize, IFuncs } from './types/widget';
	import type { Snippet } from 'svelte';
	import Widget from './Widget.svelte';

	const DEFAULT: IContainerConfig = {
		editing: true,
		snappingArea: 50,
		hints: true,
		centerSnappableLimit: true,
		widgetSpace: 5
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
		movingMask,
		resizingMask,
		useDefaultMoveMask,
		useDefaultResizeMask,
		funcs,
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

	// FIX: snapping container sometimes not centering inside parent.

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
		--container-width: 100%;
		--container-height: 100%;
		--container-bg: unset;
		
		--snappable-container-bg: unset;
		--snappable-container-hints: black;
		--snapping-anim-time: 200ms;
		--snapping-hint-bg: gray;

		--widget-border-radius: 3px;
		--widget-editing-border-color: lightgray;
		--widget-editing-border-radius: 6px;

		--delete-button-border-radius: 6px;
		--delete-button-init-bg: pink;
		--delete-button-hover-bg: red;
	}
	*/

	#container-wrapper {
		width: var(--container-width, 100%);
		height: var(--container-height, 100%);
		background-color: var(--snappable-container-bg, unset);
		position: relative;
		border: 1px solid transparent;
	}

	#container-snappable-limit {
		border: 1px solid transparent;
		transition: width var(--snapping-anim-time, 200ms) ease-in-out;
		background-color: var(--snappable-container-bg, unset);
	}

	.center {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.snapp-hints {
		background-image: radial-gradient(
			var(--snappable-container-hints, black) 1px,
			transparent 0
		);
		background-size: var(--snapping-area) var(--snapping-area);
		background-position: var(--fix-snapping-grid-elignment)
			var(--fix-snapping-grid-elignment);
	}
</style>
