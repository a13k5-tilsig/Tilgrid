<script lang="ts">
	import type { IContainerConfig } from '$lib/tilgridlib/types/config';
	import type { ISize, IWidget } from '$lib/tilgridlib/types/widget';
	import { findAvailablePosition } from '$lib/tilgridlib/util/widget';
	import Tilgrid from '$lib/tilgridlib/Tilgrid.svelte';
	import WidgetTestContent from '$lib/components/WidgetTestContent.svelte';

	let containerSize: ISize = $state({ width: 0, height: 0 });

	let widgets: IWidget[] = $state([
		{
			id: 'some_random_id_01',
			x: 0,
			y: 0,
			width: 200,
			height: 100,
			config: ''
		},
		{
			id: 'some_random_id_02',
			x: 200,
			y: 100,
			width: 200,
			height: 150,
			config: ''
		}
	]);

	const config: IContainerConfig = $state({
		width: '100%',
		height: '100%',
		editing: false,
		snappingArea: 50,
		snappingAnimTime: 200,
		horizontallyDynamic: false,
		widgetSpace: 10,
		funcs: {
			onWidgetRemove: function (id?: string) {
				widgets = widgets.filter((w: IWidget) => w.id != id);
			}
		}
	});

	function addNewWidget() {
		let newPos = findAvailablePosition(
			{ width: containerSize.width, height: containerSize.height },
			{ width: 400, height: 300 },
			config.snappingArea!,
			widgets
		);

		widgets.push({
			...newPos,
			id: 'some_random_id_03',
			width: 400,
			height: 300,
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
	<Tilgrid bind:containerSize bind:widgets {...config}>
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
