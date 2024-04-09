import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import {
  PropertyEditedRecord,
  PropertyAddedRecord,
  PropertyRemovedRecord,
} from '../../src/changes/index.js';
import { PropertyChanges } from '../../src/types.js';

tap.test('DeepDiff', async (t) => {
  const diff = new DeepDiff();
  t.test('array subject', async (t) => {
    /**
     * When subject is a array, and comparand is a array,
     * it should compare strictly equal, or strictly unequal,
     * but, either side can be monkey patched, so dates are
     * checked for ill-advised (monkey-patched) structure.
     */
    t.test('array comparand', async (t) => {
      const subject = [];
      t.test('equal', async (t) => {
        const comparand = [];
        const found = Array.from(diff.changes(subject, comparand));
        t.matchOnly(found, [], 'empty results');
      });
      t.test('unequal', async (t) => {
        const comparand = [1];
        const found = Array.from(diff.changes(subject, comparand));
        t.matchOnly(found, [new PropertyAddedRecord([0], 1)], 'edit result');
      });
      t.test('equal (patched)', async (t) => {
        const subject = [1];
        const comparand = [1];
        // Ill-advised, but possible!
        comparand['foo'] = 'bar';
        const found = Array.from(diff.changes(subject, comparand));
        t.matchOnly(
          found,
          [new PropertyAddedRecord(['foo'], 'bar')],
          'new record result',
        );
      });
      const cases: [string, unknown[], unknown[], PropertyChanges][] = [
        ['item added (only)', [], [1], [new PropertyAddedRecord([0], 1)]],
        ['item deleted (only)', [1], [], [new PropertyRemovedRecord([0], 1)]],
        ['item edited (only)', [2], [1], [new PropertyEditedRecord([0], 2, 1)]],
        [
          'item deleted (middle)',
          [0, 1, 2, 3, 4, 5, 6, 7],
          [0, 1, 2, 3, 5, 6, 7],
          [new PropertyRemovedRecord([4], 4)],
        ],
        [
          'item added (front)',
          [1, 2, 3, 4, 5, 6, 7],
          [0, 1, 2, 3, 4, 5, 6, 7],
          [new PropertyAddedRecord([0], 0)],
        ],
        [
          'item added (middle)',
          [0, 1, 2, 3, 5, 6, 7],
          [0, 1, 2, 3, 4, 5, 6, 7],
          [new PropertyAddedRecord([4], 4)],
        ],
        [
          'items added (front, middle)',
          [1, 2, 3, 5, 6, 7],
          [0, 1, 2, 3, 4, 5, 6, 7],
          [new PropertyAddedRecord([0], 0), new PropertyAddedRecord([4], 4)],
        ],
        [
          'item edited (middle)',
          [0, 1, 2, 3, 4, 5, 6, 7],
          [0, 1, 2, 3, 8, 5, 6, 7],
          [new PropertyEditedRecord([4], 4, 8)],
        ],
        [
          'item deleted (end)',
          [0, 1, 2, 3, 4, 5, 6, 7],
          [0, 1, 2, 3, 4, 5, 6],
          [new PropertyRemovedRecord([7], 7)],
        ],
        [
          'item added (end)',
          [0, 1, 2, 3, 4, 5, 6],
          [0, 1, 2, 3, 4, 5, 6, 7],
          [new PropertyAddedRecord([7], 7)],
        ],
        [
          'item edited (end)',
          [0, 1, 2, 3, 4, 5, 6, 7],
          [0, 1, 2, 3, 4, 5, 6, 8],
          [new PropertyEditedRecord([7], 7, 8)],
        ],
        [
          'added below',
          [{ one: 1, two: 2 }],
          [{ one: 1, two: 2, three: 3 }],
          [new PropertyAddedRecord([0, 'three'], 3)],
        ],
        [
          'edited below',
          [{ one: 1, two: 3 }],
          [{ one: 1, two: 2 }],
          [new PropertyEditedRecord([0, 'two'], 3, 2)],
        ],
        [
          'deleted below',
          [{ one: 1, two: 2, three: 3 }],
          [{ one: 1, two: 2 }],
          [new PropertyRemovedRecord([0, 'three'], 3)],
        ],
        [
          'added center and end',
          ['a', 'few', 'elements'],
          ['a', 'few', 'more', 'other', 'elements', 'than', 'before'],
          [
            new PropertyEditedRecord('#/2', 'elements', 'more'),
            new PropertyAddedRecord('#/3', 'other'),
            new PropertyAddedRecord('#/4', 'elements'),
            new PropertyAddedRecord('#/5', 'than'),
            new PropertyAddedRecord('#/6', 'before'),
          ],
        ],
      ];
      for (const [name, subject, comparand, expect] of cases) {
        t.test(`comparand is ${name}`, async (t) => {
          const found = Array.from(diff.changes(subject, comparand));
          t.matchOnly(found, expect, 'expected changes');

          const original = JSON.parse(JSON.stringify(subject));
          // The differences can be applied...
          const changed = diff.apply(subject, found);
          t.matchOnly(changed, comparand, 'applied changes produce match');
          // The differences can be reverted...
          const reverted = diff.revert(subject, found);
          t.matchOnly(reverted, original, 'reverted changes produce original');
        });
      }
    });
    /**
     * When subject is array, and comparand is non-array, then all
     * structure comparisons are off. It should just be an edit.
     *      */
    t.test('non-date comparand', async (t) => {
      const subject = new Date();
      const fn = (): void => {};
      const regexp = /foo/;
      const sym = Symbol('foo');
      const cases: [string, unknown, PropertyChanges][] = [
        ['an array', [], [new PropertyEditedRecord([], subject, [])]],
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
