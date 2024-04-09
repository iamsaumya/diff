import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import {
  PropertyAddedRecord,
  PropertyEditedRecord,
} from '../../src/changes/index.js';

/**
 * https://github.com/flitbit/diff/issues/48
 *
 * Taking diff of two array's not working
 */
tap.test('issue-48', async (t) => {
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

  const wanted = [
    new PropertyEditedRecord('#/name', subject.name, comparand.name),
    new PropertyEditedRecord(
      '#/details/with/2',
      subject.details.with[2],
      comparand.details.with[2],
    ),
    new PropertyAddedRecord('#/details/with/3', comparand.details.with[3]),
    new PropertyAddedRecord('#/details/with/4', comparand.details.with[4]),
  ];
  t.matchOnly(found, wanted, 'found wanted differences');

  const clone = (it): unknown => JSON.parse(JSON.stringify(it));

  const original = clone(subject);

  // The differences can be applied...
  // ... note the changes are applied to arrays in reverse order!
  const applied = diff.apply(subject, found.reverse());
  t.matchOnly(applied, comparand, 'applied changes produce match');

  // The differences can be reverted...
  const reverted = diff.revert(subject, found.reverse());
  t.matchOnly(reverted, original, 'reverted changes produce original');
});
