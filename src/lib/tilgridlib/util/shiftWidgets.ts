import type { IPosition, ISize, IWidget } from '../types/widget';
import {
	makeMatrix,
	findAvailablePosition,
	fromPxToMatrixCells,
	fromMatrixCellsToPx,
} from './widget';

type IWidgetMap = Record<string, number[][]>;
type IWidgetIdMatrix = (number | string)[][];

interface IWidgetMatrixCollision {
	collidingId: string | null;
	matrix: IWidgetIdMatrix;
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
				if (occupiedMatrixCellsMap[w.id] === undefined) {
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

export class ShiftWidgets {
	movingWidget: IWidget;
	suggestedPos: IPosition;
	widgets: IWidget[];
	containerSize: ISize;
	matrixCellSize: number;

	containerMatrix: number[][];
	sortedWidgets: IWidget[];

	occupiedCellCoordinates: IWidgetMap;
	occupiedCells: IWidgetMatrixCollision;

	widgetsToShift: IWidget[];
	widgetsToStay: IWidget[];

	constructor(
		movingWidget: IWidget,
		suggestedPos: IPosition,
		widgets: IWidget[],
		containerSize: ISize,
		matrixCellSize: number,
	) {
		this.movingWidget = movingWidget;
		this.suggestedPos = suggestedPos;
		this.widgets = widgets;
		this.containerSize = containerSize;
		this.matrixCellSize = matrixCellSize;

		this.containerMatrix = [];
		this.sortedWidgets = [];

		this.occupiedCellCoordinates = {};
		this.occupiedCells = { collidingId: null, matrix: [] };

		this.widgetsToShift = [];
		this.widgetsToStay = [];

		this.setup();
	}

	setup() {
		// [1] Sort the widgets by their position, for predictable order-of-operation.
		this.sortedWidgets = sortMatrixWidgetsByPosition(this.widgets);

		// [2] Make a matrix matching the conatiner.
		this.containerMatrix = makeMatrix(
			fromPxToMatrixCells(this.containerSize.width, this.matrixCellSize),
			fromPxToMatrixCells(this.containerSize.height, this.matrixCellSize),
		);

		// [3] Map all occupied matrix cells to their widget IDs.
		this.occupiedCellCoordinates = getMappedMatrixCellCoordinatesFromWidgets(
			this.sortedWidgets,
			this.matrixCellSize,
		);

		// [4] Write the IDs of the widgets to the cells they occupy.
		this.occupiedCells = fillOccupiedMatrixCellsWithWidgetId(
			this.containerMatrix,
			this.occupiedCellCoordinates,
		);

		// [5] Act on a widget-collision.
		if (this.occupiedCells.collidingId != null) {
			console.log('COLLISION WITH: ', this.occupiedCells.collidingId);

			// Remove the moving widget from the array to avoid conflict for now.
			const indexOfMoving = this.sortedWidgets.findIndex(
				(w: IWidget) => w.id === this.movingWidget.id,
			);
			this.sortedWidgets.splice(indexOfMoving);

			const collidingIndex = this.sortedWidgets.findIndex(
				(w) => w.id === this.occupiedCells.collidingId,
			);

			this.widgetsToShift = this.sortedWidgets.slice(collidingIndex);
			this.widgetsToStay = this.sortedWidgets.slice(0, collidingIndex);

			this.sequantialShift();
		}
	}

	sequantialShift() {
		console.log('running sequantialShift!');
		console.log('widgetsToShift: ', JSON.stringify(this.widgetsToShift));

		this.widgetsToShift.forEach((w: IWidget) => {
			const newPosition = findAvailablePosition(
				this.containerSize,
				{ width: w.width, height: w.height },
				this.matrixCellSize,
				this.widgetsToStay,
			);

			this.widgetsToStay.push({
				...w,
				x: newPosition.x,
				y: newPosition.y,
			});
		});

		this.sortedWidgets = [...this.widgetsToStay, this.movingWidget];
	}

	get shifted() {
		return this.sortedWidgets;
	}
}
