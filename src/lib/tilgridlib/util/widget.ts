import type { IPosition, ISize, IWidget } from '../types/widget.ts';

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
 * Returns a 2D matrix with cells containing zeroes matching the given dimensions.
 *
 * @param rows - Amount of rows (vertical cells).
 * @param columns - Amount of collumns (horizontal cells).
 * @returns \[\[some, amount, of, zeroes\], \[some, amount, of, zeroes\], ...\]
 */
function makeMatrix(rows: number, columns: number): number[][] {
	let _rows = [];
	for (let row = 0; row < rows; row++) {
		let _columns = [];
		for (let col = 0; col < columns; col++) {
			_columns.push(0);
		}
		_rows.push(_columns);
	}
	return _rows;
}

/**
 * Places a "1" in occupied matrix cells.
 *
 * @param matrix - A 2D array representing rows and columns.
 * @param items - A 2D array where index\[0\] represents a row and index\[1\] represents a column.
 * @returns example: \[\[1, 1, 1, 0, 0, 0\], \[1, 1, 1, 0, 0, 0\]\].
 */
function fillOccupiedMatrixCells(
	matrix: number[][],
	cellCoordinates: any[][]
): number[][] {
	const filler = 1;
	let _matrix: number[][] = [...matrix];
	cellCoordinates.forEach((i: number[]) => {
		_matrix[i[0]][i[1]] = filler;
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
	matrixCellSize: number
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
					widgetMatrixPositionFromLeft + w
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
	widgets: IWidget[]
): IPosition {
	const containerMatrix = makeMatrix(
		fromPxToMatrixCells(containerSize.height, snappingArea),
		fromPxToMatrixCells(containerSize.width, snappingArea)
	);

	const widgetMatrix = makeMatrix(
		fromPxToMatrixCells(widgetSize.height, snappingArea),
		fromPxToMatrixCells(widgetSize.width, snappingArea)
	);

	// To be used for finding matching matrix in the container matrix.
	const widgetMatrixStringified = JSON.stringify(widgetMatrix);

	const occupiedMatrixCellCoordinates = getMatrixCellCoordinatesFromWidgets(
		widgets,
		snappingArea
	);

	const filledMatrix = fillOccupiedMatrixCells(
		containerMatrix,
		occupiedMatrixCellCoordinates
	);

	/**
	 * sliding window (the brute force approach).
	 */

	const windowHeight = widgetMatrix.length;
	const windowWidth = widgetMatrix[0].length;
	// + 1 to reach the last cell on each axis.
	const targetHeight = filledMatrix.length - windowHeight + 1;
	const targetWidth = filledMatrix[0].length - windowWidth + 1;

	// Target height.
	for (let th = 0; th < targetHeight; th++) {
		// Target width.
		for (let tw = 0; tw < targetWidth; tw++) {
			let window = [];

			/*
			 * TODO:
			 * Do this using slices (or something equal) to avoid the
			 * ugly nesting.
			 */

			// Window height.
			for (let wh = 0; wh < windowHeight; wh++) {
				let windowCollumn = [];

				// Window width.
				for (let ww = 0; ww < windowWidth; ww++) {
					windowCollumn.push(filledMatrix[th + wh][tw + ww]);
				}
				window.push(windowCollumn);
			}

			if (JSON.stringify(window) === widgetMatrixStringified) {
				return {
					x: fromMatrixCellsToPx(tw, snappingArea),
					y: fromMatrixCellsToPx(th, snappingArea)
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
