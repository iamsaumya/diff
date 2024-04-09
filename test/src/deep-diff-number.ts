import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import {
  PropertyRemovedRecord,
  PropertyEditedRecord,
} from '../../src/changes/index.js';
import { PropertyChanges } from '../../src/types.js';

tap.test('DeepDiff', async (t) => {
  const diff = new DeepDiff();
  t.test('NaN subject', async (t) => {
    const subject = NaN;
    const cases: [string, unknown, PropertyChanges][] = [
      ['NaN', NaN, []],
      [
        'upper bound',
        Number.MAX_VALUE,
        [new PropertyEditedRecord([], subject, Number.MAX_VALUE)],
      ],
      [
        'positive infinity',
        Number.POSITIVE_INFINITY,
        [new PropertyEditedRecord([], subject, Number.POSITIVE_INFINITY)],
      ],
      [
        'negative infinity',
        Number.NEGATIVE_INFINITY,
        [new PropertyEditedRecord([], subject, Number.NEGATIVE_INFINITY)],
      ],
    ];
    for (const [name, comparand, expect] of cases) {
      t.test(`comparand is ${name}`, async (t) => {
        const found = Array.from(diff.changes(subject, comparand));
        t.matchOnly(found, expect, 'no changes');
      });
    }
    t.test(`comparand is undefined`, async (t) => {
      const found = Array.from(diff.changes(subject, undefined));
      t.matchOnly(found, [new PropertyRemovedRecord([], subject)], 'a delete');
    });
  });

  t.test('number comparand', async (t) => {
    const subject = 1;
    const cases: [string, unknown, PropertyChanges][] = [
      [
        'plus one',
        subject + 1,
        [new PropertyEditedRecord([], subject, subject + 1)],
      ],
      ['minus one', 1n, [new PropertyEditedRecord([], subject, 1n)]],
      [
        'lower bound',
        Number.MIN_VALUE,
        [new PropertyEditedRecord([], subject, Number.MIN_VALUE)],
      ],
      [
        'upper bound',
        Number.MAX_VALUE,
        [new PropertyEditedRecord([], subject, Number.MAX_VALUE)],
      ],
      ['NaN', NaN, [new PropertyEditedRecord([], subject, NaN)]],
      [
        'positive infinity',
        Number.POSITIVE_INFINITY,
        [new PropertyEditedRecord([], subject, Number.POSITIVE_INFINITY)],
      ],
      [
        'negative infinity',
        Number.NEGATIVE_INFINITY,
        [new PropertyEditedRecord([], subject, Number.NEGATIVE_INFINITY)],
      ],
    ];
    for (const [name, comparand, expect] of cases) {
      t.test(`comparand is ${name}`, async (t) => {
        const found = Array.from(diff.changes(subject, comparand));
        t.matchOnly(found, expect, 'no changes');
      });
    }
  });

  t.test('non-date comparand', async (t) => {
    const subject = 1;
    const date = new Date();
    const fn = (): void => {};
    const regexp = /foo/;
    const sym = Symbol('foo');
    const cases: [string, unknown, PropertyChanges][] = [
      ['an date', date, [new PropertyEditedRecord([], subject, date)]],
      ['a bigint', 1n, [new PropertyEditedRecord([], subject, 1n)]],
      ['a function', fn, [new PropertyEditedRecord([], subject, fn)]],
      ['a Math', Math, [new PropertyEditedRecord([], subject, Math)]],
      ['null', null, [new PropertyEditedRecord([], subject, null)]],
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
      t.matchOnly(found, [new PropertyRemovedRecord([], subject)], 'a delete');
    });
  });
});
