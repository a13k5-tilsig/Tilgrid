import type { IPosition, ISize, IWidget } from '../types/widget.ts';

type IWidgetMap = Record<string, number[][]>;
type IWidgetIdMatrix = (number | string)[][];

interface IWidgetMatrixCollision {
	collidingId: string | null;
	matrix: IWidgetIdMatrix;
}

/**
 * Round a number up or down against another number
 * based on what's closer.
 *
 * @param num - The number to round.
 * @param round - The number to be rounded against.
 * @returns The closest rounded number.
 * @example
 * ```typescript
 * const result = roundToClosest(122, 5);
 * console.log(result); // 120;
 * ```
 */
export function roundToClosest(num: number, round: number) {
	return num % round > round / 2
		? Math.ceil(num / round) * round
		: Math.floor(num / round) * round;
}

/**
 * Convert a given amount of pixels into its value in matrix cells.
 *
 * @param pixels - How many pixels to convert.
 * @param matrixBlockSize - The size (in pixels) of a matrix cell.
 * @returns (floored(pixels / matrixCellSize)).
 */
function fromPxToMatrixCells(pixels: number, matrixCellSize: number): number {
	return Math.floor(pixels / matrixCellSize);
}

/**
 * Convert a given amount of matrix cells into its value in pixels.
 *
 * @param cells - How many cells to convert.
 * @param matrixCellSize - The size (in pixels) of a matrix cell.
 * @returns (cells * matrixCellSize).
 */
function fromMatrixCellsToPx(cells: number, matrixCellSize: number): number {
	return cells * matrixCellSize;
}

/**
 * Returns a matrix with cells containing zeroes matching the given dimensions.
 *
 * @param rows - Amount of rows (vertical cells).
 * @param columns - Amount of collumns (horizontal cells).
 * @returns \[\[some, amount, of, zeroes\], \[some, amount, of, zeroes\], ...\]
 */
function makeMatrix(rows: number, columns: number): number[][] {
	let _rows: number[][] = [];
	for (let row = 0; row < rows; row++) {
		let _columns: number[] = [];
		for (let col = 0; col < columns; col++) {
			_columns.push(0);
		}
		_rows.push(_columns);
	}
	return _rows;
}

/**
 * Places a given value, or "1" (if unset) in occupied matrix cells.
 *
 * @param matrix - A 2D array representing rows and columns.
 * @param items - A 2D array where index\[0\] represents a row and index\[1\] represents a column.
 * @returns example: \[\[1, 1, 1, 0, 0, 0\], \[1, 1, 1, 0, 0, 0\]\].
 */
function fillOccupiedMatrixCells(
	matrix: number[][],
	cellCoordinates: any[][],
	filler: any = 1,
): number[][] {
	let _matrix: number[][] = [...matrix];
	cellCoordinates.forEach((n: number[]) => {
		_matrix[n[0]][n[1]] = filler;
	});
	return _matrix;
}

/**
 * Returns a 2D array with the coordinates of the matrix cells
 * a array of widgets occupy.
 *
 * @param widgets - A array of widgets.
 * @param matrixCellSize - The size of a cell in the relevant matrix.
 * @returns \[\[X, Y\], \[X, Y\]\]
 */
function getMatrixCellCoordinatesFromWidgets(
	widgets: IWidget[],
	matrixCellSize: number,
): number[][] {
	let occupiedMatrixCells: number[][] = [];
	widgets.forEach((w: IWidget) => {
		let widgetMatrixCellHeight = fromPxToMatrixCells(w.height, matrixCellSize);
		let widgetMatrixCellWidth = fromPxToMatrixCells(w.width, matrixCellSize);
		let widgetMatrixPositionFromTop = fromPxToMatrixCells(w.y, matrixCellSize);
		let widgetMatrixPositionFromLeft = fromPxToMatrixCells(w.x, matrixCellSize);

		for (let h = 0; h < widgetMatrixCellHeight; h++) {
			for (let w = 0; w < widgetMatrixCellWidth; w++) {
				occupiedMatrixCells.push([
					widgetMatrixPositionFromTop + h,
					widgetMatrixPositionFromLeft + w,
				]);
			}
		}
	});
	return occupiedMatrixCells;
}

/**
 *
 * TODO:
 * Wrap this inside a static class instead? kinda chunky.
 *
 * Finds space for a new widget in between all other widgets.
 * This is to avoid widgets shifting position in order
 * to make room for the new widget at position 0.0.
 *
 * Returns position in the matrix where the widget can be positioned.
 *
 * @param containerSize - The size of the container for the widgets.
 * @param snappingArea - The size (in pixels) of snappable areas for widgets.
 * @param widgetSize - The size of the widget to locate a position for.
 * @param widgets - A array of wigets to use to find occuppied cells.
 * @returns { x: number, y: number }
 */
