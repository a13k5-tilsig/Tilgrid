<script lang="ts">
	import type { IPosition, ISize, IWidget } from './types/widget';
	import type { IWidgetConfig } from './types/config';
	import XIcon from './XIcon.svelte';
	import WidgetPlaceholder from './WidgetPlaceholder.svelte';
	import { ShiftWidgets } from './util/shiftWidgets';

	/*
	 * TODO:
	 * + Add self-adjustment on out-of-bounds after container resize.
	 * + Add vertical stretchability, for new and moving widgets.
	 *
	 * + Add "undo" feature by saving the current specs before updating the config.
	 * + Add collision mechanism.
	 * + Add ability to make the widget container vertically dynamic.
	 * + Add min / max widget size (bind with rendered child?)
	 * + Add style option; when resizing, only resize a dotted "border" before
	 *   actually resizing the widget when letting go of the cursor.
	 */

	let {
		widgets = $bindable(),
		widget = $bindable(),
		moving = $bindable(),
		resizing = $bindable(),
		containerSize,
		snappingArea,
		snappingAnimTime,
		editing,
		widgetSpace,
		funcs,
		children,
	}: IWidgetConfig & { widgets: IWidget[] } = $props();

	type IDirection = 'up' | 'down';
	type IXAxis = 'x' | 'width';
	type IYAxis = 'y' | 'height';
	type IAxis = IXAxis | IYAxis;

	const snappingThreshold: number = $derived(snappingArea! / 2);

	const snappableContainerSize: ISize = $derived({
		width: Math.floor(containerSize.width / snappingArea!) * snappingArea!,
		height: Math.floor(containerSize.height / snappingArea!) * snappingArea!,
	});

	const xIsOutOfBounds = $derived(
		widget.x + widget.width > snappableContainerSize.width || widget.x < 0,
	);
	const yIsOutOfBounds = $derived(
		widget.y + widget.height > snappableContainerSize.height || widget.y < 0,
	);

	const specIsOutOfBounds = (widget: IWidget, spec: IAxis): boolean =>
		spec == 'x' || spec == 'width'
			? widget.x + widget.width > snappableContainerSize.width || widget.x < 0
			: widget.y + widget.height > snappableContainerSize.height ||
				widget.y < 0;

	let lastSuggestedSnapp: IPosition & ISize = {
		x: widget.x,
		y: widget.y,
		width: widget.width,
		height: widget.height,
	};

	function roundWidgetSpec(direction: IDirection, prop: IAxis): number {
		let widgetCopy = { ...widget };
		widgetCopy[prop] =
			direction == 'up'
				? Math.ceil(widget[prop] / snappingArea!) * snappingArea!
				: Math.floor(widget[prop] / snappingArea!) * snappingArea!;
		if (specIsOutOfBounds(widgetCopy, prop)) {
			return lastSuggestedSnapp[prop];
		} else {
			lastSuggestedSnapp[prop] = widgetCopy[prop];
			return widgetCopy[prop];
		}
	}

	const adjustedPosition = (position: IPosition): IPosition => ({
		x:
			position.x % snappingArea! > snappingThreshold
				? roundWidgetSpec('up', 'x')
				: roundWidgetSpec('down', 'x'),
		y:
			position.y % snappingArea! > snappingThreshold
				? roundWidgetSpec('up', 'y')
				: roundWidgetSpec('down', 'y'),
	});

	const adjustedSize = (size: ISize): ISize => ({
		width:
			size.width % snappingArea! > snappingThreshold
				? roundWidgetSpec('up', 'width')
				: roundWidgetSpec('down', 'width'),
		height:
			size.height % snappingArea! > snappingThreshold
				? roundWidgetSpec('up', 'height')
				: roundWidgetSpec('down', 'height'),
	});

	const snappingHint: ISize & IPosition = $derived.by(() => {
		if (moving) {
			return {
				...adjustedPosition({ x: widget.x, y: widget.y }),
				width: widget.width,
				height: widget.height,
			};
		} else if (resizing) {
			return {
				...adjustedSize({ width: widget.width, height: widget.height }),
				x: widget.x,
				y: widget.y,
			};
		} else {
			return {
				x: widget.x,
				y: widget.y,
				width: widget.width,
				height: widget.height,
			};
		}
	});

	let currentWidgetSize: ISize = $state({ width: 0, height: 0 });
	let editingThisWidget: boolean = $state(false);
	let cursorWidgetAnchor: IPosition = $state({ x: 0, y: 0 });

	let currentSnapHint: IPosition = { x: widget.x, y: widget.y };

	const WIDGET = {
		move: {
			handleMouseDown: function (event: MouseEvent) {
				if (!editing) return;
				event.preventDefault();
				event.stopPropagation();
				moving = true;
				editingThisWidget = true;
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
				editingThisWidget = false;
				funcs?.onWidgetMove?.(widget.id);
			},
			handleMouseMove: function (event: MouseEvent) {
				if (!moving || !editing || !editingThisWidget) return;
				event.preventDefault();
				event.stopPropagation();
				widget.x -= cursorWidgetAnchor.x - event.offsetX;
				widget.y -= cursorWidgetAnchor.y - event.offsetY;

				if (
					currentSnapHint.x !== snappingHint.x ||
					currentSnapHint.y !== snappingHint.y
				) {
					currentSnapHint.x = snappingHint.x;
					currentSnapHint.y = snappingHint.y;
					widgets = new ShiftWidgets(
						widget,
						{ x: snappingHint.x, y: snappingHint.y },
						widgets,
						containerSize,
						snappingArea!,
					).shifted;

					console.log('SHIFTED!');
				}
			},
			handleMouseLeave: function (event: MouseEvent) {
				if (!moving || !editing || !editingThisWidget) return;
				event.preventDefault();
				event.stopPropagation();
				widget.x = snappingHint.x;
				widget.y = snappingHint.y;
				moving = false;
				editingThisWidget = false;
			},
		},
		resize: {
			handleMouseDown: function () {
				if (!editing) return;
				resizing = true;
				editingThisWidget = true;
			},
			handleMouseUp: function () {
				if (!resizing || !editing || !editingThisWidget) return;
				widget.width = snappingHint.width;
				widget.height = snappingHint.height;
				resizing = false;
				editingThisWidget = false;
				funcs?.onWidgetResize?.(widget.id);
			},
			handleMouseMove: function () {
				if (!resizing || !editing || !editingThisWidget) return;
				widget.width = currentWidgetSize.width;
				widget.height = currentWidgetSize.height;
			},
		},
		remove: function (event: MouseEvent) {
			event.preventDefault();
			event.stopPropagation();
			funcs?.onWidgetRemove?.(widget.id);
		},
	};
