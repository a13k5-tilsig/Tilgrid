<script lang="ts">
	import type { IPosition, ISize, IWidget } from './types/widget';
	import type { IWidgetConfig } from './types/config';
	import XIcon from './XIcon.svelte';
	import WidgetPlaceholder from './WidgetPlaceholder.svelte';

	/*
	 * TODO:
	 * + Mask widget content when editing.
	 * + Add collision mechanism.
	 * + Add ability to make the widget container vertically dynamic.
	 *
	 * + Add style option; when resizing, only resize a dotted "border" before
	 *   actually resizing the widget when letting go of the cursor.
	 */

	let {
		spec = $bindable(),
		moving = $bindable(),
		resizing = $bindable(),
		containerSize,
		snappingArea,
		snappingAnimTime,
		editing,
		widgetSpace,
		funcs,
		children
	}: IWidgetConfig = $props();

	let widgetSize: ISize = $state({ w: 0, h: 0 });
	let editingWidget: boolean = $state(false);
	let cursorWidgetAnchor: IPosition = $state({ x: 0, y: 0 });

	let lastSuggestedSnapp: IPosition & ISize = {
		x: spec.x,
		y: spec.y,
		w: spec.w,
		h: spec.h
	};

	let snappableContainerSize: ISize = $derived({
		w: Math.floor(containerSize.w / snappingArea!) * snappingArea!,
		h: Math.floor(containerSize.h / snappingArea!) * snappingArea!
	});

	let snappingThreshold: number = $derived(snappingArea! / 2);

	function roundSpec(
		direction: 'up' | 'down',
		prop: 'x' | 'y' | 'w' | 'h'
	): number {
		let specCopy = { ...spec };
		specCopy[prop] =
			direction == 'up'
				? Math.ceil(spec[prop] / snappingArea!) * snappingArea!
				: Math.floor(spec[prop] / snappingArea!) * snappingArea!;
		if (specIsOutOfBounds(specCopy)) {
			return lastSuggestedSnapp[prop];
		} else {
			lastSuggestedSnapp[prop] = specCopy[prop];
			return specCopy[prop];
		}
	}

	function specIsOutOfBounds(suggestedSpec: IWidget): boolean {
		if (
			// Check X axis
			suggestedSpec.x + suggestedSpec.w > snappableContainerSize.w ||
			suggestedSpec.x < 0 ||
			// Check Y axis
			suggestedSpec.y + suggestedSpec.h > snappableContainerSize.h ||
			suggestedSpec.y < 0
		) {
			return true;
		} else {
			return false;
		}
	}

	function adjustedPosition(position: IPosition): IPosition {
		return {
			x:
				position.x % snappingArea! > snappingThreshold
					? roundSpec('up', 'x')
					: roundSpec('down', 'x'),
			y:
				position.y % snappingArea! > snappingThreshold
					? roundSpec('up', 'y')
					: roundSpec('down', 'y')
		};
	}

	// TODO: Can make this cover for adjustPosition aswell, need some type trickery...
	function adjustedSize(size: ISize): ISize {
		return {
			w:
				size.w % snappingArea! > snappingThreshold
					? roundSpec('up', 'w')
					: roundSpec('down', 'w'),
			h:
				size.h % snappingArea! > snappingThreshold
					? roundSpec('up', 'h')
					: roundSpec('up', 'h')
		};
	}

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

	const WIDGET = {
		move: {
			handleMouseDown: function (event: MouseEvent) {
				if (!editing) return;
				event.preventDefault();
				event.stopPropagation();
				moving = true;
				editingWidget = true;
				cursorWidgetAnchor.x = event.offsetX;
				cursorWidgetAnchor.y = event.offsetY;
			},
			handleMouseUp: function (event: MouseEvent) {
				if (!editing) return;
				event.preventDefault();
				event.stopPropagation();
				spec.x = snappingHint.x;
				spec.y = snappingHint.y;
				moving = false;
				editingWidget = false;
				funcs?.move?.({ id: spec.id });
			},
			handleMouseMove: function (event: MouseEvent) {
				if (!moving || !editing || !editingWidget) return;
				event.preventDefault();
				event.stopPropagation();
				spec.x -= cursorWidgetAnchor.x - event.offsetX;
				spec.y -= cursorWidgetAnchor.y - event.offsetY;
			},
			handleMouseLeave: function (event: MouseEvent) {
				if (!moving || !editing || !editingWidget) return;
				event.preventDefault();
				spec.x = snappingHint.x;
				spec.y = snappingHint.y;
				moving = false;
				editingWidget = false;
			}
		},
		resize: {
			handleMouseDown: function () {
				if (!editing) return;
				resizing = true;
				editingWidget = true;
			},
			handleMouseUp: function () {
				if (!resizing || !editing || !editingWidget) return;
				spec.w = snappingHint.w;
				spec.h = snappingHint.h;
				resizing = false;
				editingWidget = false;
				funcs?.size?.({ id: spec.id });
			},
			handleMouseMove: function () {
				if (!resizing || !editing || !editingWidget) return;
				spec.w = widgetSize.w;
				spec.h = widgetSize.h;
			}
		},
		remove: function (event: MouseEvent) {
			event.preventDefault();
			event.stopPropagation();
			funcs?.remove?.({ id: spec.id });
		}
	};
</script>

<div
	id="snapping-hint"
	class="ease-snapping"
	class:on-top={editingWidget}
	style:width="{snappingHint.w}px"
	style:height="{snappingHint.h}px"
	style:opacity={editingWidget ? 0.4 : 0}
	style="
		--snapping-hint-x-pos: {snappingHint.x}px;
		--snapping-hint-y-pos: {snappingHint.y}px;
		--transition-time: calc({snappingAnimTime}ms / 2);
	"
></div>

<div
	id="widget-wrapper"
	role="none"
	bind:clientWidth={widgetSize.w}
	bind:clientHeight={widgetSize.h}
	class:on-top={editingWidget}
	class:ease-snapping={!editingWidget}
	class:editing
	style:opacity={editingWidget ? '0.8' : '1'}
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
