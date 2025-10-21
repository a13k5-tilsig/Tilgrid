<script lang="ts">
	import type { IPosition, ISize } from './types/widget';
	import type { IWidgetConfig } from './types/config';
	import XIcon from './XIcon.svelte';
	import WidgetPlaceholder from './WidgetPlaceholder.svelte';

	/*
	 * TODO:
	 * + Add ability to stop widgets from moving out-of-bounds (container).
	 *
	 * + Add collision mechanism.
	 * + Add ability to make the widget container vertically dynamic.
	 *
	 * + Add style option; when resizing, only resize a dotted "border" before
	 *   actually resizing the widget when letting go of the cursor.
	 *
	 * FIX:
	 * + Some Svelte array re-indexing funk, not necessarily a bug;
	 *   When placing two widgets besides eachother (make them big for best visibility)
	 *   and then delete the one to the left, for a second, the one to the right takes
	 *   the place of the deleted one before shifting back to its own position again.
	 */

	let {
		spec = $bindable(),
		moving = $bindable(),
		resizing = $bindable(),
		snappingArea,
		snappingAnimTime,
		editing,
		widgetSpace,
		funcs,
		children
	}: IWidgetConfig = $props();

	/**
	 * The widget itself (the wrapper at least...).
	 */
	let elem = $state<HTMLDivElement>();

	/**
	 * State to be observed if this element is moving.
	 */
	let elemIsMoving: boolean = $state(false);

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
	let snappingThreshold: number = $derived(snappingArea! / 2);

	/**
	 * Round an axis position up to its closest snapping-area.
	 */
	function roundSpecUp(prop: 'x' | 'y' | 'w' | 'h'): number {
		return Math.ceil(spec[prop] / snappingArea!) * snappingArea!;
	}

	/**
	 * Round an axis position down to its closest snapping-area.
	 */
	function roundSpecDown(prop: 'x' | 'y' | 'w' | 'h'): number {
		return Math.floor(spec[prop] / snappingArea!) * snappingArea!;
	}

	/**
	 * Adjust the position of the widget to match the snapping-area.
	 */
	function adjustedPosition(position: IPosition): IPosition {
		return {
			x:
				position.x % snappingArea! > snappingThreshold
					? roundSpecUp('x')
					: roundSpecDown('x'),
			y:
				position.y % snappingArea! > snappingThreshold
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
				size.w % snappingArea! > snappingThreshold
					? roundSpecUp('w')
					: roundSpecDown('w'),
			h:
				size.h % snappingArea! > snappingThreshold
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
				if (!editing) return;
				event.preventDefault();
				event.stopPropagation();
				moving = true;
				elemIsMoving = true;
				cursorElemAnchor.x = event.offsetX;
				cursorElemAnchor.y = event.offsetY;
			},
			handleMouseUp: function (event: MouseEvent) {
				if (!editing) return;
				event.preventDefault();
				event.stopPropagation();
				spec.x = snappingHint.x;
				spec.y = snappingHint.y;
				moving = false;
				elemIsMoving = false;
				funcs?.move?.({ id: spec.id });
			},
			handleMouseMove: function (event: MouseEvent) {
				if (!moving || !editing || !elemIsMoving) return;
				event.preventDefault();
				event.stopPropagation();
				spec.x -= cursorElemAnchor.x - event.offsetX;
				spec.y -= cursorElemAnchor.y - event.offsetY;
			},
			handleMouseLeave: function (event: MouseEvent) {
				if (!moving || !editing || !elemIsMoving) return;
				event.preventDefault();
				spec.x = snappingHint.x;
				spec.y = snappingHint.y;
				moving = false;
				elemIsMoving = false;
			}
		},
		resize: {
			handleMouseDown: function () {
				if (!editing) return;
				resizing = true;
				elemIsMoving = true;
			},
			handleMouseUp: function () {
				if (!resizing || !editing || !elemIsMoving) return;
				spec.w = snappingHint.w;
				spec.h = snappingHint.h;
				resizing = false;
				elemIsMoving = false;
				funcs?.size?.({ id: spec.id });
			},
			handleMouseMove: function () {
				if (!resizing || !editing || !elemIsMoving) return;
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
	class:on-top={elemIsMoving}
	style:width="{snappingHint.w}px"
	style:height="{snappingHint.h}px"
	style:opacity={elemIsMoving ? 0.4 : 0}
	style="
		--snapping-hint-x-pos: {snappingHint.x}px;
		--snapping-hint-y-pos: {snappingHint.y}px;
		--transition-time: calc({snappingAnimTime}ms / 2);
	"
></div>

<div
	id="widget-wrapper"
	role="none"
	bind:this={elem}
	class:on-top={elemIsMoving}
	class:ease-snapping={!elemIsMoving}
	class:editing
	style:opacity={elemIsMoving ? '0.8' : '1'}
	style:width="{spec.w}px"
	style:height="{spec.h}px"
	style="
		--x-pos: {spec.x}px;
		--y-pos: {spec.y}px;
		--widget-space: {widgetSpace}px;
		--transition-time: {snappingAnimTime}ms;
	"
	onmousedown={WIDGET.resize.handleMouseDown}
	onmouseup={WIDGET.resize.handleMouseUp}
	onmousemove={WIDGET.resize.handleMouseMove}
>
	<!--
		only appears if a remove-function is provided by the component
		hosting the Tilgrid main component.
	-->
	{#if !!funcs?.remove && editing}
		<button
			id="remove"
			class="center-content"
			onmousedown={(e) => e.stopPropagation()}
			onclick={WIDGET.remove}
		>
			<XIcon />
		</button>
	{/if}

	<div
		id="widget"
		role="none"
		style:cursor={!editing ? 'auto' : moving ? 'grabbing' : 'grab'}
		onmousedown={WIDGET.move.handleMouseDown}
		onmouseup={WIDGET.move.handleMouseUp}
		onmousemove={WIDGET.move.handleMouseMove}
		onmouseleave={WIDGET.move.handleMouseLeave}
	>
		{#if !!children}
			{@render children()}
		{:else}
			<WidgetPlaceholder {...spec} />
		{/if}
	</div>
</div>

<style>
	.on-top {
		z-index: 999 !important;
	}
	.center-content {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.ease-snapping {
		transition-property: width, height, transform, opacity !important;
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
		padding: var(--widget-space);
		box-sizing: border-box;
		overflow: auto;
		transition: opacity var(--transition-time) ease-in-out;
	}

	#widget-wrapper.editing {
		resize: both;
		background-color: white;
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
		&:hover {
			background-color: red;
		}
	}
</style>
