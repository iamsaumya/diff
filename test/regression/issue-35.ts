import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import { PropertyRemovedRecord } from '../../src/changes/index.js';

/**
 * https://github.com/flitbit/diff/issues/35
 *
 * Taking diff of two array's not working
 */
tap.test('issue-35', async (t) => {
  // Rewritten to be valid Typescript and semantics of v2.x

  const subject = ['a', 'a', 'a'];
  const comparand = ['a'];
  const diff = new DeepDiff();
  const found = Array.from(diff.changes(subject, comparand));

  const wanted = [
    new PropertyRemovedRecord('#/1', subject[1]),
    new PropertyRemovedRecord('#/2', subject[2]),
  ];
  t.matchOnly(found, wanted, 'found wanted differences');

  const original = JSON.parse(JSON.stringify(subject));

  // The differences can be applied...
  // ... note the changes are applied to arrays in reverse order!
  const changed = diff.apply(subject, found.reverse());
  t.matchOnly(changed, comparand, 'applied changes produce matching');

  // The differences can be reverted...
  const reverted = diff.revert(subject, found.reverse());
  t.matchOnly(reverted, original, 'reverted changes produce original');
});
