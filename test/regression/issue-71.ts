import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import { PropertyEditedRecord } from '../../src/changes/index.js';

/**
 * https://github.com/flitbit/diff/issues/71
 *
 * Non-function toString will cause crash
 */
tap.test('issue-71', async (t) => {
  const subject = { left: 'yes', right: 'no' };
  const comparand = {
    left: {
      toString: true,
    },
    right: 'no',
  };

  const diff = new DeepDiff();
  const found = Array.from(diff.changes(subject, comparand));
  t.matchOnly(
    found,
    [new PropertyEditedRecord('#/left', subject.left, comparand.left)],
    'found wanted differences',
  );

  const text = diff.stringify(found);
  console.log(text);
  const deserialized = diff.parse(text);

  t.matchOnly(deserialized, found, 'deserialized equivalent');
});
