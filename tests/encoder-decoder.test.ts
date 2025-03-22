import { assertEquals, assertObjectMatch, test } from "@inspatial/test";
import { pack, Serializable, SerializableClass, unpack } from "../src/mod.ts";

// Helper function to create circular reference objects
function createCircularObject() {
  const obj: Record<string, unknown> = { foo: "bar" };
  obj.self = obj;
  return obj;
}

// Helper function to create objects with methods
@Serializable()
class TestClass extends SerializableClass {
  value: string;
  constructor(value: string) {
    super();
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }
}

test("encoder handles primitive values", () => {
  const testCases = [
    42,
    "hello",
    true,
    null,
    undefined,
    NaN,
    Infinity,
    -Infinity,
  ];

  testCases.forEach((value) => {
    const encoder = (v: unknown) => v;
    const packed = pack(value, { encoder });
    const unpacked = unpack(packed);
    assertEquals(unpacked, value);
  });
});

test("encoder handles nested objects", () => {
  const data = {
    name: "test",
    details: {
      age: 25,
      scores: [90, 85, 95],
      metadata: {
        createdAt: "2024-01-13",
        valid: true,
      },
    },
  };

  const encoder = (v: unknown) => v;
  const packed = pack(data, { encoder });
  const unpacked = unpack(packed);
  assertObjectMatch(unpacked as Record<string, unknown>, data);
});

test("encoder handles arrays with mixed types", () => {
  const data = [
    1,
    "string",
    true,
    { key: "value" },
    [1, 2, 3],
    null,
    undefined,
  ];

  const encoder = (v: unknown) => v;
  const packed = pack(data, { encoder });
  const unpacked = unpack(packed);
  assertEquals(unpacked, data);
});

test("encoder handles Date objects", () => {
  const date = new Date("2024-01-13T12:00:00Z");
  const encoder = (v: unknown) => {
    if (v instanceof Date) {
      return {
        type: "Date",
        value: v.toISOString(),
      };
    }
    return v;
  };

  const decoder = (v: unknown) => {
    if (
      v && typeof v === "object" && "type" in v && v.type === "Date" &&
      "value" in v
    ) {
      return new Date(v.value as string);
    }
    return v;
  };

  const packed = pack(date, { encoder });
  const unpacked = unpack<Date>(packed, { decoder });
  assertEquals(unpacked.toISOString(), date.toISOString());
});

test("encoder handles Map objects", () => {
  const map = new Map<string, unknown>([
    ["key1", "value1"],
    ["key2", 42],
  ]);

  const encoder = (v: unknown) => {
    if (v instanceof Map) {
      return {
        type: "Map",
        value: Array.from(v.entries()),
      };
    }
    return v;
  };

  const decoder = (v: unknown) => {
    if (
      v && typeof v === "object" && "type" in v && v.type === "Map" &&
      "value" in v
    ) {
      return new Map(v.value as Array<[unknown, unknown]>);
    }
    return v;
  };

  const packed = pack(map, { encoder });
  const unpacked = unpack(packed, { decoder });
  assertEquals(unpacked instanceof Map, true);
  assertEquals(Array.from(unpacked as Map<unknown, unknown>), Array.from(map));
});

test("encoder handles Set objects", () => {
  const set = new Set([1, 2, "three", { four: 4 }]);

  const encoder = (v: unknown) => {
    if (v instanceof Set) {
      return {
        type: "Set",
        value: Array.from(v.values()),
      };
    }
    return v;
  };

  const decoder = (v: unknown) => {
    if (
      v && typeof v === "object" && "type" in v && v.type === "Set" &&
      "value" in v
    ) {
      return new Set(v.value as Array<unknown>);
    }
    return v;
  };

  const packed = pack(set, { encoder });
  const unpacked = unpack(packed, { decoder });
  assertEquals(unpacked instanceof Set, true);
  assertEquals(Array.from(unpacked as Set<unknown>), Array.from(set));
});

