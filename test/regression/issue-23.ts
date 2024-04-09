import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import { PropertyRemovedRecord } from '../../src/changes/index.js';

/**
 * https://github.com/flitbit/diff/issues/23
 *
 * Determine Shallow Change
 */
tap.test('issue-23', async (t) => {
  // Rewritten to be valid Typescript and semantics of v2.x

  const subject = [
    {
      name: 'Panda',
      types: ['red', 'white'],
      food: 'bamboo',
    },
    {
      name: 'Monkey',
      types: ['brown', 'white'],
      food: 'bananas',
    },
  ];

  const comparand = [
    {
      name: 'Monkey',
      types: ['brown', 'white'],
      food: 'bananas',
    },
  ];

  const diff = new DeepDiff();
  const found = Array.from(diff.changes(subject, comparand));
  const wanted = [new PropertyRemovedRecord('#/0', subject[0])];

  t.matchOnly(found, wanted, 'matches expected changes');

  const original = JSON.parse(JSON.stringify(subject));

  // The differences can be applied...
  const changed = diff.apply(subject, found);
  t.matchOnly(changed, comparand, 'applied changes produce matching');

  // The differences can be reverted...
  const reverted = diff.revert(subject, found);
  t.matchOnly(reverted, original, 'reverted changes produce original');
});
