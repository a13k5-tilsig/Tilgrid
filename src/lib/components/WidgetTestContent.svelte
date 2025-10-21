<script lang="ts">
	import { onMount } from 'svelte';
	import type { IWidget } from './types/widget';

	interface Props {
		widget: IWidget;
	}

	let { widget }: Props = $props();
</script>

<div style="width: 100%; height: 100%; background-color: orange;">
	Component!<br />
	id: {widget.id}
	h: {widget.h}
</div>
