<script lang="ts">
	import type { IWidget } from '../tilgridlib/types/widget.ts';

	interface Props {
		widget: IWidget;
	}

	let { widget }: Props = $props();
</script>

<div style="width: 100%; height: 100%; background-color: orange;">
	Component!<br />
	id: {widget.id}<br />
	h: {widget.h}
</div>
