export interface IPosition {
	x: number;
	y: number;
}

export interface ISize {
	width: number;
	height: number;
}

export type ISpec = ISize & IPosition;

/**
 * @config? - Widget-spesiffic config. Parsed / deserialized in YOUR widget component.
 */
export interface IWidget extends ISpec {
	id: string;
	config?: string;
}

/**
 * add? - Runs after a widget is added to the container.
 * remove? - Runs after a widget is removed from the container.
 * move? - Runs after a widget is moved inside the container.
 * size? - Runs after a widget is resized inside the container.
 */
export interface IFuncs {
	onWidgetAdd?: (id?: string) => void;
	onWidgetRemove?: (id?: string) => void;
	onWidgetMove?: (id?: string) => void;
	onWidgetResize?: (id?: string) => void;
}
