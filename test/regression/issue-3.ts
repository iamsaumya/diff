import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';

/**
 * https://github.com/flitbit/diff/issues/3
 *
 * Apply diff to ad different object
 */
tap.test('issue-3', async (t) => {
  // Rewritten to be valid Typescript and semantics of v2.x

  const subject = { noChange: 'same', levelOne: { levelTwo: 'value' } };
  const comparand = {
    noChange: 'same',
    levelOne: { levelTwo: 'another value' },
  };

  const expect = { levelOne: { levelTwo: 'another value' } };

  const diff = new DeepDiff();

  const found = Array.from(diff.changes(subject, comparand));
  const other = {};

  // Applies changes...
  diff.apply(other, found);
  t.matchOnly(other, expect, 'matches expected changes');
});
