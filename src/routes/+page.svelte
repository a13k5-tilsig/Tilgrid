<script lang="ts">
	import type { ITilgridConfig } from '$lib/tilgridlib/types/config';
	import type { ISize, IWidget } from '$lib/tilgridlib/types/widget';
	import { findAvailablePosition } from '$lib/tilgridlib/util/widget';
	import Tilgrid from '$lib/tilgridlib/Tilgrid.svelte';
	import WidgetTestContent from '$lib/components/WidgetTestContent.svelte';

	let containerSize: ISize = $state({ w: 0, h: 0 });

	let widgets: IWidget[] = $state([
		{
			id: 'some_random_id_01',
			x: 0,
			y: 0,
			w: 200,
			h: 100,
			config: ''
		},
		{
			id: 'some_random_id_02',
			x: 200,
			y: 100,
			w: 200,
			h: 150,
			config: ''
		}
	]);

	// TODO: Make this prettier........
	const config: ITilgridConfig = $state({
		width: '100%',
		height: '100%',
		editing: false,
		snappingArea: 50,
		snappingAnimTime: 200,
		horizontallyDynamic: false,
		widgetSpace: 10,
		funcs: {
			remove: function (widget: { id: string }) {
				widgets = widgets.filter((w: IWidget) => w.id != widget.id);
			}
		}
	});

	function addNewWidget() {
		let newPos = findAvailablePosition(
			{ w: containerSize.w, h: containerSize.h },
			{ w: 400, h: 300 },
			config.snappingArea!,
			widgets
		);

		widgets.push({
			...newPos,
			id: 'some_random_id_03',
			w: 400,
			h: 300,
			config: ''
		});
	}
</script>

<button onclick={addNewWidget}>add</button>
<button onclick={() => (config.editing = !config.editing)}>
	editing: {config.editing ? 'on' : 'off'}
</button>

<div
	style:background-color="lightgray"
	style:width="70%"
	style:height="70%"
	style:margin="auto"
>
	<!-- This is the main component. -->
	<Tilgrid bind:containerSize bind:widgets {...config}>
		{#snippet widget(widget: IWidget)}
			<!-- Users's component, either as an expression or a component
			that conditionally renders it's own widget content. -->
			<WidgetTestContent {widget} />
		{/snippet}
	</Tilgrid>
	<!-- This is the main component. -->
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
	}
</style>
