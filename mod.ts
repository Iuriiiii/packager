import type {
  Decoder,
  DeserializeFunction,
  DeserializeOptions,
  Encoder,
  RequireAtLeastOne,
  SerializedClass,
  SerializeOptions,
  SerializerFunction,
} from "@online/tinyserializer/types";
import { SerializableClass } from "@online/tinyserializer/types";
import {
  Database,
  deserialize,
  Serializable,
  serialize,
} from "@online/tinyserializer";
import {
  uInt8ArrayDeserializer,
  uInt8ArraySerializer,
} from "@online/tinyserializers";
import { isUint8array } from "./src/mod.ts";
import { isArray } from "@online/is";

export type {
  Decoder,
  DeserializeFunction,
  Encoder,
  RequireAtLeastOne,
  SerializedClass,
  SerializerFunction,
};
export { Serializable, SerializableClass };

export interface PackOptions {
  stringDatabaseKeyName: string;
  objectDatabaseKeyName: string;
  valueKeyName: string;
}

export function pack(
  value: unknown,
  options?: Partial<PackOptions & SerializeOptions>,
): Uint8Array {
  const serializers: SerializerFunction[] =
    (options?.serializers ? options.serializers : []).concat(
      uInt8ArraySerializer,
    );

  const sanitizedOptions = { ...options, serializers };

  const { value: serializedValue, stringDatabase } = serialize(
    value,
    sanitizedOptions,
  );

  if (stringDatabase.isEmpty()) {
    return serializedValue;
  }

  const { value: serializedStringDatabase } = serialize(
    stringDatabase,
    { ...sanitizedOptions, plainText: true },
  );

  return serialize([
    serializedStringDatabase,
    serializedValue,
  ], sanitizedOptions).value;
}

export function unpack<T>(
  packed: Uint8Array,
  options?: Partial<PackOptions & DeserializeOptions>,
): T {
  const deserializers: DeserializeFunction[] =
    (options?.deserializers ? options.deserializers : []).concat(
      uInt8ArrayDeserializer,
    );
  const sanitizedOptions = { ...options, deserializers };

  const { value: unpacked } = deserialize<Uint8Array>(
    packed,
    sanitizedOptions,
  );

  if (
    isArray(unpacked) &&
    unpacked.length === 2 &&
    isUint8array(unpacked[0]) &&
    isUint8array(unpacked[1])
  ) {
    const [serializedStringDatabase, serializedValue] = unpacked;

    const { value: deserializedStringDatabase } = deserialize<string[]>(
      serializedStringDatabase,
      sanitizedOptions,
    );

    const stringDatabase = new Database<string>(deserializedStringDatabase);

    const { value } = deserialize<T>(serializedValue, {
      stringDatabase,
      ...sanitizedOptions,
    });

    return value;
  }

  return unpacked as T;
}
