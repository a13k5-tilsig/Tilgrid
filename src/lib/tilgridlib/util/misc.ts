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