export function findAvailablePosition(
	containerSize: ISize,
	widgetSize: ISize,
	snappingArea: number,
	widgets: IWidget[],
): IPosition {
	const containerMatrix = makeMatrix(
		fromPxToMatrixCells(containerSize.height, snappingArea),
		fromPxToMatrixCells(containerSize.width, snappingArea),
	);

	const widgetMatrix = makeMatrix(
		fromPxToMatrixCells(widgetSize.height, snappingArea),
		fromPxToMatrixCells(widgetSize.width, snappingArea),
	);

	// To be used for finding matching matrix in the container matrix.
	const widgetMatrixStringified = JSON.stringify(widgetMatrix);

	const occupiedMatrixCellCoordinates = getMatrixCellCoordinatesFromWidgets(
		widgets,
		snappingArea,
	);

	const filledMatrix = fillOccupiedMatrixCells(
		containerMatrix,
		occupiedMatrixCellCoordinates,
	);

	const windowHeight = widgetMatrix.length;
	const windowWidth = widgetMatrix[0].length;
	const targetHeight = filledMatrix.length - windowHeight;
	const targetWidth = filledMatrix[0].length - windowWidth;

	// Target height.
	for (let th = 0; th <= targetHeight; th++) {
		// Target width.
		for (let tw = 0; tw <= targetWidth; tw++) {
			let window: number[][] = [];

			// Window height, slicing for window width.
			for (let wh = 0; wh < windowHeight; wh++) {
				window.push(filledMatrix[th + wh].slice(tw, tw + windowWidth));
			}

			if (JSON.stringify(window) === widgetMatrixStringified) {
				return {
					x: fromMatrixCellsToPx(tw, snappingArea),
					y: fromMatrixCellsToPx(th, snappingArea),
				};
			}
		}
	}

	/**
	 * If no viable position is found (the matrix may be full);
	 *
	 * NOTE: Perhaps account for vertically dynamic containers?
	 */
	return { x: -1, y: -1 };
}

/**
 * Sort a given IWidget array by their position in the matrix.
 *
 * @param widgets - The array of widgets you want sorted.
 * @returns the widgets sorted by; the highest, left-most first.
 */
function sortMatrixWidgetsByPosition(widgets: IWidget[]): IWidget[] {
	return widgets.toSorted((a: IWidget, b: IWidget) => {
		if (a.y === b.y) {
			// Compare the X axis if they are on the same Y axis.
			return a.x < b.x ? -1 : 1;
		} else {
			// Compare the Y axis if they are not on the same Y axis.
			return a.y < b.y ? -1 : 1;
		}
	});
}

/**
 * Places the ID of a widget in the cells that widget occupies.
 * It also discovers the first (heighest) colliding widget.
 *
 * @param matrix - A 2D array representing rows and columns.
 * @param widgetMap - An object where the keys are widget IDs and the values are the cells that widget occupies, where index\[0\] represents a row and index\[1\] represents a column.
 */
function fillOccupiedMatrixCellsWithWidgetId(
	matrix: number[][],
	widgetMap: IWidgetMap,
): IWidgetMatrixCollision {
	let _matrix: IWidgetMatrixCollision = {
		collidingId: null,
		matrix: [...matrix],
	};
	Object.entries(widgetMap).forEach(([id, coordinates]) => {
		coordinates.forEach((c: number[]) => {
			if (_matrix.matrix[c[0]][c[1]] !== 0 && _matrix.collidingId === null) {
				_matrix.collidingId = id;
			}
			_matrix.matrix[c[0]][c[1]] = id;
		});
	});

	return _matrix;
}

/**
 * Creates an object with the widgets IDs as keys and the coordinates of the
 * widgets as their values.
 *
 * @param widgets - A array of widgets.
 * @param matrixCellSize - The size of a cell in the relevant matrix.
 * @returns \{ "id_1": \[\[X, Y\]\], "id_2": \[\[X, Y\]\] \}
 */
function getMappedMatrixCellCoordinatesFromWidgets(
	widgets: IWidget[],
	matrixCellSize: number,
): IWidgetMap {
	let occupiedMatrixCellsMap: IWidgetMap = {};
	widgets.forEach((w: IWidget) => {
		let widgetMatrixCellHeight = fromPxToMatrixCells(w.height, matrixCellSize);
		let widgetMatrixCellWidth = fromPxToMatrixCells(w.width, matrixCellSize);
		let widgetMatrixPositionFromTop = fromPxToMatrixCells(w.y, matrixCellSize);
		let widgetMatrixPositionFromLeft = fromPxToMatrixCells(w.x, matrixCellSize);

		for (let h = 0; h < widgetMatrixCellHeight; h++) {
			for (let wi = 0; wi < widgetMatrixCellWidth; wi++) {
				if (occupiedMatrixCellsMap[w.id] == undefined) {
					occupiedMatrixCellsMap[w.id] = [];
				}
				occupiedMatrixCellsMap[w.id].push([
					widgetMatrixPositionFromTop + h,
					widgetMatrixPositionFromLeft + wi,
				]);
			}
		}
	});

	return occupiedMatrixCellsMap;
}

