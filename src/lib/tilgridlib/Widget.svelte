<script module lang="ts">
	export interface ICoordinates {
		x: number;
		y: number;
	}

	export interface ISize {
		w: number;
		h: number;
	}

	export interface IWidget extends ICoordinates, ISize {
		id: number;
	}

	export interface IFuncs {
		add?: () => void;
		remove?: (id: Pick<IWidget, 'id'>) => void;
		move?: (id: Pick<IWidget, 'id'>) => void;
		size?: (id: Pick<IWidget, 'id'>) => void;
	}
</script>

<script>
	import { type Snippet } from 'svelte';

	const SNAPP_EASE: string = '200ms ease';

	interface Props {
		spec: IWidget;
		moving?: boolean;
		resizing?: boolean;
		snappingArea: number;
		funcs?: IFuncs;
		children?: Snippet;
	}

	let {
		spec = $bindable(),
		moving = $bindable(false),
		resizing = $bindable(false),
		snappingArea,
		funcs,
		children
	}: Props = $props();

	let snappHint = $derived.by(() => {
		if (moving) {
			return {
				...fixedCoordinates({ x: spec.x, y: spec.y }),
				w: spec.w,
				h: spec.h
			};
		} else if (resizing) {
			return {
				...fixedSizing({ w: spec.w, h: spec.h }),
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

	let cursorElemAnchor: ICoordinates = $state({ x: 0, y: 0 });
	let snappThreshold: number = $derived(snappingArea / 2);

	/**
	 * Round an axis position up to its closest snapping-area.
	 */
	const roundUp = (prop: 'x' | 'y' | 'w' | 'h'): number =>
		Math.ceil(spec[prop] / snappingArea) * snappingArea;

	/**
	 * Round an axis position down to its closest snapping-area.
	 */
	const roundDown = (prop: 'x' | 'y' | 'w' | 'h'): number =>
		Math.floor(spec[prop] / snappingArea) * snappingArea;

	/**
	 * Fix the coordinates of the widget to match the snapping-area.
	 */
	const fixedCoordinates = (coords: ICoordinates): ICoordinates => ({
		x: coords.x % snappingArea > snappThreshold ? roundUp('x') : roundDown('x'),
		y: coords.y % snappingArea > snappThreshold ? roundUp('y') : roundDown('y')
	});

	const fixedSizing = (size: ISize): ISize => ({
		w: size.w % snappingArea > snappThreshold ? roundUp('w') : roundDown('w'),
		h: size.h % snappingArea > snappThreshold ? roundUp('h') : roundDown('h')
	});

	function handleMouseDownMove(event: MouseEvent) {
		event.preventDefault();
		moving = true;
		cursorElemAnchor.x = event.offsetX;
		cursorElemAnchor.y = event.offsetY;
	}

	function handleMouseUpMove(event: MouseEvent): void {
		event.preventDefault();
		moving = false;
		let fixed = fixedCoordinates({ x: spec.x, y: spec.y });
		spec.x = fixed.x;
		spec.y = fixed.y;
	}

	function handleMouseMoveMove(event: MouseEvent): void {
		event.preventDefault();
		if (!moving) return;
		spec.x -= cursorElemAnchor.x - event.offsetX;
		spec.y -= cursorElemAnchor.y - event.offsetY;
	}

	function handleMouseLeaveMove(event: MouseEvent): void {
		event.preventDefault();
		/*
		 * BUG: Fast movement ending in the cursor leaving the widget-position
		 * incomplete making the widget "freeze" in time. Should fix.
		 */
		moving = false;
	}

	function handleMouseDownResize(event: MouseEvent) {
		resizing = true;
	}

	function handleMouseUpResize(event: MouseEvent) {
		spec.w = snappHint.w;
		spec.h = snappHint.h;
		resizing = false;
	}
</script>

{#if moving || resizing}
	<div
		class="snapp-hint ease-snapp"
		style:opacity={moving || resizing ? '0.5' : '1'}
		style:width="{snappHint.w}px"
		style:height="{snappHint.h}px"
		style="
			--snapp-hint-x-pos: {snappHint.x}px;
			--snapp-hint-y-pos: {snappHint.y}px;
			--transition: transform {SNAPP_EASE},
				width {SNAPP_EASE},
				height {SNAPP_EASE};
		"
	></div>
{/if}

<div
	role="none"
	bind:clientWidth={spec.w}
	bind:clientHeight={spec.h}
	class="widget-wrapper"
	class:ease-snapp={!moving}
	style:opacity={moving || resizing ? '0.5' : '1'}
	style:width="{spec.w}px"
	style:height="{spec.h}px"
	style="
		--x-pos: {spec.x}px;
		--y-pos: {spec.y}px;
		--transition: transform {SNAPP_EASE};
	"
	onmousedown={handleMouseDownResize}
	onmouseup={handleMouseUpResize}
>
	<div
		role="none"
		class="widget"
		style:cursor={moving ? 'grabbing' : 'grab'}
		onmousedown={handleMouseDownMove}
		onmouseup={handleMouseUpMove}
		onmousemove={handleMouseMoveMove}
		onmouseleave={handleMouseLeaveMove}
	>
		{@render children?.()}
	</div>
</div>

<style>
	.widget-wrapper,
	.snapp-hint {
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

	.snapp-hint {
		transform: translateX(var(--snapp-hint-x-pos))
			translateY(var(--snapp-hint-y-pos));
		background-color: #443443;
	}

	.ease-snapp {
		transition: var(--transition);
	}
</style>
