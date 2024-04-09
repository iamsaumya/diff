import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import { PropertyEditedRecord } from '../../src/changes/index.js';

/**
 * https://github.com/flitbit/diff/issues/72
 *
 * Array order?
 */
tap.test('issue-72', async (t) => {
  const subject = { data: [1, 2, 3] };
  const comparand = { data: [4, 5, 1] };

  const diff = new DeepDiff();
  const found = Array.from(diff.changes(subject, comparand));
  t.matchOnly(
    found,
    [
      new PropertyEditedRecord('#/data/0', subject.data[0], comparand.data[0]),
      new PropertyEditedRecord('#/data/1', subject.data[1], comparand.data[1]),
      new PropertyEditedRecord('#/data/2', subject.data[2], comparand.data[2]),
    ],
    'found wanted differences',
  );

  const original = JSON.parse(JSON.stringify(subject));

  // The differences can be applied...
  const changed = diff.apply(subject, found);
  t.matchOnly(changed, comparand, 'applied changes produce matching');

  // The differences can be reverted...
  const reverted = diff.revert(changed, found);
  t.matchOnly(reverted, original, 'reverted changes produce original');
});
