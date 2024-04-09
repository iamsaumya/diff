import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';

/**
 * https://github.com/flitbit/diff/issues/49
 *
 * Object.create(null) causes error
 */
tap.test('issue-49', async (t) => {
  // Rewritten to be valid Typescript and semantics of v2.x

  const subject = Object.create(null);
  const comparand = {};
  const diff = new DeepDiff();
  const found = Array.from(diff.changes(subject, comparand));

  t.matchOnly(found, [], 'found no differences');

  // Process again with the objects swapped...

  const again = Array.from(diff.changes(comparand, subject));
  t.matchOnly(again, [], 'found no differences');
});
