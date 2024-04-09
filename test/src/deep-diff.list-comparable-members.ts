import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import {
  $sym,
  AllVehicleProperties,
  EnumerableVehicleProperties,
  addSymbol,
  makeVehicle,
} from '../common/utils.js';

tap.test('DeepDiff', async (t) => {
  t.test('.listComparableMembers()', async (t) => {
    const emptyList = [];
    // [
    //   description: string,
    //   value: any,
    //   expected: PropertyKey[]
    // ][]
    const tests = [
      ['undefined', undefined, emptyList],
      ['null', null, emptyList],
      ['a string', 'hi', emptyList],
      ['an empty string', '', emptyList],
      ['a number', 1, emptyList],
      ['a bigint', 1n, emptyList],
      ['a RegExp', new RegExp('.'), emptyList],
      ['a Math', Math, emptyList],
      ['an Array', [], emptyList],
      ['a function', (): void => {}, emptyList],
      ['empty object', {}, emptyList],
      ['object 1', { id: 1 }, ['id']],
      [
        'object (vehicle)',
        addSymbol(makeVehicle()),
        EnumerableVehicleProperties,
        AllVehicleProperties,
        EnumerableVehicleProperties.concat([$sym]),
        AllVehicleProperties.concat([$sym]),
      ],
    ];
    for (const [
      description,
      value,
      expected,
      nonPublic,
      symbols,
      nonPublicAndSymbols,
    ] of tests) {
      t.test(`when subject ${description}`, async (t) => {
        const it = new DeepDiff();
        const found = it.listComparableMembers(value);
        t.matchOnly(found, expected, 'returns expected list');
      });
      if (nonPublic) {
        t.test(
          `includeNonEnumerable: when subject ${description}`,
          async (t) => {
            const it = new DeepDiff({ includeNonEnumerable: true });
            const found = it.listComparableMembers(value);
            t.matchOnly(found, nonPublic, 'returns expected list');
          },
        );
      }
      if (symbols) {
        t.test(`symbols: when subject ${description}`, async (t) => {
          const it = new DeepDiff({ includeSymbols: true });
          const found = it.listComparableMembers(value);
          t.matchOnly(found, symbols, 'returns expected list');
        });
      }
      if (nonPublicAndSymbols) {
        t.test(
          `nonPublicAndSymbols: when subject ${description}`,
          async (t) => {
            const it = new DeepDiff({
              includeNonEnumerable: true,
              includeSymbols: true,
            });
            const found = it.listComparableMembers(value);
            t.matchOnly(found, nonPublicAndSymbols, 'returns expected list');
          },
        );
      }
    }
  });
});
