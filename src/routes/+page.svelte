<script lang="ts">
	import type { ITilgridConfig } from '$lib/tilgridlib/types/config';
	import type { IWidget } from '$lib/tilgridlib/types/widget';
	import { findAvailablePosition } from '$lib/tilgridlib/util/widget';
	import Tilgrid from '$lib/tilgridlib/Tilgrid.svelte';
	import WidgetTestContent from '$lib/components/WidgetTestContent.svelte';

	let container = $state<HTMLDivElement>();

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

	const config: ITilgridConfig = $state({
		width: '100%',
		height: '100%',
		editing: false,
		snappingArea: 50,
		snappingAnimTime: 200,
		verticallyDynamic: false,
		widgetInitialSize: { w: 300, h: 400 },
		widgetSpace: 10,
		funcs: {
			remove: function (widget: Pick<IWidget, 'id'>) {
				widgets = widgets.filter((w: IWidget) => w.id != widget.id);
			}
		}
	});

	function addNewWidget() {
		let newPos = findAvailablePosition(
			{ w: container!.clientWidth, h: container!.clientHeight },
			{ w: 400, h: 300 },
			config.snappingArea!,
			widgets
		);

		widgets.push({
			...config.widgetInitialSize!,
			...newPos,
			id: 'some_random_id_03',
			config: ''
		});
	}
</script>

<button onclick={addNewWidget}>add</button>
<button onclick={() => (config.editing = !config.editing)}>
	editing: {config.editing ? 'on' : 'off'}
</button>

<div style:background-color="lightgray" style:width="100%" style:height="100%">
	<Tilgrid bind:container bind:widgets {...config}>
		{#snippet widget(widget: IWidget)}
			<WidgetTestContent {widget} />
		{/snippet}
	</Tilgrid>
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
	}
</style>