</script>

<div
	id="snapping-hint"
	class="ease-snapping"
	class:on-top={editingThisWidget}
	style:width="{snappingHint.width}px"
	style:height="{snappingHint.height}px"
	style:opacity={editingThisWidget ? 0.4 : 0}
	style:transform="translateX({snappingHint.x}px) translateY({snappingHint.y}px)"
	style="--transition-time: calc({snappingAnimTime}ms / 2)"
></div>

<div
	bind:clientWidth={currentWidgetSize.width}
	bind:clientHeight={currentWidgetSize.height}
	role="none"
	id="widget-wrapper"
	class:editing
	class:on-top={editingThisWidget}
	class:ease-snapping={!editingThisWidget}
	style:width="{widget.width}px"
	style:height="{widget.height}px"
	style:padding="{widgetSpace}px"
	style:opacity={editingThisWidget ? '0.8' : '1'}
	style:transform="translateX({widget.x}px) translateY({widget.y}px)"
	style="--transition-time: {snappingAnimTime}ms"
	onmousedown={WIDGET.resize.handleMouseDown}
	onmouseup={WIDGET.resize.handleMouseUp}
	onmousemove={WIDGET.resize.handleMouseMove}
>
	{#if !!funcs?.onWidgetRemove && editing}
		<button
			id="delete-button"
			class="center-content"
			onmousedown={(e) => e.stopPropagation()}
			onclick={WIDGET.remove}
		>
			<XIcon />
		</button>
	{/if}

	<div id="widget-frame" style:user-select={editing ? 'none' : 'initial'}>
		{#if editing || moving || resizing || editingThisWidget}
			<div
				role="none"
				id="widget-mask"
				style:cursor={!editing ? 'auto' : moving ? 'grabbing' : 'grab'}
				onmousedown={WIDGET.move.handleMouseDown}
				onmouseup={WIDGET.move.handleMouseUp}
				onmousemove={WIDGET.move.handleMouseMove}
				onmouseleave={WIDGET.move.handleMouseLeave}
			></div>
		{/if}

		{#if !!children}
			{@render children()}
		{:else}
			<WidgetPlaceholder {...widget} />
		{/if}
	</div>
</div>

<style>
	.on-top {
		z-index: 1;
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

	#snapping-hint,
	#widget-wrapper,
	#widget-mask,
	#delete-button {
		position: absolute;
	}

	#widget-mask,
	#widget-frame {
		width: 100%;
		height: 100%;
	}

	#snapping-hint {
		background-color: #443443;
	}

	#widget-wrapper {
		box-sizing: border-box;
		transition: opacity var(--transition-time) ease-in-out;
	}

	#widget-wrapper.editing {
		background-color: lightgray;
		overflow: auto;
		resize: both;
	}

	#widget-mask {
		z-index: 2;
		background-color: lightgray;
		opacity: 0.5;
	}

	#widget-frame {
		position: relative;
		overflow: hidden;
	}

	button#delete-button {
		z-index: 3;
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
