import tap from 'tap';
import { ExtendedTypeOf, extendedTypeOf } from '../../src/extended-type-of.js';

tap.test('fn extendedTypeOf()', async (t) => {
  const tests = [
    ['number', 1, ExtendedTypeOf.number],
    ['bigint', 1n, ExtendedTypeOf.bigint],
    ['string', 'hi', ExtendedTypeOf.string],
    ['empty string', '', ExtendedTypeOf.string],
    ['undefined', undefined, ExtendedTypeOf.undefined],
    ['object', {}, ExtendedTypeOf.object],
    ['Math', Math, ExtendedTypeOf.math],
    ['Date', new Date(), ExtendedTypeOf.date],
    ['RegExp', new RegExp(''), ExtendedTypeOf.regexp],
    ['Array', [], ExtendedTypeOf.array],
    ['function', (): void => {}, ExtendedTypeOf.function],
    ['Null', null, ExtendedTypeOf.null],
  ];

  for (const [what, it, expect] of tests) {
    t.test(`when subject is a ${what}`, async (t) => {
      const found = extendedTypeOf(it);
      t.equal(found, expect, `result is ${expect}`);
    });
  }
});
