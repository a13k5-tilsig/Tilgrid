<script lang="ts">
	import type { IWidget, IFuncs } from '$lib/tilgridlib/types/widget';
	import Tilgrid from '$lib/tilgridlib/Tilgrid.svelte';

	let widgets: IWidget[] = $state([
		{
			id: 0,
			x: 0,
			y: 0,
			w: 200,
			h: 100
		},
		{
			id: 1,
			x: 200,
			y: 100,
			w: 200,
			h: 150
		}
	]);

	function fetchWidgets() {
		// For API GET
	}

	function updateWidgets() {
		// For API UPDATE
	}

	/**
	 * functions to run along the default behaviour
	 * when a widget is added or deleted.
	 *
	 * If these arent present; the corresponding buttons \
	 * won't be present either.
	 */
	const funcs: IFuncs = {
		add: function () {
			//
		},
		remove: function (widget: Pick<IWidget, 'id'>) {
			widgets = widgets.filter((w: IWidget) => w.id != widget.id);
		}
	};
</script>

<div
	style:background-color="lightgray"
	style:width="1000px"
	style:height="800px"
	style:margin="50px"
>
	<Tilgrid bind:widgets {funcs} />
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
	}
</style>
