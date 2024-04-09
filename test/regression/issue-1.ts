import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import { PropertyEditedRecord } from '../../src/changes/index.js';

/**
 * https://github.com/flitbit/diff/issues/1
 * https://github.com/flitbit/diff/issues/2
 */
tap.test('issue-1, issue-2', async (t) => {
  // Rewritten to be valid Typescript and semantics of v2.x

  const subject = {
    name: 'my object',
  };

  const comparand = null;

  const diff = new DeepDiff();

  t.test('comparand is null', async (t) => {
    const found = Array.from(diff.changes(subject, comparand));
    const expect = [new PropertyEditedRecord('#', subject, comparand)];
    t.matchOnly(found, expect, 'matches expected changes');
  });

  t.test('subject is null', async (t) => {
    const found = Array.from(diff.changes(comparand, subject));
    const expect = [new PropertyEditedRecord('#', comparand, subject)];
    t.matchOnly(found, expect, 'matches expected changes');
  });
});
