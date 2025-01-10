
/**
 * Checks if the provided value is an instance of Uint8Array.
 * 
 * @param value - The value to check.
 * @returns A boolean indicating whether the value is a Uint8Array.
 */
export function isUint8array(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array;
}
