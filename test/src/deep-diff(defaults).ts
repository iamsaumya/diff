import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import {
  addSymbol,
  addSymbolToRandom,
  copy,
  makeVehicle,
  makeVehicles,
  rand,
} from '../common/utils.js';
import { faker } from '@faker-js/faker';

tap.test('DeepDiff', async (t) => {
  t.test('defaults', async (t) => {
    const includeNonEnumerable = false;
    const includeSymbols = false;
    const it = new DeepDiff();
    t.test('.hashString()', async (t) => {
      t.test('is pure', async (t) => {
        for (let i = 0; i < 100; ++i) {
          const value = faker.lorem.paragraph();
          const a = it.hashString(value);
          const b = it.hashString(value);
          t.equal(b, a, 'produces same hash');
        }
      });
    });

    t.test('.hashObject()', async (t) => {
      for (let i = 0; i < 100; ++i) {
        const vehicle = makeVehicle();
        const other = addSymbol(
          copy(vehicle, includeNonEnumerable, includeSymbols),
        );
        const wanted = it.hashObject(vehicle);
        const found = it.hashObject(other);
        t.equal(found, wanted, 'produces same hash');
      }
    });

    t.test('.hashArray()', async (t) => {
      for (let i = 0; i < 100; ++i) {
        const arr = addSymbolToRandom(makeVehicles(rand(1, 100)));
        const other = arr.map((v) =>
          copy(v, includeNonEnumerable, includeSymbols),
        );
        const wanted = it.hashArray(arr);
        const found = it.hashArray(other);
        t.equal(found, wanted, 'produces same hash');
      }
    });

    t.test('.hashUnknown()', async (t) => {
      for (let i = 0; i < 100; ++i) {
        const arr = addSymbolToRandom(makeVehicles(rand(1, 100)));
        const other = arr.map((v) =>
          copy(v, includeNonEnumerable, includeSymbols),
        );
        const wanted = it.hashUnknown(arr);
        const found = it.hashUnknown(other);
        t.equal(found, wanted, 'produces same hash');
      }
    });
  });
});
