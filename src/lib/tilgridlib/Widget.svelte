<script lang="ts">
	import type { IWidget, ISize, IPosition, IFuncs } from './types/widget';
	import { type Snippet } from 'svelte';

	/*
	 * TODO:
	 * + Add collision mechanism.
	 * + Add main ability of rendering passed children.
	 * + Add ability to stop widgets from moving out-of-bounds (container).
	 * + Add locked feature for locking widgets and hiding ability to delete the items.
	 * + Add ability to scale the container horizontaly (for slimmer viewing) (how?).
	 * + Add ability to make the widget conteiner vertically dynamic.
	 *
	 * FIX:
	 * + Some Svelte array re-indexing funk, not necessarily a bug;
	 *   When placing two widgets besides eachother (make them big for best visibility)
	 *   and then delete the one to the left, for a secong, the one to the right takes
	 *   the place of the deleted one before shifting back to its own position again.
	 * + When moving a widget and the cursor hovers over neighboring widgets;
	 *   those widgets detect that as a mouseDown event.
	 *   Fix by making it so that only one widget can be moved at a time, so when hovering
	 *   a widget that isn't being moved, that widget won't act on the event.
	 */

	interface Props {
		spec: IWidget;
		moving: boolean;
		resizing: boolean;
		snappingArea: number;
		snappingAnimTime: string;
		funcs?: IFuncs;
		children?: Snippet;
	}

	let {
		spec = $bindable(),
		moving = $bindable(),
		resizing = $bindable(),
		snappingArea,
		snappingAnimTime,
		funcs,
		children
	}: Props = $props();

	/**
	 * The widget itself (the wrapper at least...).
	 */
	let elem = $state<HTMLDivElement>();

	/**
	 * Where the cursor anchors on the element, for precise movement.
	 */
	let cursorElemAnchor: IPosition = $state({ x: 0, y: 0 });

	/**
	 * How much a widgets spills into a new area before
	 * snapp-suggesting the new position.
	 *
	 * Note:
	 * this is only sensitive to spillover in the +X and +Y direction
	 * maybe fix?.
	 */
	let snappingThreshold: number = $derived(snappingArea / 2);

	/**
	 * Round an axis position up to its closest snapping-area.
	 */
	function roundSpecUp(prop: 'x' | 'y' | 'w' | 'h'): number {
		return Math.ceil(spec[prop] / snappingArea) * snappingArea;
	}

	/**
	 * Round an axis position down to its closest snapping-area.
	 */
	function roundSpecDown(prop: 'x' | 'y' | 'w' | 'h'): number {
		return Math.floor(spec[prop] / snappingArea) * snappingArea;
	}

	/**
	 * Adjust the position of the widget to match the snapping-area.
	 */
	function adjustedPosition(position: IPosition): IPosition {
		return {
			x:
				position.x % snappingArea > snappingThreshold
					? roundSpecUp('x')
					: roundSpecDown('x'),
			y:
				position.y % snappingArea > snappingThreshold
					? roundSpecUp('y')
					: roundSpecDown('y')
		};
	}

	/**
	 * Adjust the size of the widget to match the snapping-area.
	 */
	function adjustedSize(size: ISize): ISize {
		return {
			w:
				size.w % snappingArea > snappingThreshold
					? roundSpecUp('w')
					: roundSpecDown('w'),
			h:
				size.h % snappingArea > snappingThreshold
					? roundSpecUp('h')
					: roundSpecDown('h')
		};
	}

	/**
	 * The shadow (or ghost, if you will) that hints at the area where the
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
				event.stopPropagation();
				moving = true;
				cursorElemAnchor.x = event.offsetX;
				cursorElemAnchor.y = event.offsetY;
			},
			handleMouseUp: function (event: MouseEvent) {
				event.preventDefault();
				event.stopPropagation();
				spec.x = snappingHint.x;
				spec.y = snappingHint.y;
				moving = false;

				// Runs when the operation is complete.
				funcs?.move?.({ id: spec.id });
			},
			handleMouseMove: function (event: MouseEvent) {
				event.preventDefault();
				event.stopPropagation();
				if (!moving) return;
				spec.x -= cursorElemAnchor.x - event.offsetX;
				spec.y -= cursorElemAnchor.y - event.offsetY;
			},
			handleMouseLeave: function (event: MouseEvent) {
				event.preventDefault();
				// Set the last snapped position before stopping the operation.
				spec.x = snappingHint.x;
				spec.y = snappingHint.y;
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

				// Runs when the operation is complete.
				funcs?.move?.({ id: spec.id });
			},
			handleMouseMove: function () {
				if (!resizing) return;
				spec.w = elem!.clientWidth;
				spec.h = elem!.clientHeight;
			}
		},
		remove: function (event: MouseEvent) {
			event.preventDefault();
			event.stopPropagation();
			// Runs immediately.
			funcs?.remove?.({ id: spec.id });
		}
	};
</script>

<div
	id="snapping-hint"
	class="ease-snapping"
	style:width="{snappingHint.w}px"
	style:height="{snappingHint.h}px"
	style:opacity={moving || resizing ? 0.4 : 0}
	style="
		--snapping-hint-x-pos: {snappingHint.x}px;
		--snapping-hint-y-pos: {snappingHint.y}px;
		--transition-time: calc({snappingAnimTime} / 2);
	"
></div>

<div
	id="widget-wrapper"
	role="none"
	bind:this={elem}
	class:ease-snapping={!moving && !resizing}
	style:opacity={moving || resizing ? '0.8' : '1'}
	style:width="{spec.w}px"
	style:height="{spec.h}px"
	style="
		--x-pos: {spec.x}px;
		--y-pos: {spec.y}px;
		--transition-time: {snappingAnimTime};
	"
	onmousedown={WIDGET.resize.handleMouseDown}
	onmouseup={WIDGET.resize.handleMouseUp}
	onmousemove={WIDGET.resize.handleMouseMove}
>
	<!--
		only appears if a remove-function is provided by the component
		hosting the Tilgrid main component.
	-->
	{#if !!funcs?.remove}
		<button
			id="remove"
			class="center-content"
			onmousedown={(e) => e.stopPropagation()}
			onclick={WIDGET.remove}
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
				<!--
					!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com \
					License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.
				-->
				<path
					d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"
				/>
			</svg>
		</button>
	{/if}

	<div
		id="widget"
		role="none"
		style:cursor={moving ? 'grabbing' : 'grab'}
		onmousedown={WIDGET.move.handleMouseDown}
		onmouseup={WIDGET.move.handleMouseUp}
		onmousemove={WIDGET.move.handleMouseMove}
		onmouseleave={WIDGET.move.handleMouseLeave}
	>
		{#if !!children}
			{@render children()}
		{:else}
			<!--
				FIX:
				Some funk with snapping when grabbing over text \
				and then moving up and down.
			-->
			<div id="placeholder" class="center-content">
				<div style:font-family="Arial, Helvetica, sans-serif">
					<h4>
						If you see this,
						<br />
						there is no widget.
					</h4>
					<br />
					Width:
					<span style:float="right" style:margin-left="10px">
						{spec.w}px
					</span>
					<br />
					Height:
					<span style:float="right" style:margin-left="10px">
						{spec.h}px
					</span>
					<br />
					Position from top:
					<span style:float="right" style:margin-left="10px">
						{spec.y}px
					</span>
					<br />
					Position from left:
					<span style:float="right" style:margin-left="10px">
						{spec.x}px
					</span>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.center-content {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.ease-snapping {
		transition-property: width, height, transform, opacity;
		transition-timing-function: ease-in-out;
		transition-duration: var(--transition-time);
	}

	#widget-wrapper,
	#snapping-hint,
	#remove {
		position: absolute;
	}

	#widget-wrapper {
		transform: translateX(var(--x-pos)) translateY(var(--y-pos));
		padding: 10px;
		background-color: white;
		box-sizing: border-box;
		overflow: auto;
		resize: both;
	}

	#widget {
		width: 100%;
		height: 100%;
		background-color: gray;
		overflow: hidden;
	}

	#snapping-hint {
		transform: translateX(var(--snapping-hint-x-pos))
			translateY(var(--snapping-hint-y-pos));
		background-color: #443443;
	}

	button#remove {
		background-color: pink;
		top: 0;
		right: 0;
		width: 20px;
		height: 20px;
		padding: 0;
		border: 2px solid white;
		outline: none;
		cursor: pointer;
		& :hover {
			background-color: red;
		}
	}

	div#placeholder {
		width: 100%;
		height: 100%;
	}

	div#placeholder h4 {
		margin: 0;
		padding: 0;
		text-align: center;
	}
</style>
