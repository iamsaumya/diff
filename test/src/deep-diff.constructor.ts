import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';

tap.test('DeepDiff', async (t) => {
  t.test('.constructor', async (t) => {
    t.test('succeeds with no arguments', async (t) => {
      const it = new DeepDiff();
      t.equal(
        it.includeNonEnumerable,
        DeepDiff.DEFAULT_OPTIONS.includeNonEnumerable,
        '.includesNonPublic is default',
      );
      t.equal(
        it.includeSymbols,
        DeepDiff.DEFAULT_OPTIONS.includeSymbols,
        '.includesSymbols is default',
      );
    });
    t.test('conveys includeNonEnumerable when specified (true)', async (t) => {
      const includeNonEnumerable = true;
      const it = new DeepDiff({ includeNonEnumerable });
      t.equal(
        it.includeNonEnumerable,
        includeNonEnumerable,
        '.includeNonEnumerable was ',
      );
    });
    t.test('conveys includeNonEnumerable when specified (false)', async (t) => {
      const includeNonEnumerable = false;
      const it = new DeepDiff({ includeNonEnumerable });
      t.equal(
        it.includeNonEnumerable,
        includeNonEnumerable,
        '.includeNonEnumerable was set',
      );
    });
    t.test('conveys includeSymbols when specified (true)', async (t) => {
      const includeSymbols = true;
      const it = new DeepDiff({ includeSymbols });
      t.equal(it.includeSymbols, includeSymbols, '.includeSymbols was set');
    });
    t.test('conveys includeSymbols when specified (false)', async (t) => {
      const includeSymbols = false;
      const it = new DeepDiff({ includeSymbols });
      t.equal(it.includeSymbols, includeSymbols, '.includeSymbols was set');
    });
  });
});
