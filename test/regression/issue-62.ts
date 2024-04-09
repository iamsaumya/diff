import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';

/**
 * https://github.com/flitbit/diff/issues/62
 *
 * deep-diff does not handle cycles
 */
tap.test('issue-62', async (t) => {
  // https://github.com/flitbit/diff/issues/62#issuecomment-229549984
  // 3: appears to be fixed, probably in fixing #74.

  const a: Record<string, unknown> = {};
  const b: Record<string, unknown> = {};
  a.x = b;
  b.x = b;

  const diff = new DeepDiff();
  const found = Array.from(diff.changes(a, b));
  const wanted = [];

  t.matchOnly(found, wanted, 'found no differences');

  a.x = a; // Change to a

  const cycles = Array.from(diff.changes(a, b));

  t.matchOnly(cycles, found, 'deserialized equivalent');
});
