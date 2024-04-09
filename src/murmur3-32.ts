// Adapted from https://github.com/pid/murmurHash3js's x86 version of murmur3
// murmurHash3js bears the following MIT license:
//
// The MIT License (MIT)
// Copyright (c) 2012-2015 Karan Lyons, Sascha Droste
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//
// ============================================================================
// Our modifications are for speed; primarily inlining the functions [multiply,
// rotl, and final-mix]. Essentially, we made it a lot harder to understand,
// but removed several clock-cycles.

export function murmur3Hash32(key = '', seed = 0): number {
  //
  // Given a string and an optional seed as an int, returns a 32 bit hash
  // using the x86 flavor of MurmurHash3, as an unsigned int.
  //
  const remainder = key.length % 4;
  const bytes = key.length - remainder;

  let h1 = seed;
  let k1 = 0;

  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  let i = 0;
  while (i < bytes) {
    k1 =
      (key.charCodeAt(i) & 0xff) |
      ((key.charCodeAt(i + 1) & 0xff) << 8) |
      ((key.charCodeAt(i + 2) & 0xff) << 16) |
      ((key.charCodeAt(i + 3) & 0xff) << 24);

    k1 = (k1 & 0xffff) * c1 + ((((k1 >>> 16) * c1) & 0xffff) << 16);
    k1 = (k1 << 15) | (k1 >>> (32 - 15));
    k1 = (k1 & 0xffff) * c2 + ((((k1 >>> 16) * c2) & 0xffff) << 16);

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> (32 - 13));
    h1 = (h1 & 0xffff) * 5 + ((((h1 >>> 16) * 5) & 0xffff) << 16) + 0xe6546b64;
    i += 4;
  }

  k1 = 0;

  switch (remainder) {
    case 3:
      k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
      k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
      k1 ^= key.charCodeAt(i) & 0xff;
      k1 = (k1 & 0xffff) * c1 + ((((k1 >>> 16) * c1) & 0xffff) << 16);
      k1 = (k1 << 15) | (k1 >>> (32 - 15));
      k1 = (k1 & 0xffff) * c2 + ((((k1 >>> 16) * c2) & 0xffff) << 16);
      h1 ^= k1;
      break;

    case 2:
      k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
      k1 ^= key.charCodeAt(i) & 0xff;
      k1 = (k1 & 0xffff) * c1 + ((((k1 >>> 16) * c1) & 0xffff) << 16);
      k1 = (k1 << 15) | (k1 >>> (32 - 15));
      k1 = (k1 & 0xffff) * c2 + ((((k1 >>> 16) * c2) & 0xffff) << 16);
      h1 ^= k1;
      break;
    case 1:
      k1 ^= key.charCodeAt(i) & 0xff;
      k1 = (k1 & 0xffff) * c1 + ((((k1 >>> 16) * c1) & 0xffff) << 16);
      k1 = (k1 << 15) | (k1 >>> (32 - 15));
      k1 = (k1 & 0xffff) * c2 + ((((k1 >>> 16) * c2) & 0xffff) << 16);
      h1 ^= k1;
      break;
  }

  h1 ^= key.length;
  // final mix
  h1 ^= h1 >>> 16;
  h1 =
    (h1 & 0xffff) * 0x85ebca6b + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16);
  h1 ^= h1 >>> 13;
  h1 =
    (h1 & 0xffff) * 0xc2b2ae35 + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16);
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}
