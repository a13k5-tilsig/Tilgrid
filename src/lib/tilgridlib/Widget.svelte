<script lang="ts">
	import type { IWidget, ISize, IPosition, IFuncs } from './types/widget';
	import { type Snippet } from 'svelte';

	/*
	 * TODO:
	 * + Add ability to delete widgets.
	 * + Add ability to add widgets.
	 * + Add collision mechanism.
	 * + Add main ability of rendering passed children.
	 *
	 * FIX:
	 * + When resizing a widget and letting to, the widget resizing is \
	 *   instant, and not a smooth transition. \
	 *   Should be some smoothing here to give a better impression.
	 */

	interface Props {
		spec: IWidget;
		moving: boolean;
		resizing: boolean;
		snappingArea: number;
		snappingAnim: string;
		funcs?: IFuncs;
		children?: Snippet;
	}

	let {
		spec = $bindable(),
		moving = $bindable(),
		resizing = $bindable(),
		snappingArea,
		snappingAnim = '200ms ease',
		funcs,
		children
	}: Props = $props();

	/**
	 * Where the cursor anchors on the element, for precise movement.
	 */
	let cursorElemAnchor: IPosition = $state({ x: 0, y: 0 });

	/**
	 * How much a widgets spills into a new area before \
	 * snapp-suggesting the new position.
	 */
	let snappingThreshold: number = $derived(snappingArea / 2);

	/**
	 * Round an axis position up to its closest snapping-area.
	 */
	const roundSpecUp = (prop: 'x' | 'y' | 'w' | 'h'): number =>
		Math.ceil(spec[prop] / snappingArea) * snappingArea;

	/**
	 * Round an axis position down to its closest snapping-area.
	 */
	const roundSpecDown = (prop: 'x' | 'y' | 'w' | 'h'): number =>
		Math.floor(spec[prop] / snappingArea) * snappingArea;

	/**
	 * Adjust the position of the widget to match the snapping-area.
	 */
	const adjustedPosition = (coords: IPosition): IPosition => ({
		x:
			coords.x % snappingArea > snappingThreshold
				? roundSpecUp('x')
				: roundSpecDown('x'),
		y:
			coords.y % snappingArea > snappingThreshold
				? roundSpecUp('y')
				: roundSpecDown('y')
	});

	/**
	 * Adjust the size of the widget to match the snapping-area.
	 */
	const adjustedSize = (size: ISize): ISize => ({
		w:
			size.w % snappingArea > snappingThreshold
				? roundSpecUp('w')
				: roundSpecDown('w'),
		h:
			size.h % snappingArea > snappingThreshold
				? roundSpecUp('h')
				: roundSpecDown('h')
	});

	/**
	 * The shadow (or ghost, if you will) that hints at the area where the \
	 * widget will snapp to if you were to let go of the widget.
	 */
	const snappingHint = $derived.by(() => {
		if (moving) {
			return {
				...adjustedPosition({ x: spec.x, y: spec.y }),
				w: spec.w,
				h: spec.h
			};
		} else if (resizing) {
			return {
				...adjustedSize({ w: spec.w, h: spec.h }),
				x: spec.x,
				y: spec.y
			};
		} else {
			return {
				x: spec.x,
				y: spec.y,
				w: spec.w,
				h: spec.h
			};
		}
	});

	/**
	 * Widget mouse-event handlers.
	 */
	const WIDGET = {
		move: {
			handleMouseDown: function (event: MouseEvent) {
				event.preventDefault();
				moving = true;
				cursorElemAnchor.x = event.offsetX;
				cursorElemAnchor.y = event.offsetY;
			},
			handleMouseUp: function (event: MouseEvent) {
				event.preventDefault();
				moving = false;
				const adjusted = adjustedPosition({ x: spec.x, y: spec.y });
				spec.x = adjusted.x;
				spec.y = adjusted.y;
			},
			handleMouseMove: function (event: MouseEvent) {
				event.preventDefault();
				if (!moving) return;
				spec.x -= cursorElemAnchor.x - event.offsetX;
				spec.y -= cursorElemAnchor.y - event.offsetY;
			},
			handleMouseLeave: function (event: MouseEvent) {
				event.preventDefault();
				/*
				 * BUG: Fast movement ending in the cursor leaving the widget-position
				 * incomplete making the widget "freeze" in time. Should fix.
				 */
				moving = false;
			}
		},
		resize: {
			handleMouseDown: function () {
				resizing = true;
			},
			handleMouseUp: function () {
				spec.w = snappingHint.w;
				spec.h = snappingHint.h;
				resizing = false;
			}
		}
	};
</script>

{#if moving || resizing}
	<div
		class="snapping-hint ease-snapping"
		style:width="{snappingHint.w}px"
		style:height="{snappingHint.h}px"
		style="
			--snapping-hint-x-pos: {snappingHint.x}px;
			--snapping-hint-y-pos: {snappingHint.y}px;
			--transition: transform {snappingAnim},
				width {snappingAnim},
				height {snappingAnim};
		"
	></div>
{/if}

<div
	role="none"
	bind:clientWidth={spec.w}
	bind:clientHeight={spec.h}
	class="widget-wrapper"
	class:ease-snapping={!moving}
	style:opacity={moving || resizing ? '0.8' : '1'}
	style:width="{spec.w}px"
	style:height="{spec.h}px"
	style="
		--x-pos: {spec.x}px;
		--y-pos: {spec.y}px;
		--transition: transform {snappingAnim};
	"
	onmousedown={WIDGET.resize.handleMouseDown}
	onmouseup={WIDGET.resize.handleMouseUp}
>
	<div
		role="none"
		class="widget"
		style:cursor={moving ? 'grabbing' : 'grab'}
		onmousedown={WIDGET.move.handleMouseDown}
		onmouseup={WIDGET.move.handleMouseUp}
		onmousemove={WIDGET.move.handleMouseMove}
		onmouseleave={WIDGET.move.handleMouseLeave}
	>
		{@render children?.()}
	</div>
</div>

<style>
	.widget-wrapper,
	.snapping-hint {
		position: absolute;
	}

	.widget-wrapper {
		transform: translateX(var(--x-pos)) translateY(var(--y-pos));
		padding: 10px;
		background-color: white;
		box-sizing: border-box;
		overflow: auto;
		resize: both;
	}

	.widget {
		width: 100%;
		height: 100%;
		background-color: gray;
	}

	.snapping-hint {
		transform: translateX(var(--snapping-hint-x-pos))
			translateY(var(--snapping-hint-y-pos));
		background-color: #443443;
		opacity: 0.3;
	}

	.ease-snapping {
		transition: var(--transition);
	}
</style>