test("encoder handles circular references", () => {
  const obj = createCircularObject();
  const visited = new WeakSet();

  const encoder = (v: unknown) => {
    if (typeof v === "object" && v !== null) {
      if (visited.has(v as object)) {
        return "[Circular]";
      }
      visited.add(v as object);
    }
    return v;
  };

  const packed = pack(obj, { encoder });
  const unpacked = unpack(packed);
  const ref = unpacked as Record<string, unknown>;

  assertEquals(
    ref.self,
    ref,
  );
});

test("encoder handles class instances", () => {
  const instance = new TestClass("test value");

  const encoder = (v: unknown) => {
    if (v instanceof TestClass) {
      return {
        type: "TestClass",
        value: v.value,
      };
    }
    return v;
  };

  const decoder = (v: unknown) => {
    if (
      v && typeof v === "object" && "type" in v && v.type === "TestClass" &&
      "value" in v
    ) {
      return new TestClass(v.value as string);
    }
    return v;
  };

  const packed = pack(instance, { encoder });
  const unpacked = unpack(packed, { decoder });
  assertEquals(unpacked instanceof TestClass, true);
  assertEquals((unpacked as TestClass).getValue(), instance.getValue());
});

test("encoder handles transformation of values", () => {
  const data = {
    secretKey: "sensitive-data",
    publicKey: "public-data",
  };

  const encoder = (v: unknown) => {
    if (
      typeof v === "object" && v !== null && "secretKey" in v &&
      typeof v.secretKey === "string"
    ) {
      return {
        ...v,
        secretKey: "*".repeat(v.secretKey.length),
      };
    }
    return v;
  };

  const packed = pack(data, { encoder });
  const unpacked = unpack(packed);
  assertEquals(
    (unpacked as Record<string, string>).secretKey,
    "*".repeat(data.secretKey.length),
  );
  assertEquals((unpacked as Record<string, string>).publicKey, data.publicKey);
});

test("encoder and decoder work together for complex transformations", () => {
  const data = {
    date: new Date("2024-01-13T12:00:00Z"),
    map: new Map([["key", "value"]]),
    set: new Set([1, 2, 3]),
    instance: new TestClass("test"),
  };

  const encoder = (v: unknown): unknown => {
    if (!(v && typeof v === "object")) {
      return v;
    }

    if (Array.isArray(v)) {
      return v.map((item) => encoder(item));
    }

    if (v instanceof Date) {
      return { type: "Date", value: v.toISOString() };
    }
    if (v instanceof Map) {
      return { type: "Map", value: Array.from(v.entries()) };
    }
    if (v instanceof Set) {
      return { type: "Set", value: Array.from(v.values()) };
    }
    if (v instanceof TestClass) {
      return { type: "TestClass", value: v.value };
    }

    // Handle plain objects
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(v)) {
      result[key] = encoder(value);
    }
    return result;
  };

  const decoder = (v: unknown): unknown => {
    if (!(v && typeof v === "object")) {
      return v;
    }

    if (Array.isArray(v)) {
      return v.map((item) => decoder(item));
    }

    if ("type" in v && "value" in v) {
      switch (v.type) {
        case "Date":
          return new Date(v.value as string);
        case "Map":
          return new Map(v.value as Array<[unknown, unknown]>);
        case "Set":
          return new Set(v.value as Array<unknown>);
        case "TestClass":
          return new TestClass(v.value as string);
      }
    }

    // Handle plain objects
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(v)) {
      result[key] = decoder(value);
    }
    return result;
  };

  const packed = pack(data, { encoder });
  const unpacked = unpack(packed, { decoder });

  assertEquals(unpacked instanceof Object, true);
  const result = unpacked as Record<string, unknown>;
  assertEquals(result.date instanceof Date, true);
  assertEquals(result.map instanceof Map, true);
  assertEquals(result.set instanceof Set, true);
  assertEquals(result.instance instanceof TestClass, true);

  // Verify values match
  assertEquals((result.date as Date).toISOString(), data.date.toISOString());
  assertEquals(
    Array.from((result.map as Map<string, string>).entries()),
    Array.from(data.map.entries()),
  );
  assertEquals(
    Array.from((result.set as Set<number>).values()),
    Array.from(data.set.values()),
  );
  assertEquals(
    (result.instance as TestClass).value,
    data.instance.value,
  );
});
