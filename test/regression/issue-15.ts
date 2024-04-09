import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';

/**
 * https://github.com/flitbit/diff/issues/15
 *
 * shows no difference when you compare two NaN
 */
tap.test('issue-15', async (t) => {
  // Rewritten to be valid Typescript and semantics of v2.x

  const subject = NaN;
  const comparand = NaN;

  const diff = new DeepDiff();

  const found = Array.from(diff.changes(subject, comparand));
  const expect = [];
  t.matchOnly(found, expect, 'matches expected (empty) changes');
});
