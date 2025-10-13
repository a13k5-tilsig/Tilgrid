<script module lang="ts">
	export interface IWidget {
		id: number;
		x: number;
		y: number;
		w: number;
		h: number;
	}
</script>

<script>
	import { type Snippet } from 'svelte';

	interface Props {
		spec: IWidget;
		moving?: boolean;
		snappingArea?: number;
		funcs?: () => void;
		children?: Snippet;
	}

	let {
		spec = $bindable(),
		moving = $bindable(false),
		snappingArea,
		funcs,
		children
	}: Props = $props();

	let ghost = $derived({
		x: spec.x,
		y: spec.y,
		w: spec.w,
		h: spec.h
	});

	interface ICoordinates {
		x: number;
		y: number;
	}

	function ghostMoveSnapping() {
		/*
		 * Figure out how to snapp the ghost to the area when moving.
		 *
		 *	- Find the threshold of when then ghost will actully snapp:
		 *		+ Find when the widget passes 50% of the thresshold before snapping to the new suggested position.
		 *		+ (Initial position - current position) > (snappingArea / 2) == snapp to new position!
		 *			+ Find what number is bigger and reduce the smallest in order to get the appropiate snapping direction.
		 *				+ When this operation is ran, we can see in what direction the widget is moved and account that when snapping the ghost.
		 *			+ Account for big positional changes so that the snapp doesnt move a single area, but relative to the widgets current area.
		 */
	}

	let elem = $state<HTMLElement>();
	let cursorElemAnchor = $state<ICoordinates>({ x: 0, y: 0 });

	function handleMouseDown(event: MouseEvent) {
		event.preventDefault();
		moving = true;
		cursorElemAnchor.x = event.offsetX;
		cursorElemAnchor.y = event.offsetY;
	}

	function handleMouseUp(event: MouseEvent) {
		event.preventDefault();
		moving = false;
	}

	function handleMouseMove(event: MouseEvent) {
		event.preventDefault();
		if (!moving) return;
		spec.x -= cursorElemAnchor.x - event.offsetX;
		spec.y -= cursorElemAnchor.y - event.offsetY;
	}

	function handleMouseLeave(event: MouseEvent) {
		event.preventDefault();
		moving = false;
	}
</script>

<div
	class="ghost"
	style:width="{ghost.w}px"
	style:height="{ghost.h}px"
	style="--ghost-x-pos: {ghost.x}px; --ghost-y-pos: {ghost.y}px;"
></div>

<div
	bind:this={elem}
	role="none"
	class="widget"
	style:width="{spec.w}px"
	style:height="{spec.h}px"
	style:cursor={moving ? 'grabbing' : 'grab'}
	style="--x-pos: {spec.x}px; --y-pos: {spec.y}px;"
	onmousedown={handleMouseDown}
	onmouseup={handleMouseUp}
	onmousemove={handleMouseMove}
	onmouseleave={handleMouseLeave}
>
	{@render children?.()}
</div>

<style>
	.widget,
	.ghost {
		position: absolute;
	}

	.widget {
		transform: translateX(var(--x-pos)) translateY(var(--y-pos));
		background-color: white;
	}

	.ghost {
		transform: translateX(var(--ghost-x-pos)) translateY(var(--ghost-y-pos));
		opacity: 0.4;
		background-color: #443443;
		transition: transform 0.4s;
	}
</style>
