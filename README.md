# Packager

A lightweight and efficient binary serialization library for JavaScript/TypeScript that handles complex data structures and custom types.

## Features

- Binary serialization of JavaScript/TypeScript values
- Support for all primitive types (numbers, strings, booleans, etc.)
- Handles complex objects and arrays
- String deduplication for efficient storage
- Custom encoder/decoder support
- TypeScript support with full type definitions
- Zero dependencies
- Works in both Node.js and Deno

## Installation

```bash
# For Deno (using JSR)
deno add @online/packager
```

## Usage

### Basic Example

```typescript
import { pack, unpack } from "@online/packager";

// Pack data into a binary format
const data = {
  name: "John",
  age: 30,
  scores: [95, 87, 91]
};

const packed = pack(data);
// packed is now a Uint8Array containing the serialized data

// Unpack the binary data back into an object
const unpacked = unpack(packed);
console.log(unpacked);
// { name: "John", age: 30, scores: [95, 87, 91] }
```

### Using Custom Encoders/Decoders

You can transform values during serialization/deserialization using custom encoders and decoders:

```typescript
import { pack, unpack, type PackOptions, type UnpackOptions } from "@online/packager";

const packOptions: PackOptions = {
  encoder: (value) => {
    // Transform values before serialization
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }
};

const unpackOptions: UnpackOptions = {
  decoder: (value) => {
    // Transform values after deserialization
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value);
    }
    return value;
  }
};

const data = {
  name: "Event",
  date: new Date("2024-01-13")
};

const packed = pack(data, packOptions);
const unpacked = unpack(packed, unpackOptions);
```

### Binary Data Support

The library has built-in support for Uint8Array values:

```typescript
import { pack, unpack } from "@online/packager";

const binaryData = new Uint8Array([1, 2, 3, 4]);
const data = {
  id: "doc-123",
  content: binaryData
};

const packed = pack(data);
const unpacked = unpack(packed);
// unpacked.content is a Uint8Array([1, 2, 3, 4])
```

## API Reference

### pack(value: unknown, options?: Partial<PackOptions>): Uint8Array

Serializes any JavaScript value into a Uint8Array.

Options:
- `encoder`: Function to transform values before serialization
- `plainText`: If true, disables string deduplication
- `plainObject`: If true, disables object reference tracking
- `objectDatabase`: Custom object database for reference tracking
- `stringDatabase`: Custom string database for deduplication

### unpack<T>(packed: Uint8Array, options?: Partial<UnpackOptions>): T

Deserializes a packed Uint8Array back into its original value.

Options:
- `decoder`: Function to transform values after deserialization
- `objectDatabase`: Custom object database for reference tracking
- `stringDatabase`: Custom string database for deduplication

## License

MIT