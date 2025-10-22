<script lang="ts">
	import type { IWidget } from './types/widget';

	let { id, width, height, x, y }: IWidget = $props();
</script>

<div id="placeholder" class="center-content">
	<div style:font-family="Arial, Helvetica, sans-serif">
		<h4>
			If you see this,
			<br />
			there is no widget.
		</h4>
		<br />
		ID:
		<span style:float="right" style:margin-left="10px">
			{id}
		</span>
		<br />
		Width:
		<span style:float="right" style:margin-left="10px">
			{width}px
		</span>
		<br />
		Height:
		<span style:float="right" style:margin-left="10px">
			{height}px
		</span>
		<br />
		Position from top:
		<span style:float="right" style:margin-left="10px">
			{y}px
		</span>
		<br />
		Position from left:
		<span style:float="right" style:margin-left="10px">
			{x}px
		</span>
	</div>
</div>

<style>
	.center-content {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	div#placeholder {
		width: 100%;
		height: 100%;
	}

	div#placeholder h4 {
		margin: 0;
		padding: 0;
		text-align: center;
	}
</style>
