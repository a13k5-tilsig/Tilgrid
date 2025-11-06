<script lang="ts">
	import type { IWidget } from '../tilgridlib/types/widget';

	interface Props {
		widget: IWidget;
	}

	let { widget }: Props = $props();
</script>

<div style="width: 100%; height: 100%; background-color: red;">
	Component!<br />
	id: {widget.id}
	h: {widget.height}
</div>
