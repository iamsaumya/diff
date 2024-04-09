import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import { PropertyEditedRecord } from '../../src/changes/index.js';

/**
 * https://github.com/flitbit/diff/issues/5
 */
tap.test('issue-5', async (t) => {
  // Rewritten to be valid Typescript and semantics of v2.x

  const subject = {
    a: 'a',
    a1: [
      {
        b1: 'b1',
        b2: { c1: 'c1' },
        b3: 'b3',
      },
    ],
  };

  const comparand = {
    a: 'a',
    a1: [
      {
        b1: 'b1',
        b3: null,
        b2: null,
      },
    ],
  };

  const diff = new DeepDiff();

  const found = Array.from(diff.changes(subject, comparand));
  const expect = [
    new PropertyEditedRecord('#/a1/0/b3', subject.a1[0].b3, comparand.a1[0].b3),
    new PropertyEditedRecord('#/a1/0/b2', subject.a1[0].b2, comparand.a1[0].b2),
  ];
  t.matchOnly(found, expect, 'matches expected changes');
});
