import type { IWidget, ISize, IFuncs } from './widget';
import type { Snippet } from 'svelte';

export interface ITilgridConfig {
	width?: string; // css size (ex: 100%).
	height?: string; // css size (ex: 100%).
	editing?: boolean;
	snappingArea?: number;
	snappingAnimTime?: number;
	verticallyDynamic?: boolean;
	widgetInitialSize?: ISize;
	widgetSpace?: number;
	funcs?: IFuncs;
}

export interface IWidgetConfig
	extends Pick<
		ITilgridConfig,
		'snappingArea' | 'snappingAnimTime' | 'editing' | 'widgetSpace' | 'funcs'
	> {
	spec: IWidget;
	moving: boolean;
	resizing: boolean;
	children?: Snippet;
}
