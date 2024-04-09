import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import { PropertyEditedRecord } from '../../src/changes/index.js';

/**
 * https://github.com/flitbit/diff/issues/7
 */
tap.test('issue-7', async (t) => {
  // Rewritten to be valid Typescript and semantics of v2.x

  const subject = { key: new Date(555555555555) };
  const comparand = { key: new Date(777777777777) };

  const diff = new DeepDiff();

  const found = Array.from(diff.changes(subject, comparand));
  const expect = [
    new PropertyEditedRecord('#/key', subject.key, comparand.key),
  ];
  t.matchOnly(found, expect, 'matches expected changes');
});
