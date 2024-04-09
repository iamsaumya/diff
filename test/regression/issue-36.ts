import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import { PropertyEditedRecord } from '../../src/changes/index.js';

/**
 * https://github.com/flitbit/diff/issues/36
 *
 * Stricter type checking among object types
 */
tap.test('issue-36', (t) => {
  // Rewritten to be valid Typescript and semantics of v2.x

  const diff = new DeepDiff();
  t.test('empty array subject, empty object comparand', (t) => {
    const subject = [];
    const comparand = {};

    const found = Array.from(diff.changes(subject, comparand));
    const wanted = [new PropertyEditedRecord('#', subject, comparand)];
    t.matchOnly(found, wanted, 'found root change');
    t.end();
  });

  t.test('array subject, object comparand', (t) => {
    const subject = ['a', 'b', 'c'];
    const comparand = { a: 1, b: 2, c: 3 };

    const found = Array.from(diff.changes(subject, comparand));
    const wanted = [new PropertyEditedRecord('#', subject, comparand)];
    t.matchOnly(found, wanted, 'found root change');
    t.end();
  });

  t.test('object subject, regex comparand', (t) => {
    const subject = {};
    const comparand = /surely these are different!/gi;

    const found = Array.from(diff.changes(subject, comparand));
    const wanted = [new PropertyEditedRecord('#', subject, comparand)];
    t.matchOnly(found, wanted, 'found root change');
    t.end();
  });

  t.test('object subject, array comparand', (t) => {
    const subject = { a: 1 };
    const comparand = [1];

    const found = Array.from(diff.changes(subject, comparand));
    const wanted = [new PropertyEditedRecord('#', subject, comparand)];
    t.matchOnly(found, wanted, 'found root change');
    t.end();
  });

  t.end();
});
