import { test, assertObjectMatch, assertEquals } from '@inspatial/test';
import { pack, unpack } from '../src/mod.ts';
import { Database } from '@online/tinyserializer';

interface TestData {
  name: string;
  value: number;
}

// Encoder that doubles numbers
const numberEncoder = (value: unknown) => {
  if (typeof value === 'number') {
    return value * 2;
  }
  return value;
};

// Decoder that halves numbers
const numberDecoder = (value: unknown) => {
  if (typeof value === 'number') {
    return value / 2;
  }
  return value;
};

test('should pack and unpack primitives correctly', () => {
  const testCases = [
    42,
    'test string',
    true,
    false,
    null,
    undefined,
    [1, 2, 3],
    { a: 1, b: 2 },
  ];

  for (const testCase of testCases) {
    const packed = pack(testCase);
    const unpacked = unpack(packed);
    if (typeof unpacked === "object" && unpacked !== null) {
      assertObjectMatch(unpacked, testCase as any);
    } else {
      assertEquals(unpacked, testCase);
    }
  }
});

test('should handle nested objects and arrays', () => {
  const testData = {
    array: [1, 2, { nested: 'value' }],
    object: {
      nested: {
        array: [4, 5, 6],
      },
    },
  };

  const packed = pack(testData);
  const unpacked = unpack(packed) as object;
  assertObjectMatch(unpacked, testData);
});

test('should work with encoder and decoder', () => {
  const testData = {
    numbers: [1, 2, 3],
    nested: {
      value: 4,
    },
  };

  // Pack with encoder
  const packedWithEncoder = pack(testData, {
    encoder: numberEncoder,
  });

  // Unpack with decoder
  const unpackedWithDecoder = unpack(packedWithEncoder, {
    decoder: numberDecoder
  }) as object;

  // Original numbers should remain the same after encoding and decoding
  assertObjectMatch(unpackedWithDecoder, testData);
});

test('should handle string database', () => {
  const testData: TestData = {
    name: 'test',
    value: 123,
  };

  // Pack with string database enabled
  const packed = pack(testData, {
    plainText: false,
  });

  // Unpack with string database
  const unpacked = unpack<TestData>(packed);
  assertObjectMatch(unpacked, testData as any);
});

test('should handle object references', () => {
  const obj = { sharedProp: 'shared value' };
  const testData = {
    ref1: obj,
    ref2: obj, // Same object reference
  };

  // Pack with object references enabled
  const packed = pack(testData, {
    plainObject: false,
  });

  // Unpack with object references
  const unpacked = unpack(packed) as object;
  assertObjectMatch(unpacked, testData);
});

test('should handle custom database', () => {
  const customDb = new Database<string>([]);
  const testData = {
    message: 'Hello',
    repeated: 'Hello', // Same string
  };

  // Pack with custom string database
  const packed = pack(testData, {
    stringDatabase: customDb,
  });

  // Unpack with string database
  const unpacked = unpack(packed) as object;
  assertObjectMatch(unpacked, testData);
});

test('should handle both encoder and decoder with string database', () => {
  const testData = {
    numbers: [5, 10, 15],
    text: 'test',
  };

  // Pack with encoder and string database
  const packed = pack(testData, {
    encoder: numberEncoder,
    plainText: false,
  });

  // Unpack with decoder and string database
  const unpacked = unpack(packed, {
    decoder: numberDecoder,
  }) as object;

  assertObjectMatch(unpacked, testData);
});