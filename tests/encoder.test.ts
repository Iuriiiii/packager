// deno-lint-ignore-file no-explicit-any
import { test, assertEquals, assertObjectMatch } from "@inspatial/test";
import { pack, unpack } from "../src/mod.ts";

test("pack and unpack with default encoder/decoder", () => {
  const value = { key: "value", nested: { number: 42 } };
  const packed = pack(value);
  const unpacked = unpack<any>(packed);

  assertEquals(unpacked, value);
});

test("pack and unpack with custom encoder/decoder", () => {
  const encoder = (value: any) => {
    return JSON.stringify(value).toUpperCase();
  };
  const decoder = (value: any) => {
    return typeof value === "string" ? JSON.parse(value.toLowerCase()) : value;
  };

  const value = { key: "value", array: [1, 2, 3] };
  const packed = pack(value, { encoder });
  const unpacked = unpack<any>(packed, { decoder });

  assertEquals(unpacked, value);
});

test("pack and unpack with additional options", () => {
  const value = ["a", "b", "c"];
  const options = {};

  const packed = pack(value, options);
  const unpacked = unpack<any>(packed, options);

  assertEquals(unpacked, value);
});

test("pack and unpack with complex nested structures", () => {
  const value = {
    key: "value",
    array: [1, 2, { nestedKey: "nestedValue" }],
    map: [["key", "value"]],
  };
  const packed = pack(value);
  const unpacked = unpack<any>(packed);

  assertObjectMatch(unpacked, value);
});
