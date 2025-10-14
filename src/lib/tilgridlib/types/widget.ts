export interface IPosition {
	x: number;
	y: number;
}

export interface ISize {
	w: number;
	h: number;
}

export interface IWidget extends IPosition, ISize {
	id: number;
}

export interface IFuncs {
	add?: () => void;
	remove?: (id: Pick<IWidget, 'id'>) => void;
	move?: (id: Pick<IWidget, 'id'>) => void;
	size?: (id: Pick<IWidget, 'id'>) => void;
}
