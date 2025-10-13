<script lang="ts">
	import { type IFuncs } from '$lib/tilgridlib/Tilgrid.svelte';
	import { type IWidget } from '$lib/tilgridlib/Widget.svelte';
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
		//
	}

	function updateWidgets() {
		//
	}

	/*
	 * functions to run along the default behaviour
	 * when a widget is added or deleted.
	 */
	const funcs: IFuncs = {
		add: function () {
			//
		},
		remove: function (id: Pick<IWidget, 'id'>) {
			//
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
