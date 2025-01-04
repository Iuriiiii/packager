import { pack, unpack } from "../mod.ts";
import { assertEquals } from "@std/assert";

function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomString(length: number) {
  let result = "";

  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑabcdefghijklmnopqrstuvwxyzáéíóúñ0123456789_()-$[]{}";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(
      Math.floor(Math.random() * charactersLength),
    );
  }

  return result;
}

const selfReferencedObject = {
  a: 1,
  b: {},
};

// @ts-ignore: just add new member
selfReferencedObject.c = selfReferencedObject;

const valuesToTest = [
  NaN,
  Infinity,
  -Infinity,
  0,
  -1,
  "AbC",
  127,
  128,
  -126,
  randomString(1000),
  null,
  undefined,
  true,
  false,
  65500,
  20000000,
  2 ** 31,
  4,
  "qw54dqw dqw165 d1qw65 d1qw96 4werf198wf8ew9f7ef79efe ",
  Array.from({ length: 1000 }).map(() => randomNumber(0, 2 ** 31)),
  Array.from({ length: 1000 }).map(() => randomNumber(-(2 ** 31), 0)),
  [1],
  [1, 2, 3, 4],
  [1, {}, selfReferencedObject, {
    a: 213213213,
    b: [
      1,
      [3, 4, 5],
      2 ** 31 - 1,
      "7",
      null,
      true,
      false,
      null,
      undefined,
      Infinity,
      randomString(1000),
    ],
  }, "hola"],
  [
    1,
    [3, 4, 5],
    6,
    "7",
    null,
    true,
    false,
    null,
    undefined,
    Infinity,
    randomString(100),
  ],
  {
    a: 213213213,
    b: [
      1,
      [3, 4, 5],
      2 ** 31 - 1,
      "7",
      null,
      true,
      false,
      null,
      undefined,
      Infinity,
      randomString(300),
    ],
  },
];

Deno.test("Encode", async (t) => {
  for (const value of valuesToTest) {
    if (typeof value !== "string") {
      continue;
    }

    const encode = (value: unknown) => {
      if (typeof value !== "string") {
        return value;
      }

      return 33;
    };

    await t.step(`Packed and unpacked value: ${value}`, () => {
      const packed = pack(value, { encoder: encode });
      const unpacked = unpack(packed);
      assertEquals(unpacked, 33 as unknown as string);
    });
  }
});
