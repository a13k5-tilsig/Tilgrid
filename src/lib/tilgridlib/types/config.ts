import type { IWidget, ISize, IFuncs } from './widget';
import type { Snippet } from 'svelte';

export interface IContainerConfig {
	// Is the container in 'editing' mode?
	editing?: boolean;

	// The matrix grid-cell size, wich will be used for aligning the widgets (px).
	snappingArea?: number;

	// Should dots show at snappable areas?
	hints?: boolean;

	// Should the container where the widgets are snappable be centered in the main container?
	centerSnappableLimit?: boolean;

	// How much space to add between each widget (widget-wrapper padding) (px)?
	widgetSpace?: number;

	// Should the container stretch vertically?
	verticallyDynamic?: boolean;

	// Should the container stretch horizontally?
	horizontallyDynamic?: boolean;

	// Use the provided moving mask?
	useDefaultMoveMask?: boolean;

	// Use the provided resizing mask?
	useDefaultResizeMask?: boolean;

	// Mask the widget content while the widget is moving.
	movingMask?: Snippet;

	// Mask the widget content while the widget is resizing.
	resizingMask?: Snippet;

	// You custom functions to run after certain events.
	funcs?: IFuncs;
}

export interface IWidgetConfig
	extends Pick<
		IContainerConfig,
		| 'snappingArea'
		| 'editing'
		| 'widgetSpace'
		| 'funcs'
		| 'movingMask'
		| 'resizingMask'
		| 'useDefaultMoveMask'
		| 'useDefaultResizeMask'
	> {
	// The id, position (x, y) and size (w, h) of a single widget.
	widget: IWidget;

	// (bound property) Is the widgets being moved?
	moving: boolean;

	// (bound property) Is the widgets being resized?
	resizing: boolean;

	// The size (w, h) of the container the widget resides (for some math).
	containerSize: ISize;

	// The content the widget will render.
	children?: Snippet;
}
