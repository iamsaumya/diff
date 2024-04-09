import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import { PropertyAddedRecord } from '../../src/changes/index.js';

/**
 * https://github.com/flitbit/diff/issues/17
 *
 * A question about applying a diff.
 */
tap.test('issue-17', async (t) => {
  // Rewritten to be valid Typescript and semantics of v2.x

  const subject = [1, 2, 3, 4];
  const comparand = [1, 2, 3, 4, 5, 6, 7];

  const diff = new DeepDiff();

  const found = Array.from(diff.changes(subject, comparand));
  const expect = [
    new PropertyAddedRecord('#/4', 5),
    new PropertyAddedRecord('#/5', 6),
    new PropertyAddedRecord('#/6', 7),
  ];
  t.matchOnly(found, expect, 'matches expected changes');
});
