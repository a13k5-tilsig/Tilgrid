<script lang="ts">
	import { findAvailablePosition } from '$lib/tilgridlib/util/widget';
	import type { IWidget, IFuncs, ISize } from '$lib/tilgridlib/types/widget';
	import Tilgrid from '$lib/tilgridlib/Tilgrid.svelte';

	let widgets: IWidget[] = $state([
		{
			id: crypto.randomUUID(),
			x: 0,
			y: 0,
			w: 200,
			h: 100
		},
		{
			id: crypto.randomUUID(),
			x: 200,
			y: 100,
			w: 200,
			h: 150
		}
	]);

	/**
	 * functions to run along the default behaviour
	 * when a widget is added or deleted.
	 *
	 * If these arent present; the corresponding buttons \
	 * won't be present either.
	 */
	const funcs: IFuncs = {
		remove: function (widget: Pick<IWidget, 'id'>) {
			widgets = widgets.filter((w: IWidget) => w.id != widget.id);
		}
	};

	const snappingArea = 50;
	const widgetInitialSize: ISize = { w: 400, h: 300 };

	let container = $state<HTMLDivElement>();

	function addNewWidget() {
		let newPos = findAvailablePosition(
			{
				w: container!.clientWidth,
				h: container!.clientHeight
			},
			snappingArea,
			{
				w: 400,
				h: 300
			},
			widgets
		);

		widgets.push({
			id: crypto.randomUUID(),
			x: newPos.x,
			y: newPos.y,
			w: widgetInitialSize.w,
			h: widgetInitialSize.h
		});
	}
</script>

<button onclick={addNewWidget}>add</button>

<div style:background-color="lightgray" style:width="100%" style:height="100%">
	<Tilgrid
		bind:container
		bind:widgets
		editing={false}
		{funcs}
		snappingArea={50}
	/>
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
	}
</style>
