import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import {
  PropertyRemovedRecord,
  PropertyEditedRecord,
  PropertyAddedRecord,
} from '../../src/changes/index.js';
import { PropertyChanges } from '../../src/types.js';

tap.test('DeepDiff', async (t) => {
  const diff = new DeepDiff();
  t.test('date subject', async (t) => {
    /**
     * When subject is a date, and comparand is a date,
     * it should compare strictly equal, or strictly unequal,
     * but, either side can be monkey patched, so dates are
     * checked for ill-advised (monkey-patched) structure.
     */
    t.test('date comparand', async (t) => {
      t.test('equal', async (t) => {
        const subject = new Date();
        const comparand = new Date(subject.valueOf());
        const found = Array.from(diff.changes(subject, comparand));
        t.matchOnly(found, [], 'empty results');
      });
      t.test('unequal', async (t) => {
        const subject = new Date();
        const comparand = new Date(subject.valueOf() + 1);
        const found = Array.from(diff.changes(subject, comparand));
        t.matchOnly(
          found,
          [new PropertyEditedRecord([], subject, comparand)],
          'edit result',
        );
      });
      t.test('equal (patched)', async (t) => {
        const subject = new Date();
        const comparand = new Date(subject.valueOf());
        // Ill-advised, but possible!
        comparand['foo'] = 'bar';
        const found = Array.from(diff.changes(subject, comparand));
        t.matchOnly(
          found,
          [new PropertyAddedRecord(['foo'], 'bar')],
          'new record result',
        );
      });
    });
    /**
     * When subject is date, and comparand is non-date, all
     * structure comparisons are off. It should just be an edit.
     */
    t.test('non-date comparand', async (t) => {
      const subject = new Date();
      const fn = (): void => {};
      const regexp = /foo/;
      const sym = Symbol('foo');
      const cases: [string, unknown, PropertyChanges][] = [
        ['a bigint', 1n, [new PropertyEditedRecord([], subject, 1n)]],
        ['a function', fn, [new PropertyEditedRecord([], subject, fn)]],
        ['a Math', Math, [new PropertyEditedRecord([], subject, Math)]],
        ['null', null, [new PropertyEditedRecord([], subject, null)]],
        ['number', 1, [new PropertyEditedRecord([], subject, 1)]],
        ['object', {}, [new PropertyEditedRecord([], subject, {})]],
        ['regexp', regexp, [new PropertyEditedRecord([], subject, regexp)]],
        ['an empty string', '', [new PropertyEditedRecord([], subject, '')]],
        ['string', 'foo', [new PropertyEditedRecord([], subject, 'foo')]],
        ['symbol', sym, [new PropertyEditedRecord([], subject, sym)]],
      ];
      for (const [name, comparand, expect] of cases) {
        t.test(`comparand is ${name}`, async (t) => {
          const found = Array.from(diff.changes(subject, comparand));
          t.matchOnly(found, expect, 'no changes');
        });
      }
      t.test(`comparand is undefined`, async (t) => {
        const found = Array.from(diff.changes(subject, undefined));
        t.matchOnly(
          found,
          [new PropertyRemovedRecord([], subject)],
          'a delete',
        );
      });
    });
  });
});
