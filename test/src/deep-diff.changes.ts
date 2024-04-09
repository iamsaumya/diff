import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import {
  PropertyEditedRecord,
  PropertyAddedRecord,
  PropertyRemovedRecord,
} from '../../src/changes/index.js';

tap.test('DeepDiff', async (t) => {
  t.test('.changes()', async (t) => {
    const diff = new DeepDiff();
    const sym = Symbol('sym');
    const obj = [];
    const now = new Date();
    const fn = (): void => {};
    const tests = [
      ['object', obj, obj],
      ['empty string', '', ''],
      ['string', 'hi', 'hi'],
      ['symbol', sym, sym],
      ['number', 1, 1],
      ['bigint', 1n, 1n],
      ['undefined', undefined, undefined],
      ['math', Math, Math],
      ['date', new RegExp(''), new RegExp('')],
      ['regexp', now, now],
      ['function', fn, fn],
    ];

    for (const [type, left, right] of tests) {
      t.test(`recognizes two equal ${String(type)}s as equal`, async (t) => {
        const changes = Array.from(diff.changes(left, right));
        t.equal(changes.length, 0, 'no changes');
      });
    }
    t.test(`recognizes deletion (objects 1 level)`, async (t) => {
      const left = {
        one: 1,
        two: 2,
        three: 3,
      };
      const right = {
        one: 1,
        three: 3,
      };
      const changes = Array.from(diff.changes(left, right));
      t.equal(changes.length, 1, 'one change');
      t.matchOnly(
        changes,
        [new PropertyRemovedRecord(['two'], left.two)],
        'deleted',
      );
    });
    t.test(`recognizes deeper changes`, async (t) => {
      const tests: [string, object, object, object[]][] = [
        [
          'add below level 1',
          {
            one: 1,
            two: 2,
            three: 3,
            four: {
              five: 4,
            },
          },
          {
            one: 1,
            two: 2,
            three: 3,
            four: { five: 4, six: 7 },
          },
          [new PropertyAddedRecord(['four', 'six'], 7)],
        ],
        [
          'delete and edit, 2-levels',
          {
            one: 1,
            two: 2,
            three: 3,
            four: {
              five: 4,
            },
          },
          {
            one: 1,
            three: 3,
            four: { five: 6 },
          },
          [
            new PropertyRemovedRecord(['two'], 2),
            new PropertyEditedRecord(['four', 'five'], 4, 6),
          ],
        ],
        [
          'small union',
          {
            one: 1,
            two: 2,
            three: 3n,
          },
          {
            three: 3,
            four: 4,
            five: { six: 6, seven: 'seven' },
          },
          [
            new PropertyRemovedRecord(['one'], 1),
            new PropertyEditedRecord(['three'], 3n, 3),
            new PropertyRemovedRecord(['two'], 2),
            new PropertyAddedRecord(['four'], 4),
            new PropertyAddedRecord(['five'], { six: 6, seven: 'seven' }),
          ],
        ],
      ];
      for (const [what, left, right, wanted] of tests) {
        t.test(what, async (t) => {
          const found = Array.from(diff.changes(left, right));
          t.equal(found.length, wanted.length, 'equal changes');
          t.matchOnly(found, wanted, 'observes expected changes');
        });
      }
    });
  });
});
