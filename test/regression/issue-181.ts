import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import {
  PropertyAddedRecord,
  PropertyEditedRecord,
} from '../../src/changes/index.js';

/**
 * https://github.com/flitbit/diff/issues/181
 */
tap.test('issue-181', async (t) => {
  // Rewritten to be valid Typescript and semantics of v2.x

  const subject = {
    name: 'my object',
    description: "it's an object!",
    details: {
      it: 'has',
      an: 'array',
      with: ['a', 'few', 'elements'],
    },
  };

  const comparand = {
    name: 'updated object',
    description: "it's an object!",
    details: {
      it: 'has',
      an: 'array',
      with: ['a', 'few', 'more', 'elements', { than: 'before' }],
    },
  };

  const diff = new DeepDiff();
  const found = Array.from(diff.changes(subject, comparand));

  const expect = [
    new PropertyEditedRecord('#/name', subject.name, comparand.name),
    new PropertyEditedRecord(
      '#/details/with/2',
      subject.details.with[2],
      comparand.details.with[2],
    ),
    new PropertyAddedRecord('#/details/with/3', comparand.details.with[3]),
    new PropertyAddedRecord('#/details/with/4', comparand.details.with[4]),
  ];
  t.matchOnly(found, expect, 'matches expected changes');
});