export class ShiftWidgets {
	_movingWidget: IWidget;
	_suggestedPos: IPosition;
	_sortedWidgets: IWidget[];
	_containerSize: ISize;
	_matrixCellSize: number;

	_widgetsToShift: IWidget[]; // Widgets that will shift.
	_widgetsToKeep: IWidget[]; // Widgets that will not shift.
	_matrixKeepAndMoving: number[][]; // Matrix with only the widgets to keep and the moving widget.

	static matrix: number[][] | undefined = undefined;
	static matrixStringified: string | undefined = undefined;
	static matrixWithOccupiedCells: (number | string)[][] | undefined = undefined;
	static movingWidgetSuggestedPosition: IPosition | undefined = undefined;

	static sortedWidgetsByPosition: IWidget[] | undefined = undefined;

	constructor(
		movingWidget: IWidget,
		suggestedPos: IPosition,
		widgets: IWidget[],
		containerSize: ISize,
		matrixCellSize: number,
	) {
		this._movingWidget = movingWidget;
		this._suggestedPos = suggestedPos;
		this._sortedWidgets = sortMatrixWidgetsByPosition(widgets);
		this._containerSize = containerSize;
		this._matrixCellSize = matrixCellSize;

		this._widgetsToShift = [];
		this._widgetsToKeep = [];
		this._matrixKeepAndMoving = [];

		const _movingWidgetSuggestedPosition = {
			x: suggestedPos.x,
			y: suggestedPos.y,
		};
		const _matrix = makeMatrix(
			fromPxToMatrixCells(containerSize.width, matrixCellSize),
			fromPxToMatrixCells(containerSize.height, matrixCellSize),
		);
		const _matrixStringified = JSON.stringify(_matrix);
		const _occupiedCellsCoordinates = getMappedMatrixCellCoordinatesFromWidgets(
			widgets,
			matrixCellSize,
		);
		const _occupiedMatrixCells = fillOccupiedMatrixCellsWithWidgetId(
			_matrix,
			_occupiedCellsCoordinates,
		);

		if (
			_movingWidgetSuggestedPosition.x !==
				ShiftWidgets.movingWidgetSuggestedPosition?.x &&
			_movingWidgetSuggestedPosition.y !==
				ShiftWidgets.movingWidgetSuggestedPosition?.y
		) {
			ShiftWidgets.matrix = _matrix;
			ShiftWidgets.matrixStringified = _matrixStringified;
			ShiftWidgets.matrixWithOccupiedCells = _occupiedMatrixCells.matrix;
			ShiftWidgets.movingWidgetSuggestedPosition =
				_movingWidgetSuggestedPosition;
		}

		if (_occupiedMatrixCells.collidingId) {
			console.log('COLLISION WITH: ', _occupiedMatrixCells.collidingId);
			const collidingIndex = this._sortedWidgets.findIndex(
				(w) => w.id === _occupiedMatrixCells.collidingId,
			);
			this._widgetsToShift = this._sortedWidgets.slice(collidingIndex);
			this._widgetsToKeep = this._sortedWidgets.slice(0, collidingIndex);

			this.sequentialShift();
		}
	}

	sequentialShift() {
		const occupiedCells = getMatrixCellCoordinatesFromWidgets(
			sortMatrixWidgetsByPosition([...this._widgetsToKeep, this._movingWidget]),
			this._matrixCellSize,
		);

		this._matrixKeepAndMoving = fillOccupiedMatrixCells(
			ShiftWidgets.matrix!,
			occupiedCells,
		);

		/**
		 * Here, for each widget, if they collide with another widget, Shift its position by
		 * looking for the next available position (ignoring latter widgets, but accounting for preceeding widgets).
		 */
		this._widgetsToShift.forEach((w: IWidget) => {
			if (w.id == this._movingWidget.id) {
				this._widgetsToKeep.push(w);
			}
			const newPosition = findAvailablePosition(
				this._containerSize,
				{ width: w.width, height: w.height },
				this._matrixCellSize,
				this._widgetsToKeep,
			);

			const widget = { ...w, x: newPosition.x, y: newPosition.y };

			this._widgetsToKeep.push(widget);
		});

		this._sortedWidgets = this._widgetsToKeep;
	}

	get shifted() {
		return this._sortedWidgets;
	}
}
