import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import { ChangeRecord } from '../../src/changes/index.js';

/**
 * https://github.com/flitbit/diff/issues/32
 *
 * Diff returns undefined
 *
 */
tap.test('issue-32', async (t) => {
  // Rewritten to be valid Typescript and semantics of v2.x

  const subject = { name: 'my object' };
  const comparand = subject;

  const diff = new DeepDiff();

  // In version 2.x, the diff behavior is implemented as a generator function,
  // so the result is never undefined...
  const generator = diff.changes(subject, comparand);

  // ... and it can be iterated over
  for (const change of generator) {
    t.ok(change instanceof ChangeRecord);
  }

  // ... and you can create an array from it...
  const changes = Array.from(diff.changes(subject, comparand));
  t.matchOnly(changes, [], 'expected empty changes');
});
