import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import {
  PropertyAddedRecord,
  PropertyEditedRecord,
  PropertyRemovedRecord,
} from '../../src/changes/index.js';

/**
 * https://github.com/flitbit/diff/issues/59
 *
 * stringify changed values of type "object"
 */
tap.test('issue-59', async (t) => {
  const subject = { one: 1, two: 2, three: 'three' };
  const comparand = { two: 'two', three: 3, four: 'four' };

  const diff = new DeepDiff();
  const found = Array.from(diff.changes(subject, comparand));
  t.matchOnly(
    found,
    [
      new PropertyRemovedRecord('#/one', subject.one),
      new PropertyEditedRecord('#/two', subject.two, comparand.two),
      new PropertyEditedRecord('#/three', subject.three, comparand.three),
      new PropertyAddedRecord('#/four', comparand.four),
    ],
    'found wanted differences',
  );

  const text = diff.stringify(found);
  console.log(text);
  const deserialized = diff.parse(text);

  t.matchOnly(deserialized, found, 'deserialized equivalent');
});
