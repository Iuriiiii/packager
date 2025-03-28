import type {
  DeserializeFunction,
  DeserializeOptions,
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
import { isUint8array } from "./validators/mod.ts";
import { isArray } from "@online/is";
import type { Decoder, Encoder } from "./types/mod.ts";

export type {
  Decoder,
  DeserializeFunction,
  Encoder,
  RequireAtLeastOne,
  SerializedClass,
  SerializerFunction,
};
export { Serializable, SerializableClass };

export interface PackOptions extends SerializeOptions {
  /**
   * The encoder to use when serializing values.
   * It is triggered before the value is serialized.
   */
  encoder: Encoder;
}

export interface UnpackOptions extends DeserializeOptions {
  /**
   * The decoder to use when deserializing values.
   * It is triggered after the value is deserialized.
   */
  decoder: Decoder;
}

/**
 * Pack a value into a Uint8Array. If the value contains strings, it will also
 * serialize a string database and return a Uint8Array containing the
 * serialized string database and the serialized value.
 *
 * @param value The value to pack.
 * @param options Options to pass to the serializer and the packer.
 *
 * @returns A Uint8Array containing the packed value.
 */
export function pack(
  value: unknown,
  options?: Partial<PackOptions>,
): Uint8Array {
  const serializableValue = options?.encoder ? options.encoder(value) : value;
  const serializers: SerializerFunction[] = (options?.serializers ?? []).concat(
    uInt8ArraySerializer,
  );

  const sanitizedOptions = { ...options, serializers };

  const { value: serializedValue, stringDatabase } = serialize(
    serializableValue,
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

/**
 * Unpack a Uint8Array into a value. If the Uint8Array contains a string
 * database, it will also deserialize the string database and return the
 * deserialized value.
 *
 * @param packed The Uint8Array containing the packed value.
 * @param options Options to pass to the deserializer and the unpacker.
 *
 * @returns The unpacked value.
 */
export function unpack<T>(
  packed: Uint8Array,
  options?: Partial<UnpackOptions>,
): T {
  const deserializers: DeserializeFunction[] = (options?.deserializers ?? [])
    .concat(
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

    return options?.decoder ? options.decoder(value) : value;
  }

  return options?.decoder ? options.decoder(unpacked) : unpacked as T;
}
