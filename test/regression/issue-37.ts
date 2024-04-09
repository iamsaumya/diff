import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import { PropertyAddedRecord } from '../../src/changes/index.js';

/**
 * https://github.com/flitbit/diff/issues/37
 *
 * Diffing array is very inefficient if deletion/addition occurs anywhere but
 * at the end of the array
 */
tap.test('issue-37', async (t) => {
  // Rewritten to be valid Typescript and semantics of v2.x

  const subject = ['h', 'a', 'p', 'p', 'y'];
  const comparand = ['c', 'h', 'a', 'p', 'p', 'y'];
  const diff = new DeepDiff();
  const found = Array.from(diff.changes(subject, comparand));

  const wanted = [new PropertyAddedRecord('#/0', comparand[0])];
  t.matchOnly(found, wanted, 'found wanted differences');

  const original = JSON.parse(JSON.stringify(subject));

  // The differences can be applied...
  const changed = diff.apply(subject, found);
  t.matchOnly(changed, comparand, 'applied changes produce match');

  // The differences can be reverted...
  const reverted = diff.revert(subject, found);
  t.matchOnly(reverted, original, 'reverted changes produce original');
});
