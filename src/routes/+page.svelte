<script lang="ts">
	import type { ISize, IWidget } from '$lib/tilgridlib/types/widget';
	import type { IContainerConfig } from '$lib/tilgridlib/types/config';
	import { findAvailablePosition } from '$lib/tilgridlib/util/matrix';
	import Tilgrid from '$lib/tilgridlib/Tilgrid.svelte';
	import WidgetTestContent from '$lib/components/WidgetTestContent.svelte';

	let containerSize: ISize = $state({ width: 0, height: 0 });

	let widgets: IWidget[] = $state([
		{
			id: crypto.randomUUID(),
			x: 0,
			y: 0,
			width: 200,
			height: 100,
			config: ''
		},
		{
			id: crypto.randomUUID(),
			x: 200,
			y: 100,
			width: 200,
			height: 150,
			config: ''
		}
	]);

	const config: IContainerConfig = $state({
		editing: true,
		snappingArea: 50,
		useDefaultResizeMask: true,
		useDefaultMoveMask: true,
		snappingAnimTime: 200,
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
			id: crypto.randomUUID(),
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

<div id="tilgrid">
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
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
	}

	#tilgrid {
		width: 70%;
		height: 70%;
		margin: auto;
	}
</style>
