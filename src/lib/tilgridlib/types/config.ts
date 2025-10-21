import type { IWidget, ISize, IFuncs } from './widget';
import type { Snippet } from 'svelte';

export interface ITilgridConfig {
	// CSS width size (default: 100%).
	width?: string;

	// CSS height size (default: 100%).
	height?: string;

	// Is the container in 'editing' mode?
	editing?: boolean;

	// The matrix grid-cell size, wich will be used for aligning the widgets (px).
	snappingArea?: number;

	// The time a 'snapping' transition-animation will take (ms).
	snappingAnimTime?: number;

	// Should the container dynamically resize its children when the
	// container shirinks / grows horizontally (i.e window-resizing)?
	horizontallyDynamic?: boolean;

	// How much space to add between each widget (widget-wrapper padding) (px)?
	widgetSpace?: number;

	// You custom functions to run after certain events.
	funcs?: IFuncs;
}

export interface IWidgetConfig
	extends Pick<
		ITilgridConfig,
		'snappingArea' | 'snappingAnimTime' | 'editing' | 'widgetSpace' | 'funcs'
	> {
	// The id, position (x, y) and size (w, h) of a single widget.
	spec: IWidget;

	// (bound property) Is the widgets being moved?
	moving: boolean;

	// (bound property) Is the widgets being resized?
	resizing: boolean;

	// The size (w, h) of the container the widget resides (for some math).
	containerSize: ISize;

	// The content the widget will render.
	children?: Snippet;
}
