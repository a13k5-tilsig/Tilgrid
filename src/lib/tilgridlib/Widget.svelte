<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { IWidgetConfig } from './types/config';
	import type { IPosition, ISize, IWidget } from './types/widget';
	import XIcon from './default/XIcon.svelte';
	import MoveResizeMask from './default/MoveResizeMask.svelte';
	import WidgetPlaceholder from './default/WidgetPlaceholder.svelte';

	let {
		widgets = $bindable(),
		widget = $bindable(),
		moving = $bindable(),
		resizing = $bindable(),
		useDefaultMoveMask,
		useDefaultResizeMask,
		verticallyDynamic,
		horizontallyDynamic,
		containerSize,
		snappingArea,
		editing,
		widgetSpace,
		funcs,
		movingMask,
		resizingMask,
		children
	}: IWidgetConfig & {
		widgets: IWidget[];
		movingMask?: Snippet;
		resizingMask?: Snippet;
		verticallyDynamic?: boolean;
		horizontallyDynamic?: boolean;
	} = $props();

	type IDirection = 'up' | 'down';
	type IXAxis = 'x' | 'width';
	type IYAxis = 'y' | 'height';
	type IAxis = IXAxis | IYAxis;

	const snappingThreshold: number = $derived(snappingArea! / 2);

	const snappableContainerSize: ISize = $derived({
		width: Math.floor(containerSize.width / snappingArea!) * snappingArea!,
		height: Math.floor(containerSize.height / snappingArea!) * snappingArea!
	});

	const specIsOutOfBounds = (widget: IWidget, spec: IAxis): boolean => {
		if (
			((spec == 'x' || spec == 'width') &&
				widget[spec] > -1 &&
				horizontallyDynamic) ||
			((spec == 'y' || spec == 'height') &&
				widget[spec] > -1 &&
				verticallyDynamic)
		) {
			return false;
		} else {
			return spec == 'x' || spec == 'width'
				? widget.x + widget.width > snappableContainerSize.width || widget.x < 0
				: widget.y + widget.height > snappableContainerSize.height ||
						widget.y < 0;
		}
	};

	let lastSuggestedSnapp: IPosition & ISize = {
		x: widget.x,
		y: widget.y,
		width: widget.width,
		height: widget.height
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
				: roundWidgetSpec('down', 'y')
	});

	const adjustedSize = (size: ISize): ISize => ({
		width:
			size.width % snappingArea! > snappingThreshold
				? roundWidgetSpec('up', 'width')
				: roundWidgetSpec('down', 'width'),
		height:
			size.height % snappingArea! > snappingThreshold
				? roundWidgetSpec('up', 'height')
				: roundWidgetSpec('down', 'height')
	});

	let currentWidgetSize: ISize = $state({ width: 0, height: 0 });
	let editingThisWidget: boolean = $state(false);
	let cursorWidgetAnchor: IPosition = $state({ x: 0, y: 0 });

	const snappingHint: ISize & IPosition = $derived.by(() => {
		if (editingThisWidget && moving) {
			return {
				...lastSuggestedSnapp,
				...adjustedPosition({ x: widget.x, y: widget.y })
			};
		} else if (editingThisWidget && resizing) {
			return {
				...lastSuggestedSnapp,
				...adjustedSize({ width: widget.width, height: widget.height })
			};
		} else {
			return lastSuggestedSnapp;
		}
	});

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
			},
			handleMouseLeave: function (event: MouseEvent) {
				if (!moving || !editing || !editingThisWidget) return;
				event.preventDefault();
				event.stopPropagation();
				widget.x = snappingHint.x;
				widget.y = snappingHint.y;
				moving = false;
				editingThisWidget = false;
			}
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
			}
		},
		remove: function (event: MouseEvent) {
			event.preventDefault();
			event.stopPropagation();
			funcs?.onWidgetRemove?.(widget.id);
		}
	};
</script>

<div
	id="snapping-hint"
	class="ease-snapping"
	class:on-top={editingThisWidget}
	style:width="{snappingHint.width}px"
	style:height="{snappingHint.height}px"
	style:transform="translateX({snappingHint.x}px) translateY({snappingHint.y}px)"
	style:opacity={moving || resizing ? '0.8' : '0'}
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
	onmousedown={WIDGET.resize.handleMouseDown}
	onmouseup={WIDGET.resize.handleMouseUp}
	onmousemove={WIDGET.resize.handleMouseMove}
	ondblclick={(e) => e.preventDefault()}
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

			<div class="move-resize-mask" style:opacity={'1'}>
				{#if useDefaultResizeMask}
					<MoveResizeMask type={'move'} />
				{:else}
					{@render movingMask?.()}
				{/if}
			</div>

			<div
				class="move-resize-mask"
				style:opacity={editingThisWidget && resizing ? '1' : '0'}
			>
				{#if useDefaultMoveMask}
					<MoveResizeMask type={'resize'} />
				{:else}
					{@render resizingMask?.()}
				{/if}
			</div>
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

	.move-resize-mask {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 100%;
		transition: opacity var(--tg-snapping-anim-time, 200ms) ease-in-out;
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
		background-color: var(--tg-snapping-hint-bg, gray);
		border-radius: var(--tg-widget-editing-border-radius, 10px 10px 3px 10px);
	}

	#snapping-hint.ease-snapping {
		transition-property: width, height, transform, opacity !important;
		transition-timing-function: ease-in-out;
		transition-duration: calc(var(--tg-snapping-anim-time, 200ms) / 2);
	}

	#widget-wrapper {
		box-sizing: border-box;
		transition: opacity var(--tg-snapping-anim-time, 200ms) ease-in-out;
		border-radius: var(--tg-widget-editing-border-radius, 10px 10px 3px 10px);
	}

	#widget-wrapper.editing {
		background-color: var(--tg-widget-editing-border-color, lightgray);
		overflow: auto;
		resize: both;
	}

	#widget-wrapper.ease-snapping {
		transition-property: width, height, transform, opacity !important;
		transition-timing-function: ease-in-out;
		transition-duration: var(--tg-snapping-anim-time, 200ms);
	}

	#widget-mask {
		z-index: 2;
		background-color: lightgray;
		opacity: 0.5;
	}

	#widget-frame {
		position: relative;
		border-radius: var(--tg-widget-border-radius, 5px);
		overflow: hidden;
	}

	button#delete-button {
		z-index: 3;
		background-color: var(--tg-delete-button-init-bg, pink);
		top: 0;
		right: 0;
		width: var(--tg-delete-button-size, 25px);
		aspect-ratio: 1 / 1;
		padding: 0;
		border: 2px solid var(--tg-widget-editing-border-color, lightgray);
		border-radius: var(--tg-delete-button-border-radius, 10px);
		outline: none;
		cursor: pointer;
		&:hover {
			background-color: var(--tg-delete-button-hover-bg, red);
		}
	}
</style>
