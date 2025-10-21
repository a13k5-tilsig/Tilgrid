<script lang="ts">
	import type { IPosition, ISize, IWidget } from './types/widget';
	import type { IWidgetConfig } from './types/config';
	import XIcon from './XIcon.svelte';
	import WidgetPlaceholder from './WidgetPlaceholder.svelte';

	/*
	 * TODO:
	 * + Mask widget content when editing to avoid accidental clicks.
	 * + Add collision mechanism.
	 * + Add ability to make the widget container vertically dynamic.
	 *
	 * + Add style option; when resizing, only resize a dotted "border" before
	 *   actually resizing the widget when letting go of the cursor.
	 */

	let {
		widget = $bindable(),
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

	const snappingThreshold: number = $derived(snappingArea! / 2);

	const snappableContainerSize: ISize = $derived({
		width: Math.floor(containerSize.width / snappingArea!) * snappingArea!,
		height: Math.floor(containerSize.height / snappingArea!) * snappingArea!
	});

	const widgetIsOutOfBounds = (suggestedSpec: IWidget): boolean =>
		suggestedSpec.x + suggestedSpec.width > snappableContainerSize.width ||
		suggestedSpec.y + suggestedSpec.height > snappableContainerSize.height ||
		suggestedSpec.x < 0 ||
		suggestedSpec.y < 0;

	const adjustedPosition = (position: IPosition): IPosition => ({
		x:
			position.x % snappingArea! > snappingThreshold
				? roundSpec('up', 'x')
				: roundSpec('down', 'x'),
		y:
			position.y % snappingArea! > snappingThreshold
				? roundSpec('up', 'y')
				: roundSpec('down', 'y')
	});

	const adjustedSize = (size: ISize): ISize => ({
		width:
			size.width % snappingArea! > snappingThreshold
				? roundSpec('up', 'width')
				: roundSpec('down', 'width'),
		height:
			size.height % snappingArea! > snappingThreshold
				? roundSpec('up', 'height')
				: roundSpec('down', 'height')
	});

	const snappingHint: ISize & IPosition = $derived.by(() => {
		if (moving) {
			return {
				...adjustedPosition({ x: widget.x, y: widget.y }),
				width: widget.width,
				height: widget.height
			};
		} else if (resizing) {
			return {
				...adjustedSize({ width: widget.width, height: widget.height }),
				x: widget.x,
				y: widget.y
			};
		} else {
			return {
				x: widget.x,
				y: widget.y,
				width: widget.width,
				height: widget.height
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
				widget.x = snappingHint.x;
				widget.y = snappingHint.y;
				moving = false;
				editingWidget = false;
				funcs?.onWidgetMove?.(widget.id);
			},
			handleMouseMove: function (event: MouseEvent) {
				if (!moving || !editing || !editingWidget) return;
				event.preventDefault();
				event.stopPropagation();
				widget.x -= cursorWidgetAnchor.x - event.offsetX;
				widget.y -= cursorWidgetAnchor.y - event.offsetY;
			},
			handleMouseLeave: function (event: MouseEvent) {
				if (!moving || !editing || !editingWidget) return;
				event.preventDefault();
				event.stopPropagation();
				widget.x = snappingHint.x;
				widget.y = snappingHint.y;
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
				widget.width = snappingHint.width;
				widget.height = snappingHint.height;
				resizing = false;
				editingWidget = false;
				funcs?.onWidgetResize?.(widget.id);
			},
			handleMouseMove: function () {
				if (!resizing || !editing || !editingWidget) return;
				widget.width = widgetSize.width;
				widget.height = widgetSize.height;
			}
		},
		remove: function (event: MouseEvent) {
			event.preventDefault();
			event.stopPropagation();
			funcs?.onWidgetRemove?.(widget.id);
		}
	};

	function roundSpec(
		direction: 'up' | 'down',
		prop: 'x' | 'y' | 'width' | 'height'
	): number {
		let widgetCopy = { ...widget };
		widgetCopy[prop] =
			direction == 'up'
				? Math.ceil(widget[prop] / snappingArea!) * snappingArea!
				: Math.floor(widget[prop] / snappingArea!) * snappingArea!;
		if (widgetIsOutOfBounds(widgetCopy)) {
			return lastSuggestedSnapp[prop];
		} else {
			lastSuggestedSnapp[prop] = widgetCopy[prop];
			return widgetCopy[prop];
		}
	}

	let widgetSize: ISize = $state({ width: 0, height: 0 });
	let editingWidget: boolean = $state(false);
	let cursorWidgetAnchor: IPosition = $state({ x: 0, y: 0 });

	let lastSuggestedSnapp: IPosition & ISize = {
		x: widget.x,
		y: widget.y,
		width: widget.width,
		height: widget.height
	};
</script>

<div
	id="snapping-hint"
	class="ease-snapping"
	class:on-top={editingWidget}
	style:width="{snappingHint.width}px"
	style:height="{snappingHint.height}px"
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
	bind:clientWidth={widgetSize.width}
	bind:clientHeight={widgetSize.height}
	class:on-top={editingWidget}
	class:ease-snapping={!editingWidget}
	class:editing
	style:opacity={editingWidget ? '0.8' : '1'}
	style:width="{widget.width}px"
	style:height="{widget.height}px"
	style="
		--x-pos: {widget.x}px;
		--y-pos: {widget.y}px;
		--widget-space: {widgetSpace}px;
		--transition-time: {snappingAnimTime}ms;
	"
	onmousedown={WIDGET.resize.handleMouseDown}
	onmouseup={WIDGET.resize.handleMouseUp}
	onmousemove={WIDGET.resize.handleMouseMove}
>
	{#if !!funcs?.onWidgetRemove && editing}
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
			<WidgetPlaceholder {...widget} />
		{/if}
	</div>
</div>

<style>
	.on-top {
		z-index: 99 !important;
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
