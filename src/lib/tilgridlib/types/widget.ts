export interface IPosition {
	x: number;
	y: number;
}

export interface ISize {
	w: number;
	h: number;
}

/**
 * @config? - Widget-spesiffic config. Parsed / deserialized in YOUR widget component.
 */
export interface IWidget extends IPosition, ISize {
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
	add?: () => void;
	remove?: (id: Pick<IWidget, 'id'>) => void;
	move?: (id: Pick<IWidget, 'id'>) => void;
	size?: (id: Pick<IWidget, 'id'>) => void;
}
