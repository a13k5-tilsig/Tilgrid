import type { IPosition, ISize, IWidget } from '../types/widget.ts';

/**
 * Convert a given amount of pixels into its value in matrix blocks.
 *
 * @returns rounded down (floored) px divided by blockSize.
 */
function fromPxToMatrixBlocks(pixels: number, matrixBlockSize: number): number {
	return Math.floor(pixels / matrixBlockSize);
}

function fromMatrixBlocksToPx(blocks: number, matrixBlockSize: number): number {
	return blocks * matrixBlockSize;
}

/**
 * @returns a 2D matrix filled with zeroes matching the given dimensions.
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
 * Places a "1" in occupied matrix blocks.
 *
 * @param matrix - A 2D array representing rows and columns.
 * @param items - A 2D array where index[0] represents a row and index[1] represents a column.
 * @returns a 2D matrix where occupied blocks are filled with the number "1".
 */
function fillOccupiedMatrixBlocks(
	matrix: number[][],
	blockLocations: any[][]
): number[][] {
	let _matrix: number[][] = [...matrix];
	blockLocations.forEach((i: number[]) => {
		_matrix[i[0]][i[1]] = 1;
	});
	return _matrix;
}

/**
 * @returns what cells in a matrix a widget occupies by X & Y coordinates.
 */
function getMatrixBlockPositionsFromWidgets(
	widgets: IWidget[],
	blockSize: number
): number[][] {
	let occupiedMatrixBlocks: number[][] = [];
	widgets.forEach((w: IWidget) => {
		let widgetMatrixBlockHeight = fromPxToMatrixBlocks(w.h, blockSize);
		let widgetMatrixBlockWidth = fromPxToMatrixBlocks(w.w, blockSize);
		let widgetMatrixPositionFromTop = fromPxToMatrixBlocks(w.y, blockSize);
		let widgetMatrixPositionFromLeft = fromPxToMatrixBlocks(w.x, blockSize);
		for (let height = 0; height < widgetMatrixBlockHeight; height++) {
			for (let width = 0; width < widgetMatrixBlockWidth; width++) {
				occupiedMatrixBlocks.push([
					widgetMatrixPositionFromTop + height,
					widgetMatrixPositionFromLeft + width
				]);
			}
		}
	});
	return occupiedMatrixBlocks;
}

/**
 * Finds space for a new widget in between all other widgets.
 * This is to avoid widgets shifting position in order
 * to make room for the new widget at position 0.0.
 *
 * Returns position in the matrix where the widget can be positioned.
 *
 * @returns { x: number, y: number }
 */
export function findAvailablePosition(
	containerSize: ISize,
	snappingArea: number,
	initialWidgetSize: ISize,
	widgets: IWidget[]
): IPosition | undefined {
	const matrix = makeMatrix(
		fromPxToMatrixBlocks(containerSize.h, snappingArea),
		fromPxToMatrixBlocks(containerSize.w, snappingArea)
	);

	//console.log('matrix:', matrix);

	const occupiedMatrixBlockLocations = getMatrixBlockPositionsFromWidgets(
		widgets,
		snappingArea
	);

	//console.log('occupiedMatrixBlockLocations:', occupiedMatrixBlockLocations);

	const filledMatrix = fillOccupiedMatrixBlocks(
		matrix,
		occupiedMatrixBlockLocations
	);

	//console.log('filledMatrix:', filledMatrix);

	const widgetMatrix = makeMatrix(
		fromPxToMatrixBlocks(initialWidgetSize.h, snappingArea),
		fromPxToMatrixBlocks(initialWidgetSize.w, snappingArea)
	);

	//console.log('widgetMatrix:', widgetMatrix);

	/**
	 * sliding window (the brute force approach).
	 */

	const windowHeight = widgetMatrix.length;
	const windowWidth = widgetMatrix[0].length;
	const targetHeightMinusWindow = filledMatrix.length - windowHeight + 1;
	const targetWidthMinusWindow = filledMatrix[0].length - windowWidth + 1;

	// Target height.
	for (let th = 0; th < targetHeightMinusWindow; th++) {
		// Target width.
		for (let tw = 0; tw < targetWidthMinusWindow; tw++) {
			let window = [];

			// Window height.
			for (let wh = 0; wh < windowHeight; wh++) {
				let windowCollumn = [];

				// Window width.
				for (let ww = 0; ww < windowWidth; ww++) {
					windowCollumn.push(filledMatrix[th + wh][tw + ww]);
				}
				window.push(windowCollumn);
			}

			if (JSON.stringify(window) === JSON.stringify(widgetMatrix)) {
				return {
					x: fromMatrixBlocksToPx(tw, snappingArea),
					y: fromMatrixBlocksToPx(th, snappingArea)
				};
			}
		}
	}
}
