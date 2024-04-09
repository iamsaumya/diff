import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import { DEFAULT_ACCESSOR, DEFAULT_MUTATOR } from '../../src/constants.js';
import { PropertyEditedRecord } from '../../src/changes/property-edited-record.js';

/**
 * https://github.com/flitbit/diff/issues/14
 *
 * added function which reverts a single change item
 */
tap.test('issue-14', async (t) => {
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
  const changes = [
    new PropertyEditedRecord('#/a1/0/b3', subject.a1[0].b3, comparand.a1[0].b3),
    new PropertyEditedRecord('#/a1/0/b2', subject.a1[0].b2, comparand.a1[0].b2),
  ];
  t.matchOnly(found, changes, 'matches expected changes');

  // Apply the changes to the subject...
  diff.apply(subject, changes);
  t.matchOnly(subject, comparand, 'subject and comparand match');

  // Revert one change...
  changes[0].revert(subject, true, 0, DEFAULT_ACCESSOR, DEFAULT_MUTATOR);
  t.equal(subject.a1[0].b3, changes[0].subject, 'property was restored');
});
