export function isUint8array(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array;
}
