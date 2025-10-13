<script module lang="ts">
	export interface ICoordinates {
		x: number;
		y: number;
	}

	export interface IWidget extends ICoordinates {
		id: number;
		w: number;
		h: number;
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

	const SNAPP_EASE: string = '100ms';

	interface Props {
		spec: IWidget;
		moving?: boolean;
		snappingArea: number;
		funcs?: IFuncs;
		children?: Snippet;
	}

	let {
		spec = $bindable(),
		moving = $bindable(false),
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
	const roundUp = (axis: 'x' | 'y'): number =>
		Math.ceil(spec[axis] / snappingArea) * snappingArea;

	/**
	 * Round an axis position down to its closest snapping-area.
	 */
	const roundDown = (axis: 'x' | 'y'): number =>
		Math.floor(spec[axis] / snappingArea) * snappingArea;

	/**
	 * Fix the coordinates of the widget to match the snapping-area.
	 */
	const fixedCoordinates = (coords: ICoordinates): ICoordinates => ({
		x: coords.x % snappingArea > snappThreshold ? roundUp('x') : roundDown('x'),
		y: coords.y % snappingArea > snappThreshold ? roundUp('y') : roundDown('y')
	});

	function handleMouseDown(event: MouseEvent) {
		event.preventDefault();
		moving = true;
		cursorElemAnchor.x = event.offsetX;
		cursorElemAnchor.y = event.offsetY;
	}

	function handleMouseUp(event: MouseEvent): void {
		event.preventDefault();
		moving = false;
		let fixed = fixedCoordinates({ x: spec.x, y: spec.y });
		spec.x = fixed.x;
		spec.y = fixed.y;
	}

	function handleMouseMove(event: MouseEvent): void {
		event.preventDefault();
		if (!moving) return;
		spec.x -= cursorElemAnchor.x - event.offsetX;
		spec.y -= cursorElemAnchor.y - event.offsetY;
	}

	function handleMouseLeave(event: MouseEvent): void {
		event.preventDefault();
		/*
		 * BUG: Fast movement ending in the cursor leaving the widget-position
		 * incomplete making the widget "freeze" in time. Should fix.
		 */
		moving = false;
	}
</script>

<div
	class="snapp-hint ease-snapp"
	style:width="{snappHint.w}px"
	style:height="{snappHint.h}px"
	style="
		--snapp-hint-x-pos: {snappHint.x}px;
		--snapp-hint-y-pos: {snappHint.y}px;
		--transition: transform {SNAPP_EASE};
	"
></div>

<div
	role="none"
	class="widget"
	class:ease-snapp={!moving}
	style:width="{spec.w}px"
	style:height="{spec.h}px"
	style:cursor={moving ? 'grabbing' : 'grab'}
	style="
		--x-pos: {spec.x}px;
		--y-pos: {spec.y}px;
		--transition: transform {SNAPP_EASE}
	"
	onmousedown={handleMouseDown}
	onmouseup={handleMouseUp}
	onmousemove={handleMouseMove}
	onmouseleave={handleMouseLeave}
>
	{@render children?.()}
</div>

<style>
	.widget,
	.snapp-hint {
		position: absolute;
	}

	.widget {
		transform: translateX(var(--x-pos)) translateY(var(--y-pos));
		background-color: white;
	}

	.snapp-hint {
		transform: translateX(var(--snapp-hint-x-pos))
			translateY(var(--snapp-hint-y-pos));
		opacity: 0.4;
		background-color: #443443;
	}

	.ease-snapp {
		transition: var(--transition);
	}
</style>
